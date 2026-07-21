/* =========================================================
   AgenTurf — moteur du simulateur Quinté+
   Basé sur la maquette validée ; les données viennent de
   window.QUINTE_SIM_CFG.race (JSON « Quinté du jour »).
   Ajouts : compte à rebours, photo-finish, confettis.
   ========================================================= */
(function () {
"use strict";

const CFG = window.QUINTE_SIM_CFG || {};
const RACE = CFG.race || {};
const HORSES = RACE.horses || [];
const SCENARIOS = RACE.scenarios || [];
const META = RACE.meta || {};
const DIST = META.distance || 2400;
if (!HORSES.length || !document.getElementById("cv")) return;

let scenario = SCENARIOS[0];
const $ = id => document.getElementById(id);

/* ---------- scénarios ---------- */
const scBox = $("scenarios");
SCENARIOS.forEach((s, i) => {
  const b = document.createElement("button");
  b.className = "scn" + (i === 0 ? " active" : "");
  b.innerHTML = `<h3>${s.title}</h3><p>${s.desc}</p><span class="prob">Probabilité estimée ${s.prob}</span>`;
  b.onclick = () => {
    document.querySelectorAll(".scn").forEach(x => x.classList.remove("active"));
    b.classList.add("active"); scenario = s; resetRace(true);
    say(`Scénario chargé : ${s.title.replace(/^[①-⑳] /, "")}. Lance la course !`, true);
  };
  scBox.appendChild(b);
});

/* ---------- fiches partants ---------- */
const cards = $("cards");
HORSES.forEach(h => {
  const d = document.createElement("div"); d.className = "horse";
  const tags = (h.tags || []).map(t => `<span class="tag ${t[0]}">${t[1]}</span>`).join("");
  d.innerHTML = `
   <div class="silkbig" style="background:${h.c[0]}"><span>${h.n}</span></div>
   <div>
     <h4>${h.name}</h4>
     <div class="sub">${h.jockey} · ${h.w} kg · corde ${h.draw} · val. ${h.val} · cote ${h.odds}</div>
     <p>${h.note}</p>${tags}
   </div>`;
  cards.appendChild(d);
});

/* =========================================================
   MOTEUR DE COURSE
   ========================================================= */
const cv = $("cv"), ctx = cv.getContext("2d");
const W = 1020, H = 560;

/* --- géométrie piste : stade, sens horaire (corde à droite) --- */
const T = { cx: W / 2, cy: H / 2 + 18, straight: 330, r: 150, lanes: 15, laneW: 8.5 };
const PERIM = 2 * T.straight + 2 * Math.PI * T.r;
function TP(d, lane) {
  const R = T.r + lane * T.laneW;
  const hs = T.straight / 2;
  const arc = Math.PI * T.r;
  let s = ((d % PERIM) + PERIM) % PERIM;
  const cl = T.cx - hs, cr = T.cx + hs;
  if (s < hs) return { x: T.cx - s, y: T.cy + R, ang: Math.PI };
  s -= hs;
  if (s < arc) { const f = s / arc;
    return { x: cl - R * Math.sin(f * Math.PI), y: T.cy + R * Math.cos(f * Math.PI) }; }
  s -= arc;
  if (s < T.straight) return { x: cl + s, y: T.cy - R };
  s -= T.straight;
  if (s < arc) { const f = s / arc;
    return { x: cr + R * Math.sin(f * Math.PI), y: T.cy - R * Math.cos(f * Math.PI) }; }
  s -= arc;
  return { x: cr - s, y: T.cy + R };
}

const M = PERIM / DIST; // 1 tour = la distance du jour, arrivée au centre de la droite basse

let runners = [], running = false, finished = false, raf = null, tSim = 0;
let commentFlags = {}, finishCount = 0, confetti = [];
const closerNames = HORSES.filter(h => h.style === "closer").map(h => h.name).slice(0, 2).join(" et ") || "les finisseurs";

function styleProfile(style) {
  if (style === "leader")  return f => f < .25 ? 1.045 : f < .75 ? 1.005 : .974;
  if (style === "stalker") return f => f < .25 ? 1.015 : f < .8 ? 1.0 : 1.014;
  if (style === "closer")  return f => f < .3 ? .958 : f < .72 ? .992 : 1.05;
  return f => 1.0;
}

function resetRace(soft) {
  cancelAnimationFrame(raf); running = false; finished = false; tSim = 0;
  commentFlags = {}; finishCount = 0; confetti = [];
  $("resultbox").style.display = "none";
  $("btnStart").disabled = false;
  $("count").innerHTML = "";
  const chaos = scenario.chaos || 1;
  runners = HORSES.map(h => {
    const bias = (scenario.bias && scenario.bias[h.n]) || 1;
    const wAdj = (56 - h.w) * 0.9;
    const drawAdj = h.draw >= 12 ? -1.6 : h.draw <= 4 ? .7 : 0;
    const base = (h.ab + wAdj + drawAdj) * bias;
    const luck = 1 + (Math.random() * 2 - 1) * 0.028 * h.vol * chaos;
    return {
      h, prof: styleProfile(h.style),
      /* écart d'aptitude compressé (x0.35) pour des arrivées serrées et réalistes */
      speed0: 16.2 * (1 + (base / 86 - 1) * 0.35) * luck,
      dist: 0, done: false, timeFin: 0,
      lane: 1 + Math.min(h.draw - 1, 10) * 0.32 + Math.random() * .3,
      phase: Math.random() * Math.PI * 2,
      wob: .8 + Math.random() * .6,
    };
  });
  if (!soft) say("Nouvelle simulation prête. Les chevaux retournent aux stalles.", false);
  drawFrame(0);
  renderStandings();
}

function say(txt, hot) {
  const p = document.createElement("p"); p.textContent = txt; if (hot) p.className = "hot";
  $("feed").appendChild(p);
  $("feed").scrollTop = 0;
}

function renderStandings() {
  const order = [...runners].sort((a, b) => b.dist - a.dist);
  const lead = order[0]?.dist || 0;
  $("standings").innerHTML = order.slice(0, 8).map((r, i) => {
    const back = (lead - r.dist) / 2.6;
    return `<div class="strow">
      <span class="pos">${i + 1}${i === 0 ? "ᵉʳ" : "ᵉ"}</span>
      <span class="silk" style="background:${r.h.c[0]}"></span>
      <span class="num">${r.h.n}</span> ${r.h.name}
      <span class="gap">${i === 0 ? (r.done ? "🏁" : "en tête") : back < 0.4 ? "nez" : back.toFixed(1) + " L"}</span>
    </div>`;
  }).join("");
}

/* --- dessin --- */
function drawTrack() {
  ctx.clearRect(0, 0, W, H);
  const sky = ctx.createLinearGradient(0, 0, 0, H * .24);
  sky.addColorStop(0, "#a8c8e4"); sky.addColorStop(1, "#cfe0cd");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * .24);
  ctx.fillStyle = "#2f7d46"; ctx.fillRect(0, H * .24, W, H * .76);
  ctx.fillStyle = "rgba(18,32,58,.25)";
  for (let i = 0; i < 9; i++) ctx.fillRect(70 + i * 32, H * .24 - 26, 22, 26);
  ctx.fillStyle = "rgba(18,32,58,.5)"; ctx.fillRect(60, H * .24 - 6, 300, 6);

  const inner = T.r - 14, outer = T.r + T.lanes * T.laneW + 16;
  ring(outer, "#3b8f52"); ring(outer - 3, "#57a86b");
  ring(outer - 6, "#4f9e63");
  ringBand(inner, outer - 8, "#57a86b");
  ringFill(inner, "#2c7040");
  ring(inner, "#ffffff", 2.5); ring(outer - 8, "#ffffff", 2.5);
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.setLineDash([7, 5]);
  ctx.beginPath(); ctx.moveTo(T.cx, T.cy + inner + 2); ctx.lineTo(T.cx, T.cy + outer - 8); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#e4322b"; ctx.fillRect(T.cx - 2, T.cy + outer - 4, 4, 18);
  ctx.font = "700 13px 'Barlow Condensed'"; ctx.fillStyle = "#fff";
  ctx.fillText("ARRIVÉE", T.cx - 26, T.cy + outer + 30);
  // nom de l'hippodrome au centre
  ctx.fillStyle = "rgba(255,255,255,.45)";
  ctx.font = "900 30px 'Barlow Condensed'"; ctx.textAlign = "center";
  ctx.fillText((META.track || "") + " · " + DIST.toLocaleString("fr-FR") + " M", T.cx, T.cy + 8);
  ctx.textAlign = "start";
}
function ring(R, color, w) {
  ctx.strokeStyle = color; ctx.lineWidth = w || 6;
  ctx.beginPath(); tracePath(R); ctx.stroke();
}
function ringBand(Ri, Ro, color) {
  ctx.strokeStyle = color; ctx.lineWidth = Ro - Ri;
  ctx.beginPath(); tracePath((Ri + Ro) / 2); ctx.stroke();
}
function ringFill(R, color) {
  ctx.fillStyle = color; ctx.beginPath(); tracePath(R); ctx.fill();
}
function tracePath(R) {
  const hs = T.straight / 2, cl = T.cx - hs, cr = T.cx + hs;
  ctx.moveTo(cr, T.cy - R);
  ctx.arc(cr, T.cy, R, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(cl, T.cy + R);
  ctx.arc(cl, T.cy, R, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath();
}

function drawHorse(r, t) {
  const pt = TP(r.dist * M, r.lane);
  const g = r.done ? 0.4 : 1;
  const bob = Math.sin(t * 14 * r.wob + r.phase) * 1.6 * g;
  ctx.save();
  ctx.translate(pt.x, pt.y + bob);
  const dir = TP(r.dist * M + 4, r.lane);
  const ang = Math.atan2(dir.y - pt.y, dir.x - pt.x);
  ctx.rotate(ang);
  const legT = t * 16 * r.wob + r.phase;
  ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.ellipse(0, 7, 11, 3, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = "#6b4a2b"; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const sw = Math.sin(legT + i * Math.PI / 1.6) * 4 * g;
    ctx.beginPath(); ctx.moveTo(-6 + i * 4, 3); ctx.lineTo(-6 + i * 4 + sw, 8); ctx.stroke();
  }
  ctx.fillStyle = "#8a5a33"; ctx.beginPath(); ctx.ellipse(0, 0, 11, 4.6, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = "#5d3d21"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-10, -1); ctx.lineTo(-14, 2); ctx.stroke();
  ctx.fillStyle = "#8a5a33"; ctx.beginPath(); ctx.ellipse(11, -3, 4.6, 2.6, .5, 0, 7); ctx.fill();
  ctx.fillStyle = r.h.c[0]; ctx.beginPath(); ctx.ellipse(0, -6, 4.6, 4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = r.h.c[1]; ctx.beginPath(); ctx.arc(1, -9.5, 2.4, 0, 7); ctx.fill();
  ctx.restore();
  ctx.font = "700 11px 'Barlow Condensed'"; ctx.fillStyle = "#fff";
  ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 2.5;
  ctx.strokeText(r.h.n, pt.x - 4, pt.y - 12 + bob); ctx.fillText(r.h.n, pt.x - 4, pt.y - 12 + bob);
}

/* --- confettis (arrivée du vainqueur) --- */
function spawnConfetti() {
  const cols = ["#e4322b", "#e8b64c", "#2f7d46", "#1e4fd8", "#f26522", "#ffffff"];
  for (let i = 0; i < 150; i++) {
    confetti.push({
      x: Math.random() * W, y: -20 - Math.random() * 140,
      vx: (Math.random() - .5) * 1.6, vy: 1 + Math.random() * 2.4,
      rot: Math.random() * Math.PI, vr: (Math.random() - .5) * .25,
      s: 6 + Math.random() * 6, col: cols[(Math.random() * cols.length) | 0]
    });
  }
}
function drawConfetti() {
  confetti.forEach(c => {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot);
    ctx.fillStyle = c.col; ctx.fillRect(-c.s / 2, -c.s / 4, c.s, c.s / 2);
    ctx.restore();
    c.x += c.vx; c.y += c.vy; c.vy += 0.07; c.rot += c.vr;
  });
  confetti = confetti.filter(c => c.y < H + 20);
}

function drawFrame(t) {
  drawTrack();
  [...runners].sort((a, b) => a.lane - b.lane).forEach(r => drawHorse(r, t));
  drawConfetti();
}

/* --- boucle --- */
const paceMap = { lent: .97, normal: 1, rapide: 1.035 };
function step() {
  if (!running) return;
  const mult = parseFloat($("speed").value);
  const dt = (1 / 60) * mult;
  tSim += dt;
  const paceK = paceMap[scenario.pace || "normal"];
  const chaos = scenario.chaos || 1;

  const leadDist = runners.reduce((m, r) => Math.max(m, r.dist), 0);
  let allDone = true;
  runners.forEach(r => {
    if (r.done) return;
    allDone = false;
    const f = r.dist / DIST;
    const prof = r.prof(f);
    const fatigue = 1 - Math.max(0, f - .85) * 0.10 * (r.h.w - 51) / 9;
    const noise = 1 + (Math.random() * 2 - 1) * 0.012 * chaos;
    /* aspiration : un cheval décroché profite du sillage et recolle au peloton */
    const catchup = 1 + Math.min(0.05, Math.max(0, leadDist - r.dist) * (f > 0.7 ? 0.0011 : 0.0006));
    const v = r.speed0 * prof * fatigue * noise * paceK * catchup;
    r.dist += v * dt;
    if (f > 0.28 && r.lane > 1.2) r.lane -= dt * 0.55;
    if (r.dist >= DIST) {
      r.done = true; r.timeFin = tSim;
      finishCount++;
      if (finishCount === 1) { // photo-finish + confettis pour le vainqueur
        $("flash").classList.add("on");
        setTimeout(() => $("flash").classList.remove("on"), 160);
        spawnConfetti();
      }
    }
  });

  const lead = [...runners].sort((a, b) => b.dist - a.dist);
  const L = lead[0];
  const mark = (m, txt, hot) => { if (L.dist >= m && !commentFlags[m]) { commentFlags[m] = 1; say(txt(L), hot); } };
  mark(30,   l => `🏁 C'est parti pour le ${META.title || "Quinté du jour"} ! ${l.h.name} (${l.h.n}) prend les devants au premier passage.`, true);
  mark(500,  l => `Après 500 m, ${l.h.name} imprime le rythme. ${lead[1].h.name} et ${lead[2].h.name} sont dans son sillage, le peloton est groupé.`);
  mark(DIST / 2, l => `Mi-course ! ${l.h.name} toujours aux avant-postes. Les finisseurs comme ${closerNames} patientent à l'arrière.`);
  mark(DIST - 600, l => `Dernier tournant ! ${l.h.name} attaque la corde, ${lead[1].h.name} vient le défier à l'extérieur — ça se déploie sur toute la piste !`, true);
  mark(DIST - 300, l => `Plus que 300 mètres ! ${l.h.name} résiste, mais ${lead[1].h.name} et ${lead[2].h.name} reviennent très fort !`, true);
  mark(DIST - 60,  l => `ILS SE JETTENT SUR LE POTEAU ! ${l.h.name} d'un côté, ${lead[1].h.name}… photo demandée !`, true);

  $("hudDist").textContent = L.done ? "Arrivée !" : `${Math.max(0, Math.round(DIST - L.dist))} m à parcourir · ${tSim.toFixed(0)}s`;

  drawFrame(tSim);
  renderStandings();

  if (allDone) { running = false; showResult(); confettiDrain(); return; }
  raf = requestAnimationFrame(step);
}

/* laisse les confettis retomber après la course */
function confettiDrain() {
  if (!confetti.length || running) return;
  drawFrame(tSim);
  requestAnimationFrame(confettiDrain);
}

function showResult() {
  finished = true;
  const order = [...runners].sort((a, b) => a.timeFin - b.timeFin);
  const top5 = order.slice(0, 5);
  $("combo").innerHTML = top5.map((r, i) =>
    `<div class="n" style="background:${r.h.c[0]};animation-delay:${i * 0.18}s">${r.h.n}</div>`).join("");
  $("resList").innerHTML = order.slice(0, 7).map((r, i) => {
    const gap = i === 0 ? `en ${fmtTime(r.timeFin)}` : `à ${((r.timeFin - order[0].timeFin) * 4.2).toFixed(1)} L`;
    return `<li><b>${r.h.n} — ${r.h.name}</b> (${r.h.jockey}, ${r.h.w} kg) · ${gap}</li>`;
  }).join("");
  $("resultbox").style.display = "block";
  say(`🏆 Arrivée : ${top5.map(r => r.h.n).join(" - ")}. ${top5[0].h.name} s'impose pour ${top5[0].h.jockey} !`, true);
  $("resultbox").scrollIntoView({ behavior: "smooth", block: "center" });
}
function fmtTime(s) { const mm = Math.floor(s / 60), ss = (s % 60).toFixed(1); return `${mm}'${ss.padStart(4, "0")}"`; }

/* --- compte à rebours puis départ --- */
function startWithCountdown() {
  const cd = $("count");
  let n = 3;
  $("btnStart").disabled = true;
  say("Ils sont tous dans les stalles… concentration à " + (META.track || "l'hippodrome") + ".");
  (function stepCd() {
    cd.innerHTML = `<span>${n > 0 ? n : "PARTEZ !"}</span>`;
    if (n < 0) {
      cd.innerHTML = "";
      running = true;
      say(`Les stalles s'ouvrent… scénario « ${scenario.title.replace(/^[①-⑳] /, "")} » !`, true);
      raf = requestAnimationFrame(step);
      return;
    }
    n--; setTimeout(stepCd, 850);
  })();
}

$("btnStart").onclick = () => {
  if (running) return;
  if (finished) resetRace(true);
  startWithCountdown();
};
$("btnReset").onclick = () => resetRace(false);

resetRace(true);
})();
