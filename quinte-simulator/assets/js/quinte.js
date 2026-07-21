/* =====================================================
   Quinté+ Simulator Pro — moteur de course + freemium
   Config attendue : window.QUINTE_SIM_CFG = {
     loggedIn: bool,      // utilisateur WordPress connecté ?
     loginUrl: string,    // URL de connexion (Google via Nextend)
     race: {...}          // données de la course du jour (JSON admin)
   }
   ===================================================== */
(function () {
  "use strict";

  var CFG = window.QUINTE_SIM_CFG || {};
  var DATA = CFG.race;
  var root = document.getElementById("qsApp");
  if (!DATA || !root) return;

  var LOGGED = !!CFG.loggedIn;
  var LOGIN_URL = CFG.loginUrl || "#";
  var FREE_RUNS = 1; // essais gratuits avant inscription
  var LS_KEY = "qsim_runs_" + (DATA.meta.code || "race");

  var HORSES = DATA.horses;
  var SCENARIOS = DATA.scenarios;
  var DIST = DATA.meta.distance || 2400;

  function $(id) { return document.getElementById(id); }
  function usedRuns() { return parseInt(localStorage.getItem(LS_KEY) || "0", 10) || 0; }
  function addRun() { try { localStorage.setItem(LS_KEY, String(usedRuns() + 1)); } catch (e) {} }
  function canRun() { return LOGGED || usedRuns() < FREE_RUNS; }
  function fmtM(m) { return Math.max(0, Math.round(m / 10) * 10).toLocaleString("fr-FR"); }

  /* =============== RENDU DE L'INTERFACE =============== */
  (function renderHeader() {
    var m = DATA.meta;
    $("qsEyebrow").textContent = m.eyebrow;
    $("qsTitle").innerHTML = m.title + "<br>" + m.subtitle;
    $("qsMeta").innerHTML = m.info.map(function (i) { return "<span>" + i + "</span>"; }).join("");
    $("qsBadgeTrack").innerHTML = m.track + " <em>·</em> " + m.code;
    $("qsHudDist").textContent = fmtM(DIST) + " m à parcourir";
  })();

  var scenario = SCENARIOS[0];
  var scBox = $("qsScenarios");
  SCENARIOS.forEach(function (s, i) {
    var locked = !LOGGED && i > 0; // invités : seul le scénario ① est ouvert
    var b = document.createElement("button");
    b.type = "button";
    b.className = "qs-scn" + (i === 0 ? " qs-active" : "") + (locked ? " qs-locked" : "");
    b.innerHTML = "<h3>" + s.title + "</h3><p>" + s.desc + "</p>" +
      '<span class="qs-prob">Probabilité estimée ' + s.prob + "</span>" +
      (locked ? '<span class="qs-lock">🔒</span>' : "");
    b.addEventListener("click", function () {
      if (locked) {
        b.classList.remove("qs-deny"); void b.offsetWidth; b.classList.add("qs-deny");
        showGate();
        return;
      }
      Array.prototype.forEach.call(scBox.children, function (x) { x.classList.remove("qs-active"); });
      b.classList.add("qs-active");
      scenario = s;
      resetRace();
      say("Scénario chargé : " + s.title.replace(/^[①-⑥]\s*/, "") + ". Lance la course !", true);
    });
    scBox.appendChild(b);
  });

  var cards = $("qsCards");
  HORSES.forEach(function (h) {
    var d = document.createElement("div");
    d.className = "qs-horse qs-reveal";
    var tags = (h.tags || []).map(function (t) {
      return '<span class="qs-tag ' + t[0] + '">' + t[1] + "</span>";
    }).join("");
    d.innerHTML =
      '<div class="qs-silkbig" style="background:' + h.c[0] + '"><span>' + h.n + "</span></div>" +
      "<div><h4>" + h.name + "</h4>" +
      '<div class="sub">' + h.jockey + " · " + h.w + " kg · corde " + h.draw + " · val. " + h.val + " · cote " + h.odds + "</div>" +
      "<p>" + h.note + "</p>" + tags + "</div>";
    cards.appendChild(d);
  });

  /* apparition au scroll */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("qs-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    Array.prototype.forEach.call(root.querySelectorAll(".qs-reveal"), function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(root.querySelectorAll(".qs-reveal"), function (el) { el.classList.add("qs-in"); });
  }

  /* =============== GÉOMÉTRIE DE LA PISTE =============== */
  var cv = $("qsCanvas"), ctx = cv.getContext("2d");
  var W = cv.width, H = cv.height;
  var TR = { cx: W / 2, cy: H / 2 + 12, S: 400, R: 118, laneW: 7, margin: 13 };
  var PER = 2 * TR.S + 2 * Math.PI * TR.R;
  var LAPS = 1.55;
  var pxPerM = (LAPS * PER) / DIST;
  var dFin = TR.S * 0.82;                 // arrivée sur la ligne droite du bas
  var d0 = dFin - DIST * pxPerM;          // stalles de départ

  /* point sur la piste : d = distance le long du rail (px), lane = écart vers l'extérieur */
  function point(d, lane) {
    var R = TR.R + TR.margin + lane * TR.laneW;
    var hs = TR.S / 2, arc = Math.PI * TR.R;
    var s = ((d % PER) + PER) % PER, th, ccx;
    if (s < TR.S) return { x: TR.cx + hs - s, y: TR.cy + R };
    s -= TR.S;
    if (s < arc) {
      th = Math.PI / 2 + (s / arc) * Math.PI; ccx = TR.cx - hs;
      return { x: ccx + R * Math.cos(th), y: TR.cy + R * Math.sin(th) };
    }
    s -= arc;
    if (s < TR.S) return { x: TR.cx - hs + s, y: TR.cy - R };
    s -= TR.S;
    th = 3 * Math.PI / 2 + (s / arc) * Math.PI; ccx = TR.cx + hs;
    return { x: ccx + R * Math.cos(th), y: TR.cy + R * Math.sin(th) };
  }
  function heading(d, lane) {
    var a = point(d, lane), b = point(d + 4, lane);
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  function stadium(c, R) {
    var hs = TR.S / 2;
    c.beginPath();
    c.moveTo(TR.cx - hs, TR.cy - R);
    c.lineTo(TR.cx + hs, TR.cy - R);
    c.arc(TR.cx + hs, TR.cy, R, -Math.PI / 2, Math.PI / 2);
    c.lineTo(TR.cx - hs, TR.cy + R);
    c.arc(TR.cx - hs, TR.cy, R, Math.PI / 2, 3 * Math.PI / 2);
    c.closePath();
  }

  function drawTrack() {
    ctx.clearRect(0, 0, W, H);
    // tribunes stylisées en haut
    ctx.fillStyle = "rgba(255,255,255,.16)";
    for (var t = 0; t < 5; t++) ctx.fillRect(TR.cx - 150 + t * 4, 16 + t * 7, 300 - t * 8, 5);
    // surface de course
    var Rout = TR.R + TR.margin + 15.6 * TR.laneW;
    stadium(ctx, Rout + 8); ctx.fillStyle = "#5e9c53"; ctx.fill();
    stadium(ctx, Rout + 8); ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 2.5; ctx.stroke();
    // bandes de tonte
    for (var l = 0; l < 15; l += 2) {
      var Ra = TR.R + TR.margin + l * TR.laneW, Rb = Ra + TR.laneW;
      stadium(ctx, Rb); ctx.fillStyle = l % 4 ? "#639f57" : "#5b9950"; ctx.fill();
      stadium(ctx, Ra); ctx.fillStyle = l % 4 ? "#5b9950" : "#639f57"; ctx.fill();
    }
    // rond central
    stadium(ctx, TR.R + 4); ctx.fillStyle = "#2f7d46"; ctx.fill();
    stadium(ctx, TR.R + 4); ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 3; ctx.stroke();
    // plan d'eau + nom
    ctx.fillStyle = "rgba(140,190,225,.85)";
    ctx.beginPath(); ctx.ellipse(TR.cx + 70, TR.cy + 8, 60, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.font = "900 34px 'Barlow Condensed',sans-serif";
    ctx.textAlign = "center";
    ctx.fillText((DATA.meta.track || "") + " · " + fmtM(DIST) + " M", TR.cx - 40, TR.cy + 6);
    // poteaux des 200m / 400m / 600m
    [200, 400, 600].forEach(function (m) {
      var d = dFin - m * pxPerM;
      var a = point(d, -0.6), b = point(d, 15.4);
      ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.font = "700 11px 'Barlow Condensed',sans-serif";
      ctx.fillText(m + "", b.x, b.y + 14);
    });
    // ligne d'arrivée (damier)
    var fa = point(dFin, -0.6), fb = point(dFin, 15.4);
    var steps = 12;
    for (var i = 0; i < steps; i++) {
      var x1 = fa.x + (fb.x - fa.x) * (i / steps), y1 = fa.y + (fb.y - fa.y) * (i / steps);
      var x2 = fa.x + (fb.x - fa.x) * ((i + 1) / steps), y2 = fa.y + (fb.y - fa.y) * ((i + 1) / steps);
      ctx.strokeStyle = i % 2 ? "#111" : "#fff"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    // stalles au départ (avant le lancement)
    if (state.phase === "idle" || state.phase === "count") {
      var sa = point(d0, -0.6), sb = point(d0, 15.4);
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sa.x, sa.y); ctx.lineTo(sb.x, sb.y); ctx.stroke();
      ctx.fillStyle = "rgba(18,32,58,.85)"; ctx.font = "700 12px 'Barlow Condensed',sans-serif";
      ctx.fillText("DÉPART", (sa.x + sb.x) / 2, (sa.y + sb.y) / 2 - 12);
    }
  }

  /* =============== ÉTAT DE COURSE =============== */
  var state = { phase: "idle", t: 0, mult: 2, order: [], confetti: [], dust: [] };
  var runners = [];
  var BASE_V = DIST / 146; // ~16.4 m/s -> course d'environ 2'26 en vitesse réelle

  function makeRunners() {
    runners = HORSES.map(function (h) {
      return {
        h: h, m: 0, lane: 1 + (h.draw - 1) * 0.95, ns: 0,
        form: 1 + (Math.random() - 0.5) * 0.02 * h.vol,
        phase: Math.random() * Math.PI * 2,
        finished: false, fTime: 0
      };
    });
  }

  function styleFactor(st, p) {
    if (st === "leader") return p < 0.22 ? 1.045 : p < 0.8 ? 1.006 : 0.978;
    if (st === "closer") return p < 0.35 ? 0.968 : p < 0.75 ? 0.995 : 1.055;
    if (st === "stalker") return p < 0.22 ? 1.014 : p < 0.8 ? 1.0 : 1.018;
    return p < 0.8 ? 0.999 : 1.012; // mid
  }

  function tick(dt) {
    var chaos = scenario.chaos || 1;
    var paceK = scenario.pace === "rapide" ? 1.5 : scenario.pace === "lent" ? 0.55 : 1;
    runners.forEach(function (r) {
      if (r.finished) { r.m += BASE_V * 0.85 * dt; return; }
      var h = r.h, p = r.m / DIST;
      var ab = 1 + ((h.ab - 77) / 77) * 0.042;
      var sf = styleFactor(h.style, p);
      if (h.style === "leader" && scenario.pace === "rapide" && p < 0.5) sf += 0.018;
      var wf = p > 0.72 ? 1 + (55.5 - h.w) * 0.0038 * (0.6 + 0.4 * paceK) : 1;
      var bias = (scenario.bias && scenario.bias[String(h.n)]) || 1;
      var bf = 1 + (bias - 1) * (0.55 + p * 0.75); // le biais du scénario pèse surtout en fin de course
      var fat = p > 0.78 ? 1 - (p - 0.78) * 0.05 * paceK : 1;
      r.ns += (Math.random() - 0.5) * 0.016 * h.vol * chaos;
      r.ns *= 0.994;
      var lim = 0.035 * h.vol * chaos;
      if (r.ns > lim) r.ns = lim; if (r.ns < -lim) r.ns = -lim;
      var v = BASE_V * ab * sf * wf * bf * fat * r.form * (1 + r.ns);
      r.m += v * dt;
      if (r.m >= DIST && !r.finished) {
        r.finished = true; r.fTime = state.t + (r.m - DIST) / v;
        state.order.push(r);
        onFinish(r);
      }
    });
    // rabattement progressif vers la corde selon le classement
    var sorted = standings();
    sorted.forEach(function (r, i) {
      var p = r.m / DIST;
      var target = p < 0.06 ? r.lane : 0.6 + i * 0.55 + Math.sin(r.phase + state.t) * 0.22;
      r.lane += (target - r.lane) * Math.min(1, dt * 0.7);
    });
    state.t += dt;
  }

  function standings() {
    return runners.slice().sort(function (a, b) {
      var fa = a.finished, fb = b.finished;
      if (fa && fb) return a.fTime - b.fTime;
      if (fa) return -1; if (fb) return 1;
      return b.m - a.m;
    });
  }

  /* =============== DESSIN DES CHEVAUX =============== */
  function drawHorse(r) {
    var d = d0 + r.m * pxPerM;
    var pt = point(d, r.lane), ang = heading(d, r.lane);
    var bounce = Math.abs(Math.sin(state.t * 13 + r.phase)) * 2;
    ctx.save();
    ctx.translate(pt.x, pt.y - bounce);
    ctx.rotate(ang);
    // ombre
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath(); ctx.ellipse(0, 5 + bounce, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
    // jambes (galop)
    ctx.strokeStyle = "#3d2b1f"; ctx.lineWidth = 1.6;
    var k = Math.sin(state.t * 13 + r.phase) * 4;
    ctx.beginPath();
    ctx.moveTo(-6, 2); ctx.lineTo(-8 - k, 7);
    ctx.moveTo(-3, 2); ctx.lineTo(-2 + k, 7);
    ctx.moveTo(4, 2); ctx.lineTo(3 - k, 7);
    ctx.moveTo(7, 2); ctx.lineTo(9 + k, 7);
    ctx.stroke();
    // corps
    ctx.fillStyle = "#6b4a2f";
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 4.4, 0, 0, Math.PI * 2); ctx.fill();
    // encolure + tête
    ctx.beginPath(); ctx.ellipse(9, -2.5, 4.5, 2.4, 0.5, 0, Math.PI * 2); ctx.fill();
    // casaque (jockey)
    ctx.fillStyle = r.h.c[0];
    ctx.beginPath(); ctx.ellipse(-1, -4.5, 4, 3.4, -0.25, 0, Math.PI * 2); ctx.fill();
    // casque
    ctx.fillStyle = r.h.c[1];
    ctx.beginPath(); ctx.arc(0.5, -7.4, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // dossard
    ctx.save();
    ctx.translate(pt.x, pt.y - bounce - 14);
    ctx.fillStyle = "rgba(18,32,58,.88)";
    ctx.beginPath();
    var bw = r.h.n > 9 ? 9 : 7;
    ctx.roundRect ? (ctx.roundRect(-bw, -7, bw * 2, 13, 3), ctx.fill())
                  : ctx.fillRect(-bw, -7, bw * 2, 13);
    ctx.fillStyle = "#fff"; ctx.font = "700 10px 'Barlow Condensed',sans-serif";
    ctx.textAlign = "center"; ctx.fillText(String(r.h.n), 0, 3);
    ctx.restore();
    // poussière derrière les 3 premiers
    if (state.phase === "run" && Math.random() < 0.25) {
      var back = point(d - 10, r.lane);
      state.dust.push({ x: back.x, y: back.y, a: 0.35, r: 1.5 + Math.random() * 2 });
    }
  }

  function drawDust() {
    state.dust = state.dust.filter(function (p) { return p.a > 0.02; });
    state.dust.forEach(function (p) {
      ctx.fillStyle = "rgba(222,214,190," + p.a + ")";
      ctx.beginPath(); ctx.arc(p.x, p.y - (0.35 - p.a) * 18, p.r, 0, Math.PI * 2); ctx.fill();
      p.a *= 0.92; p.r += 0.25;
    });
  }

  function drawConfetti() {
    state.confetti.forEach(function (c) {
      ctx.save();
      ctx.translate(c.x, c.y); ctx.rotate(c.rot);
      ctx.fillStyle = c.col; ctx.fillRect(-c.s / 2, -c.s / 4, c.s, c.s / 2);
      ctx.restore();
      c.x += c.vx; c.y += c.vy; c.vy += 0.08; c.rot += c.vr;
    });
    state.confetti = state.confetti.filter(function (c) { return c.y < H + 20; });
  }

  function spawnConfetti() {
    var cols = ["#e4322b", "#e8b64c", "#2f7d46", "#1e4fd8", "#f26522", "#ffffff"];
    for (var i = 0; i < 160; i++) {
      state.confetti.push({
        x: Math.random() * W, y: -20 - Math.random() * 160,
        vx: (Math.random() - 0.5) * 1.6, vy: 1 + Math.random() * 2.4,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.25,
        s: 6 + Math.random() * 6, col: cols[(Math.random() * cols.length) | 0]
      });
    }
  }

  /* =============== CLASSEMENT + COMMENTAIRES =============== */
  var stBox = $("qsStandings"), rows = {};
  function buildRows() {
    stBox.innerHTML = ""; rows = {};
    HORSES.forEach(function (h) {
      var r = document.createElement("div");
      r.className = "qs-strow";
      r.innerHTML = '<span class="pos">–</span><span class="qs-silk" style="background:' + h.c[0] + '"></span>' +
        '<span class="num">' + h.n + '</span><span class="nm">' + h.name + '</span><span class="gap"></span>';
      stBox.appendChild(r); rows[h.n] = r;
    });
    stBox.style.height = (HORSES.length * 27) + "px";
    layoutRows(runners.slice());
  }
  function layoutRows(sorted) {
    sorted.forEach(function (r, i) {
      var el = rows[r.h.n]; if (!el) return;
      el.style.top = (i * 27) + "px";
      el.classList.toggle("qs-top5", i < 5);
      el.querySelector(".pos").textContent = (i + 1) + "";
      var lead = sorted[0];
      // 1 longueur ≈ 2,4 m ; après la ligne, l'écart se fige au temps de passage
      var leadM = lead.finished ? DIST : lead.m;
      var selfM = r.finished ? DIST : r.m;
      var gapL = (leadM - selfM) / 2.4;
      if (lead.finished && r.finished) gapL = (r.fTime - lead.fTime) * BASE_V / 2.4;
      el.querySelector(".gap").textContent =
        i === 0 ? "tête" : gapL < 0.25 ? "nez" : "+" + (gapL < 10 ? gapL.toFixed(1) : Math.round(gapL)) + " L";
    });
  }

  var feed = $("qsFeed");
  function say(txt, hot) {
    var p = document.createElement("p");
    if (hot) p.className = "qs-hotline";
    p.textContent = txt;
    feed.insertBefore(p, feed.firstChild);
    while (feed.children.length > 30) feed.removeChild(feed.lastChild);
  }

  var MILES = [
    { m: 100, f: function (s) { return "Top départ ! Bonne sortie de stalles, " + s[0].h.name + " et " + s[1].h.name + " impriment le tempo."; } },
    { m: DIST - 2000, f: function (s) { return "Passage devant les tribunes : " + s[0].h.name + " mène, " + s[1].h.name + " dans son sillage, " + s[2].h.name + " bien placé à la corde."; } },
    { m: DIST - 1600, f: function (s) { return "Mi-course. Le train est " + (scenario.pace === "rapide" ? "très soutenu" : scenario.pace === "lent" ? "faux, tout le monde se regarde" : "régulier") + ". " + s[s.length - 1].h.name + " ferme la marche."; } },
    { m: DIST - 1000, f: function (s) { return "Dernier tournant en vue ! " + s[0].h.name + " toujours devant, " + s[3].h.name + " et " + s[4].h.name + " se rapprochent à l'extérieur."; } },
    { m: DIST - 600, f: function (s) { return "600 mètres ! " + s[1].h.name + " attaque " + s[0].h.name + " — les finisseurs se lancent !"; }, hot: true },
    { m: DIST - 400, f: function (s) { return "Ligne droite finale ! " + s[0].h.name + " résiste, " + s[1].h.name + " revient très fort !"; }, hot: true },
    { m: DIST - 200, f: function (s) { return "Derniers 200 mètres — " + s[0].h.name + ", " + s[1].h.name + ", " + s[2].h.name + ", ils sont trois pour la gagne !"; }, hot: true }
  ];
  var nextMile = 0;

  function onFinish(r) {
    var pos = state.order.length;
    if (pos === 1) {
      $("qsFlash").classList.add("qs-on");
      setTimeout(function () { $("qsFlash").classList.remove("qs-on"); }, 160);
      var margin = runners.filter(function (x) { return !x.finished; })
        .reduce(function (mx, x) { return Math.max(mx, x.m); }, 0);
      var gap = (DIST - margin) / 2.4;
      say(gap < 0.6 ? "PHOTO-FINISH !!! " + r.h.name + " l'emporte d'un nez !" :
        r.h.name + " (" + r.h.n + ") s'impose ! " + r.h.jockey + " lève sa cravache !", true);
      spawnConfetti();
    } else if (pos <= 5) {
      say(pos + "e : " + r.h.name + " (" + r.h.n + ").");
    }
    if (pos === 5) showResult();
  }

  function showResult() {
    var top5 = state.order.slice(0, 5);
    var combo = $("qsCombo");
    combo.innerHTML = "";
    top5.forEach(function (r, i) {
      var n = document.createElement("div");
      n.className = "n"; n.style.background = r.h.c[0];
      n.style.animationDelay = (i * 0.18) + "s";
      n.textContent = r.h.n;
      combo.appendChild(n);
    });
    var list = $("qsResList"); list.innerHTML = "";
    standings().forEach(function (r) {
      var li = document.createElement("li");
      li.innerHTML = "<b>" + r.h.name + "</b> (" + r.h.n + ") — " + r.h.jockey;
      list.appendChild(li);
    });
    var box = $("qsResultbox");
    box.classList.add("qs-show");
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    // fin d'essai gratuit -> proposer l'inscription après la 1re course
    if (!LOGGED && usedRuns() >= FREE_RUNS) setTimeout(showGate, 3800);
  }

  /* =============== BOUCLE PRINCIPALE =============== */
  var last = 0, raf = 0;
  function loop(ts) {
    if (!last) last = ts;
    var dt = Math.min(0.05, (ts - last) / 1000) * state.mult;
    last = ts;
    if (state.phase === "run") tick(dt);
    drawTrack();
    drawDust();
    standings().slice().reverse().forEach(drawHorse);
    drawConfetti();
    if (state.phase === "run") {
      var lead = standings()[0];
      var rest = DIST - lead.m;
      var hud = $("qsHudDist");
      hud.textContent = rest <= 210 ? "DERNIERS 200 M !" : fmtM(rest) + " m à parcourir";
      hud.classList.toggle("qs-hot", rest <= 210);
      if (nextMile < MILES.length && lead.m >= MILES[nextMile].m) {
        var s = standings();
        say(MILES[nextMile].f(s), !!MILES[nextMile].hot);
        nextMile++;
      }
      if ((loop.k = (loop.k || 0) + 1) % 12 === 0) layoutRows(standings());
      if (state.order.length >= HORSES.length) state.phase = "done";
    }
    if (state.phase !== "idle" || state.confetti.length) raf = requestAnimationFrame(loop);
    else { raf = 0; last = 0; }
  }
  function ensureLoop() { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }

  /* =============== CONTRÔLES =============== */
  var btnStart = $("qsStart"), btnReset = $("qsReset"), selSpeed = $("qsSpeedSel");
  selSpeed.addEventListener("change", function () { state.mult = parseFloat(selSpeed.value); });
  state.mult = parseFloat(selSpeed.value);

  btnStart.addEventListener("click", function () {
    if (state.phase !== "idle") return;
    if (!canRun()) { showGate(); return; }
    if (!LOGGED) addRun();
    startCountdown();
  });
  btnReset.addEventListener("click", function () {
    if (!canRun() && state.phase !== "idle") { /* laisse finir */ }
    resetRace();
    say("Nouvelle simulation prête. Même scénario, nouvelle histoire — lance la course !");
  });

  function startCountdown() {
    state.phase = "count";
    btnStart.disabled = true;
    var cd = $("qsCount"), n = 3;
    say("Ils sont tous dans les stalles… concentration à " + (DATA.meta.track || "l'hippodrome") + ".");
    (function step() {
      cd.innerHTML = "<span>" + (n > 0 ? n : "PARTEZ !") + "</span>";
      if (n < 0) { cd.innerHTML = ""; startRace(); return; }
      n--; setTimeout(step, 850);
    })();
    ensureLoop();
  }

  function startRace() {
    state.phase = "run";
    nextMile = 0;
    ensureLoop();
  }

  function resetRace() {
    state.phase = "idle"; state.t = 0; state.order = [];
    state.confetti = []; state.dust = []; nextMile = 0;
    makeRunners(); buildRows();
    btnStart.disabled = false;
    $("qsResultbox").classList.remove("qs-show");
    $("qsHudDist").textContent = fmtM(DIST) + " m à parcourir";
    $("qsHudDist").classList.remove("qs-hot");
    $("qsCount").innerHTML = "";
    drawTrack();
    standings().slice().reverse().forEach(drawHorse);
  }

  /* =============== PORTE FREEMIUM =============== */
  var gate = $("qsGate");
  function showGate() { gate.hidden = false; }
  gate.addEventListener("click", function (e) { if (e.target === gate) gate.hidden = true; });
  $("qsGateLater").addEventListener("click", function () { gate.hidden = true; });
  $("qsGoogleBtn").setAttribute("href", LOGIN_URL);

  /* =============== GO =============== */
  makeRunners(); buildRows();
  drawTrack();
  standings().slice().reverse().forEach(drawHorse);
  say("Les partants se dirigent vers les stalles… choisis un scénario et lance la course.");
})();
