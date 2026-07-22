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
const BASEV = META.baseSpeed || 16.2;
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
     <div class="sub">${h.sub || `${h.jockey} · ${h.w} kg · corde ${h.draw} · val. ${h.val} · cote ${h.odds}`}</div>
     <p>${h.note}</p>
     ${h.musique ? `<p class="musique">Musique : ${h.musique}</p>` : ""}${tags}
   </div>`;
  cards.appendChild(d);
});

/* ---------- l'avis des professionnels ---------- */
if (META.avis && document.getElementById("avisbox")) {
  document.getElementById("avisbox").innerHTML = META.avis.map(a => `
    <div class="avis">
      <h4>${a.src}</h4>
      <p>${a.txt}</p>
    </div>`).join("");
}

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
let cinemaOpen = false;
let commentFlags = {}, finishCount = 0, confetti = [];
const closerNames = HORSES.filter(h => h.style === "closer").map(h => h.name).slice(0, 2).join(" et ") || "les finisseurs";

function styleProfile(style) {
  if (style === "leader")  return f => f < .25 ? 1.045 : f < .75 ? 1.005 : .974;
  if (style === "stalker") return f => f < .25 ? 1.015 : f < .8 ? 1.0 : 1.014;
  if (style === "closer")  return f => f < .3 ? .958 : f < .72 ? .992 : 1.05;
  return f => 1.0;
}

function initRunner(h) {
  const chaos = scenario.chaos || 1;
  const bias = (scenario.bias && scenario.bias[h.n]) || 1;
  const wAdj = (56 - h.w) * 0.9;
  const drawAdj = h.draw >= 12 ? -1.6 : h.draw <= 4 ? .7 : 0;
  const base = (h.ab + wAdj + drawAdj) * bias;
  const luck = 1 + (Math.random() * 2 - 1) * 0.048 * h.vol * chaos;
  return {
    h, prof: styleProfile(h.style),
    /* écart d'aptitude compressé (x0.35) pour des arrivées serrées et réalistes */
    speed0: BASEV * (1 + (base / 86 - 1) * 0.28) * luck,
    dist: 0, done: false, timeFin: 0,
    lane: 1 + Math.min(h.draw - 1, 10) * 0.32 + Math.random() * .3,
    phase: Math.random() * Math.PI * 2,
    wob: .8 + Math.random() * .6,
  };
}

function resetRace(soft) {
  cancelAnimationFrame(raf); running = false; finished = false; tSim = 0;
  commentFlags = {}; finishCount = 0; confetti = []; dust = [];
  $("resultbox").style.display = "none";
  $("btnStart").disabled = false;
  $("count").innerHTML = "";
  runners = HORSES.map(initRunner);
  if (!soft) say("Nouvelle simulation prête. Les chevaux retournent aux stalles.", false);
  drawFrame(0);
  renderStandings();
}

function say(txt, hot) {
  const p = document.createElement("p"); p.textContent = txt; if (hot) p.className = "hot";
  $("feed").appendChild(p);
  $("feed").scrollTop = 0;
  const tk = $("cineTicker");
  if (tk) {
    tk.textContent = "🎙 " + txt;
    tk.classList.toggle("hot", !!hot);
    tk.classList.remove("pop"); void tk.offsetWidth; tk.classList.add("pop");
  }
}

function renderStandings() {
  /* pendant la course : tri à la distance ; après la ligne : tri au temps
     de passage — exactement le même ordre que l'arrivée officielle */
  const order = [...runners].sort((a, b) => {
    if (a.done && b.done) return a.timeFin - b.timeFin;
    if (a.done) return -1;
    if (b.done) return 1;
    return b.dist - a.dist;
  });
  const lead = order[0];
  $("standings").innerHTML = order.slice(0, 8).map((r, i) => {
    let back;
    if (lead && lead.done && r.done) back = (r.timeFin - lead.timeFin) * 4.2; // même conversion que l'arrivée
    else back = ((lead ? lead.dist : 0) - r.dist) / 2.6;
    return `<div class="strow">
      <span class="pos">${i + 1}${i === 0 ? "ᵉʳ" : "ᵉ"}</span>
      <span class="silk" style="background:${r.h.c[0]}"></span>
      <span class="num">${r.h.n}</span> ${r.h.name}
      <span class="gap">${i === 0 ? (r.done ? "🏁" : "en tête") : back < 0.4 ? "nez" : back.toFixed(1) + " L"}</span>
    </div>`;
  }).join("");
  const cp = $("cinePos");
  if (cp && cinemaOpen) {
    cp.innerHTML = order.slice(0, 5).map((r, i) => `
      <div class="cp-row${i === 0 ? " lead" : ""}">
        <span class="cp-pos">${i + 1}</span>
        <span class="cp-silk" style="background:${r.h.c[0]}"></span>
        <span class="cp-num">${r.h.n}</span>
        <span class="cp-nm">${r.h.name}</span>
      </div>`).join("");
  }
}

/* --- dessin --- */
let trackCache = null; // la piste ne bouge pas : rendue une fois hors écran
function drawTrack() {
  if (!trackCache) {
    trackCache = document.createElement("canvas");
    trackCache.width = W; trackCache.height = H;
    renderTrack(trackCache.getContext("2d"));
  }
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(trackCache, 0, 0);
}
function renderTrack(c) {
  const keep = ctx;
  // ciel du soir
  const sky = c.createLinearGradient(0, 0, 0, H * .24);
  sky.addColorStop(0, "#a8c8e4"); sky.addColorStop(1, "#d6e4cf");
  c.fillStyle = sky; c.fillRect(0, 0, W, H * .24);
  const lawn = c.createLinearGradient(0, H * .24, 0, H);
  lawn.addColorStop(0, "#37884e"); lawn.addColorStop(1, "#276a3c");
  c.fillStyle = lawn; c.fillRect(0, H * .24, W, H * .76);
  // tribune + foule pointilliste
  c.fillStyle = "#1d3a2b"; c.fillRect(58, H * .24 - 34, 306, 34);
  c.fillStyle = "rgba(255,255,255,.85)"; c.fillRect(58, H * .24 - 38, 306, 5);
  for (let i = 0; i < 130; i++) {
    c.fillStyle = ["#e3b64e","#e8e2d2","#c96f6f","#7fa8d8","#d8d8d8"][i % 5];
    c.globalAlpha = .55 + Math.random() * .4;
    c.beginPath();
    c.arc(64 + Math.random() * 294, H * .24 - 6 - Math.random() * 24, 1.6, 0, 7);
    c.fill();
  }
  c.globalAlpha = 1;
  // arbres décor
  [[30, H*.24+16],[W-42, H*.24+30],[W-90, H*.24+10]].forEach(([x,y]) => {
    c.fillStyle = "#1f5c33"; c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill();
    c.fillStyle = "#2c7040"; c.beginPath(); c.arc(x - 6, y + 5, 9, 0, 7); c.fill();
  });

  const inner = T.r - 14, outer = T.r + T.lanes * T.laneW + 16;
  // haie extérieure
  ringC(c, outer + 3, "#1d5230", 9);
  // surface : bandes de tonte alternées
  const nBands = 6, bw = (outer - 8 - inner) / nBands;
  for (let i = 0; i < nBands; i++) {
    ringBandC(c, inner + i * bw, inner + (i + 1) * bw, i % 2 ? "#5aa96d" : "#519c63");
  }
  // pelouse intérieure + plan d'eau
  ringFillC(c, inner, "#2c7040");
  c.fillStyle = "rgba(140,190,225,.8)";
  c.beginPath(); c.ellipse(T.cx + 88, T.cy + 14, 52, 20, 0, 0, 7); c.fill();
  c.fillStyle = "rgba(255,255,255,.25)";
  c.beginPath(); c.ellipse(T.cx + 78, T.cy + 9, 18, 5, -.3, 0, 7); c.fill();
  // lices blanches + piquets
  ringC(c, inner, "#ffffff", 2.5); ringC(c, outer - 8, "#ffffff", 2.5);
  c.fillStyle = "#ffffff";
  for (let d = 0; d < PERIM; d += 42) {
    const pi2 = TPgeneric(d, -1.6), po = TPgeneric(d, T.lanes + .9);
    c.fillRect(pi2.x - 1, pi2.y - 4, 2, 4);
    c.fillRect(po.x - 1, po.y - 4, 2, 4);
  }
  // ligne d'arrivée damier
  const fy1 = T.cy + inner + 2, fy2 = T.cy + outer - 8, seg = (fy2 - fy1) / 10;
  for (let i = 0; i < 10; i++) {
    c.fillStyle = i % 2 ? "#122019" : "#ffffff";
    c.fillRect(T.cx - 3, fy1 + i * seg, 6, seg);
  }
  // poteau doré
  c.fillStyle = "#c9971f"; c.fillRect(T.cx - 2, fy2 - 2, 4, 20);
  c.beginPath(); c.arc(T.cx, fy2 + 20, 4, 0, 7); c.fill();
  c.font = "700 13px 'Barlow Condensed'"; c.fillStyle = "#fff";
  c.fillText("ARRIVÉE", T.cx - 26, fy2 + 34);
  // nom de l'hippodrome
  c.fillStyle = "rgba(255,255,255,.5)";
  c.font = "900 30px 'Barlow Condensed'"; c.textAlign = "center";
  c.fillText((META.track || "") + " · " + DIST.toLocaleString("fr-FR") + " M", T.cx - 60, T.cy + 8);
  c.textAlign = "start";
}
function TPgeneric(d, lane) { return TP(d, lane); }
function ringC(c, R, color, w) {
  c.strokeStyle = color; c.lineWidth = w || 6;
  c.beginPath(); tracePathC(c, R); c.stroke();
}
function ringBandC(c, Ri, Ro, color) {
  c.strokeStyle = color; c.lineWidth = Ro - Ri;
  c.beginPath(); tracePathC(c, (Ri + Ro) / 2); c.stroke();
}
function ringFillC(c, R, color) {
  c.fillStyle = color; c.beginPath(); tracePathC(c, R); c.fill();
}
function tracePathC(c, R) {
  const hs = T.straight / 2, cl = T.cx - hs, cr = T.cx + hs;
  c.moveTo(cr, T.cy - R);
  c.arc(cr, T.cy, R, -Math.PI / 2, Math.PI / 2);
  c.lineTo(cl, T.cy + R);
  c.arc(cl, T.cy, R, Math.PI / 2, Math.PI * 1.5);
  c.closePath();
}

let dust = [];
function drawHorse(r, t, isLeader) {
  const pt = TP(r.dist * M, r.lane);
  const g = r.done ? 0.4 : 1;
  const bob = Math.sin(t * 14 * r.wob + r.phase) * 1.6 * g;
  // halo doré discret sous le leader
  if (isLeader && running) {
    ctx.fillStyle = "rgba(227,182,78,.3)";
    ctx.beginPath(); ctx.ellipse(pt.x, pt.y + 6, 17, 6, 0, 0, 7); ctx.fill();
  }
  ctx.save();
  ctx.translate(pt.x, pt.y + bob);
  const dir = TP(r.dist * M + 4, r.lane);
  const ang = Math.atan2(dir.y - pt.y, dir.x - pt.x);
  ctx.rotate(ang);
  const legT = t * 16 * r.wob + r.phase;
  // ombre
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(0, 7.5, 12, 3, 0, 0, 7); ctx.fill();
  // jambes au galop (avant / arrière déphasées)
  ctx.strokeStyle = "#5d3d21"; ctx.lineWidth = 2.1; ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const sw = Math.sin(legT + (i < 2 ? 0 : Math.PI * .9) + i * .5) * 4.6 * g;
    ctx.beginPath(); ctx.moveTo(-7 + i * 4.6, 3); ctx.lineTo(-7 + i * 4.6 + sw, 8.4); ctx.stroke();
  }
  // queue fouettée
  ctx.strokeStyle = "#4a3019"; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(-11, -2);
  ctx.quadraticCurveTo(-15, 0 + Math.sin(legT) * 1.6, -17, 3.5 + Math.sin(legT * .7) * 1.2);
  ctx.stroke();
  // corps en dégradé (robe)
  const robe = ctx.createLinearGradient(0, -5, 0, 5);
  robe.addColorStop(0, "#96683c"); robe.addColorStop(1, "#6f4a26");
  ctx.fillStyle = robe;
  ctx.beginPath(); ctx.ellipse(0, 0, 11.5, 4.9, 0, 0, 7); ctx.fill();
  // encolure + tête + oreille
  ctx.beginPath(); ctx.ellipse(9.5, -3.4, 5.2, 2.9, .55, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(13.6, -5.4, 2.6, 1.5, .5, 0, 7); ctx.fill();
  ctx.strokeStyle = "#4a3019"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(13.4, -7); ctx.lineTo(14.4, -8.6); ctx.stroke();
  // crinière
  ctx.strokeStyle = "#3d2814"; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(5, -4.6); ctx.quadraticCurveTo(9, -6.6, 12, -6); ctx.stroke();
  // jockey : buste penché + bras + casaque
  ctx.fillStyle = r.h.c[0];
  ctx.beginPath(); ctx.ellipse(-.5, -6.6, 4.8, 4, -.35, 0, 7); ctx.fill();
  ctx.strokeStyle = r.h.c[0]; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(7.5, -4); ctx.stroke(); // bras vers les rênes
  ctx.fillStyle = r.h.c[1];
  ctx.beginPath(); ctx.arc(1.2, -10.4, 2.5, 0, 7); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = .8;
  ctx.beginPath(); ctx.arc(1.2, -10.4, 2.5, 0, 7); ctx.stroke();
  ctx.restore();
  // poussière derrière les sabots
  if (running && !r.done && Math.random() < .3) {
    const back = TP(r.dist * M - 9, r.lane);
    dust.push({ x: back.x, y: back.y + 5, a: .3, s: 1.5 + Math.random() * 2 });
  }
  // dossard
  ctx.font = "700 11px 'Barlow Condensed'"; ctx.fillStyle = "#fff";
  ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 2.5;
  ctx.strokeText(r.h.n, pt.x - 4, pt.y - 14 + bob); ctx.fillText(r.h.n, pt.x - 4, pt.y - 14 + bob);
}
function drawDust() {
  dust = dust.filter(d => d.a > .02);
  dust.forEach(d => {
    ctx.fillStyle = "rgba(222,214,190," + d.a + ")";
    ctx.beginPath(); ctx.arc(d.x, d.y - (.3 - d.a) * 14, d.s, 0, 7); ctx.fill();
    d.a *= .9; d.s += .3;
  });
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
  drawDust();
  const leadN = runners.length ? [...runners].sort((a, b) => b.dist - a.dist)[0].h.n : 0;
  [...runners].sort((a, b) => a.lane - b.lane).forEach(r => drawHorse(r, t, r.h.n === leadN));
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
    const catchup = 1 + Math.min(0.075, Math.max(0, leadDist - r.dist) * (f > 0.7 ? 0.0016 : 0.0009));
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

  const hudTxt = L.done ? "Arrivée !" : `${Math.max(0, Math.round(DIST - L.dist))} m à parcourir · ${tSim.toFixed(0)}s`;
  $("hudDist").textContent = hudTxt;
  if (cinemaOpen && $("cineDist")) $("cineDist").textContent = hudTxt;

  drawFrame(tSim);
  if (cinemaOpen) draw3D(tSim);
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
    return `<li><b>${r.h.n} — ${r.h.name}</b> (${r.h.jockey}) · ${gap}</li>`;
  }).join("");
  $("resultbox").style.display = "block";
  say(`🏆 Arrivée : ${top5.map(r => r.h.n).join(" - ")}. ${top5[0].h.name} s'impose pour ${top5[0].h.jockey} !`, true);
  if (cinemaOpen && $("cineResult")) {
    $("cineResult").innerHTML = `
      <h3>🏆 Arrivée officielle</h3>
      <div class="combo">${top5.map((r, i) =>
        `<div class="n" style="background:${r.h.c[0]};animation-delay:${i * .18}s">${r.h.n}</div>`).join("")}</div>
      <p>${top5[0].h.name} s'impose pour ${top5[0].h.jockey} !</p>
      <button class="btn btn-go" id="cineToAnalyse">Voir l'analyse complète</button>`;
    $("cineResult").hidden = false;
    $("cineToAnalyse").onclick = () => {
      closeCinema();
      $("resultbox").scrollIntoView({ behavior: "smooth", block: "center" });
    };
  } else {
    $("resultbox").scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
function fmtTime(s) { const mm = Math.floor(s / 60), ss = (s % 60).toFixed(1); return `${mm}'${ss.padStart(4, "0")}"`; }

/* --- compte à rebours puis départ --- */
function startWithCountdown() {
  const cd = (cinemaOpen && $("cineCount")) ? $("cineCount") : $("count");
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
  openCinema();
  playIntroThen(startWithCountdown);
};

/* intro vidéo « ambiance TV » (optionnelle, configurée dans Quinté du jour) */
function playIntroThen(cb) {
  const url = CFG.cineIntro;
  const box = $("cineIntro"), vid = $("cineIntroVid");
  if (!url || !box || !vid || !cinemaOpen) { cb(); return; }
  let fired = false;
  const go = () => { if (fired) return; fired = true;
    box.hidden = true; try { vid.pause(); } catch (e) {}
    cb();
  };
  box.hidden = false;
  vid.src = url;
  vid.currentTime = 0;
  vid.onended = go;
  vid.onerror = go;
  $("cineSkip").onclick = go;
  setTimeout(go, 4500); // jamais plus de 4,5 s
  const pr = vid.play();
  if (pr && pr.catch) pr.catch(go);
}
$("btnReset").onclick = () => resetRace(false);

/* =========================================================
   MONTE-CARLO — 100 courses instantanées (outil pro)
   Même physique que la course animée, sans affichage.
   ========================================================= */
function simulateOnce() {
  const chaos = scenario.chaos || 1;
  const paceK = paceMap[scenario.pace || "normal"];
  const rs = HORSES.map(initRunner);
  const fin = [];
  let t = 0;
  const dt = 0.4;
  while (fin.length < rs.length && t < 900) {
    const leadDist = rs.reduce((m, r) => Math.max(m, r.dist), 0);
    rs.forEach(r => {
      if (r.done) return;
      const f = r.dist / DIST;
      const prof = r.prof(f);
      const fatigue = 1 - Math.max(0, f - .85) * 0.10 * (r.h.w - 51) / 9;
      const noise = 1 + (Math.random() * 2 - 1) * 0.012 * chaos;
      const catchup = 1 + Math.min(0.075, Math.max(0, leadDist - r.dist) * (f > 0.7 ? 0.0016 : 0.0009));
      const v = r.speed0 * prof * fatigue * noise * paceK * catchup;
      const prev = r.dist;
      r.dist += v * dt;
      if (r.dist >= DIST) {
        r.done = true;
        r.timeFin = t + (DIST - prev) / (v || 1); // franchissement précis dans le pas de temps
        fin.push(r);
      }
    });
    t += dt;
  }
  fin.sort((a, b) => a.timeFin - b.timeFin);
  return fin.map(r => r.h.n);
}

function runMonteCarlo() {
  const N = 100;
  const wins = {}, top5s = {}, combos = {};
  HORSES.forEach(h => { wins[h.n] = 0; top5s[h.n] = 0; });
  for (let i = 0; i < N; i++) {
    const order = simulateOnce();
    wins[order[0]]++;
    order.slice(0, 5).forEach(n => top5s[n]++);
    const key = order.slice(0, 5).join("-");
    combos[key] = (combos[key] || 0) + 1;
  }
  // classement par % de victoires
  const byWin = [...HORSES].sort((a, b) => (wins[b.n] - wins[a.n]) || (top5s[b.n] - top5s[a.n]));
  $("mcbars").innerHTML = byWin.slice(0, 8).map(h => `
    <div class="mcrow">
      <span class="silk" style="background:${h.c[0]}"></span>
      <span class="num">${h.n}</span>
      <span class="nm">${h.name}</span>
      <div class="barwrap"><div class="bar" data-w="${wins[h.n]}"></div></div>
      <span class="pct">${wins[h.n]}% · T5 ${top5s[h.n]}%</span>
    </div>`).join("");
  const topCombos = Object.entries(combos).sort((a, b) => b[1] - a[1]).slice(0, 5);
  $("mccombos").innerHTML = topCombos.map(([k, v]) =>
    `<div class="mc-combo"><span class="c">${k}</span><span class="x">sortie ${v} fois / ${N}</span></div>`).join("");
  const box = $("mcbox");
  box.classList.add("show");
  requestAnimationFrame(() => requestAnimationFrame(() => {
    box.querySelectorAll(".bar").forEach(b => { b.style.width = Math.min(100, parseInt(b.dataset.w, 10) * 2.2) + "%"; });
  }));
  say(`📊 ${N} courses simulées avec le scénario « ${scenario.title.replace(/^[①-⑳] /, "")} » — ${byWin[0].name} gagne ${wins[byWin[0].n]} fois.`, true);
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
if ($("btnMC")) $("btnMC").onclick = runMonteCarlo;

/* =========================================================
   LE DIRECT — pop-up plein écran, caméra TV pseudo-3D
   La même course, vue comme une retransmission : perspective
   écrasée, caméra qui suit le peloton, classement + micro.
   ========================================================= */
const CW = 1280, CH = 720;
let cv3 = null, c3 = null, camX = 0;
const HORIZON = 150, SQUASH = 0.52, ZOOM = 1.5;
const OUTER_LANE = T.lanes + 1.2, INNER_LANE = -1.7;

function openCinema() {
  const el = $("cinema");
  if (!el) return;
  cinemaOpen = true;
  el.hidden = false;
  document.body.style.overflow = "hidden";
  if (!cv3) { cv3 = $("cv3"); c3 = cv3.getContext("2d"); }
  $("cineResult").hidden = true;
  $("cineTicker").textContent = "🎙 Les partants se présentent devant les tribunes…";
  $("cineDist").textContent = DIST.toLocaleString("fr-FR") + " m à parcourir";
  camX = T.cx;
  draw3D(0);
  renderStandings();
}
function closeCinema() {
  cinemaOpen = false;
  const el = $("cinema");
  if (el) el.hidden = true;
  document.body.style.overflow = "";
}
if ($("cineClose")) $("cineClose").onclick = closeCinema;
document.addEventListener("keydown", e => { if (e.key === "Escape" && cinemaOpen) closeCinema(); });

/* projection « caméra en tribune » : y écrasé, loin = petit + resserré */
function depthOf(y) {
  const yMin = T.cy - (T.r + OUTER_LANE * T.laneW), yMax = T.cy + (T.r + OUTER_LANE * T.laneW);
  return Math.min(1, Math.max(0, (y - yMin) / (yMax - yMin))); // 0 = loin, 1 = proche
}
function project(pt) {
  const d = depthOf(pt.y);
  const sx = 0.62 + 0.38 * d;                     // pincement horizontal au loin
  return {
    x: CW / 2 + (pt.x - camX) * ZOOM * sx,
    y: HORIZON + (pt.y - (T.cy - (T.r + OUTER_LANE * T.laneW))) * SQUASH * ZOOM,
    s: 0.85 + 1.05 * d,                            // échelle des sprites
    d
  };
}
function projectPath(lane, step) {
  const pts = [];
  for (let dd = 0; dd <= PERIM; dd += step) pts.push(project(TP(dd, lane)));
  return pts;
}
function poly(cx2, pts, close) {
  cx2.beginPath();
  pts.forEach((q, i) => i ? cx2.lineTo(q.x, q.y) : cx2.moveTo(q.x, q.y));
  if (close) cx2.closePath();
}

function draw3D(t) {
  const g = c3;
  // ciel + lointain
  const sky = g.createLinearGradient(0, 0, 0, HORIZON + 60);
  sky.addColorStop(0, "#8fb8dc"); sky.addColorStop(1, "#d9e6d2");
  g.fillStyle = sky; g.fillRect(0, 0, CW, HORIZON + 60);
  g.fillStyle = "#276a3c"; g.fillRect(0, HORIZON + 40, CW, CH - HORIZON - 40);
  // tribunes au fond
  g.fillStyle = "#1d3a2b"; g.fillRect(CW * .08, HORIZON - 58, CW * .84, 46);
  g.fillStyle = "rgba(255,255,255,.85)"; g.fillRect(CW * .08, HORIZON - 64, CW * .84, 6);
  for (let i = 0; i < 240; i++) {
    g.fillStyle = ["#e3b64e", "#e8e2d2", "#c96f6f", "#7fa8d8", "#d8d8d8"][i % 5];
    g.globalAlpha = .5 + (i % 7) * .07;
    g.fillRect(CW * .08 + 6 + (i * 37) % (CW * .84 - 12), HORIZON - 52 + (i * 13) % 36, 3, 3);
  }
  g.globalAlpha = 1;

  // anneau de course en perspective
  const outer = projectPath(OUTER_LANE, 10), inner = projectPath(INNER_LANE, 10);
  poly(g, outer, true); g.fillStyle = "#4f9c62"; g.fill();
  // bandes de tonte
  for (let b = 0; b < 3; b++) {
    const la = INNER_LANE + (OUTER_LANE - INNER_LANE) * (b / 3);
    const lb = INNER_LANE + (OUTER_LANE - INNER_LANE) * ((b + 1) / 3);
    poly(g, projectPath(lb, 12), true); g.fillStyle = b % 2 ? "#55a468" : "#4f9c62"; g.fill();
    poly(g, projectPath(la, 12), true); g.fillStyle = b % 2 ? "#4f9c62" : "#55a468"; g.fill();
  }
  poly(g, inner, true); g.fillStyle = "#2c7040"; g.fill();
  // plan d'eau au centre
  const lake = project({ x: T.cx + 80, y: T.cy + 8 });
  g.fillStyle = "rgba(140,190,225,.75)";
  g.beginPath(); g.ellipse(lake.x, lake.y, 70 * lake.s * .6, 16 * lake.s * .6, 0, 0, 7); g.fill();
  // lices
  g.strokeStyle = "rgba(255,255,255,.95)"; g.lineWidth = 2.2;
  poly(g, inner, true); g.stroke();
  poly(g, outer, true); g.stroke();
  // piquets de la lice proche
  g.fillStyle = "#fff";
  for (let dd = 0; dd < PERIM; dd += 34) {
    const q = project(TP(dd, INNER_LANE));
    if (q.d > .55) g.fillRect(q.x - 1, q.y - 8 * q.s * .5, 2, 8 * q.s * .5);
  }
  // ligne d'arrivée damier
  const f1 = project(TP(0, INNER_LANE)), f2 = project(TP(0, OUTER_LANE));
  const segs = 9;
  for (let i = 0; i < segs; i++) {
    const a = { x: f1.x + (f2.x - f1.x) * i / segs, y: f1.y + (f2.y - f1.y) * i / segs };
    const b = { x: f1.x + (f2.x - f1.x) * (i + 1) / segs, y: f1.y + (f2.y - f1.y) * (i + 1) / segs };
    g.strokeStyle = i % 2 ? "#122019" : "#fff"; g.lineWidth = 6;
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
  }

  // caméra : suit le barycentre des 6 premiers
  if (runners.length) {
    const top = [...runners].sort((a, b) => b.dist - a.dist).slice(0, 6);
    const cx2 = top.reduce((m, r) => m + TP(r.dist * M, r.lane).x, 0) / top.length;
    camX += (cx2 - camX) * 0.07;
    const lim = T.straight / 2 + 60;
    camX = Math.min(T.cx + lim, Math.max(T.cx - lim, camX));
  }

  // chevaux : du plus loin au plus proche
  const byDepth = [...runners].sort((a, b) => TP(a.dist * M, a.lane * 1.7).y - TP(b.dist * M, b.lane * 1.7).y);
  byDepth.forEach(r => drawHorse3D(g, r, t));
  // confettis du direct
  if (confetti.length) {
    confetti.forEach(cf => {
      g.save(); g.translate(cf.x * (CW / W), cf.y * (CH / H)); g.rotate(cf.rot);
      g.fillStyle = cf.col; g.fillRect(-cf.s / 2, -cf.s / 4, cf.s, cf.s / 2);
      g.restore();
    });
  }
}

function drawHorse3D(g, r, t) {
  const lane3 = r.lane * 1.7; // couloirs écartés pour la lisibilité en perspective
  const raw = TP(r.dist * M, lane3);
  const q = project(raw);
  const q2 = project(TP(r.dist * M + 6, lane3));
  /* vue de profil : on retourne le sprite selon la direction, avec une
     légère inclinaison dans les tournants (pas de rotation complète) */
  const dx = q2.x - q.x, dy = q2.y - q.y;
  const face = dx < 0 ? -1 : 1;
  const tilt = Math.max(-.45, Math.min(.45, Math.atan2(dy, Math.abs(dx) + .001)));
  const done = r.done ? 0.4 : 1;
  const bob = Math.sin(t * 14 * r.wob + r.phase) * 1.6 * done;
  const sc = q.s * 1.25;
  g.save();
  g.translate(q.x, q.y + bob * sc * .4);
  g.rotate(tilt * face);
  g.scale(face * sc, sc);
  const legT = t * 16 * r.wob + r.phase;
  g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(0, 6.5, 11, 2.6, 0, 0, 7); g.fill();
  g.strokeStyle = "#5d3d21"; g.lineWidth = 2; g.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const sw = Math.sin(legT + (i < 2 ? 0 : Math.PI * .9) + i * .5) * 4.4 * done;
    g.beginPath(); g.moveTo(-7 + i * 4.6, 3); g.lineTo(-7 + i * 4.6 + sw, 8); g.stroke();
  }
  g.strokeStyle = "#4a3019"; g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(-11, -2);
  g.quadraticCurveTo(-15, Math.sin(legT) * 1.6, -17, 3.5 + Math.sin(legT * .7) * 1.2);
  g.stroke();
  const robe = g.createLinearGradient(0, -5, 0, 5);
  robe.addColorStop(0, "#96683c"); robe.addColorStop(1, "#6f4a26");
  g.fillStyle = robe;
  g.beginPath(); g.ellipse(0, 0, 11.5, 4.7, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(9.5, -3.4, 5.2, 2.8, .55, 0, 7); g.fill();
  g.beginPath(); g.ellipse(13.6, -5.4, 2.6, 1.5, .5, 0, 7); g.fill();
  g.fillStyle = r.h.c[0];
  g.beginPath(); g.ellipse(-.5, -6.6, 4.8, 3.9, -.35, 0, 7); g.fill();
  g.strokeStyle = r.h.c[0]; g.lineWidth = 2;
  g.beginPath(); g.moveTo(2, -6); g.lineTo(7.5, -4); g.stroke();
  g.fillStyle = r.h.c[1];
  g.beginPath(); g.arc(1.2, -10.2, 2.5, 0, 7); g.fill();
  g.restore();
  // dossard au-dessus (hors miroir, toujours lisible)
  g.font = "700 " + Math.round(10 + 5 * q.d) + "px 'Barlow Condensed'";
  g.textAlign = "center";
  g.fillStyle = "#fff"; g.strokeStyle = "rgba(0,0,0,.65)"; g.lineWidth = 3;
  g.strokeText(r.h.n, q.x, q.y - 15 * sc);
  g.fillText(r.h.n, q.x, q.y - 15 * sc);
  g.textAlign = "start";
}



resetRace(true);
})();
