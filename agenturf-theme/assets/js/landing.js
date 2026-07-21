/* AgenTurf — animations de la landing (scroll-driven, zéro dépendance). */
(function () {
  "use strict";

  var hero = document.getElementById("hero");
  var video = document.getElementById("heroVideo");
  var veil = document.getElementById("heroVeil");
  var title = document.getElementById("heroTitle");
  var bar = document.getElementById("scrollbar");
  var ticking = false;

  function update() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var doc = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (doc > 0 ? (y / doc) * 100 : 0) + "%";
    if (!hero) return;
    var span = hero.offsetHeight - window.innerHeight;
    var p = span > 0 ? Math.min(1, Math.max(0, y / span)) : 0;
    // la vidéo zoome doucement et s'assombrit pendant que le client descend
    if (video) video.style.transform = "scale(" + (1 + p * 0.18) + ")";
    if (veil) veil.style.opacity = String(0.3 + p * 0.55);
    // le titre monte en parallaxe puis s'efface
    if (title) {
      title.style.transform = "translateY(" + (-p * 70) + "px)";
      title.style.opacity = String(Math.max(0, 1 - Math.max(0, p - 0.45) * 2.4));
    }
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();

  /* apparitions au scroll */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    Array.prototype.forEach.call(document.querySelectorAll(".reveal"), function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(document.querySelectorAll(".reveal"), function (el) { el.classList.add("in"); });
  }

  /* compteurs animés */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var t0 = null, dur = 1100;
    function frame(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = String(Math.round(target * eased));
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(document.querySelectorAll("[data-count]"), function (el) { cio.observe(el); });
  } else {
    Array.prototype.forEach.call(document.querySelectorAll("[data-count]"), function (el) {
      el.textContent = el.getAttribute("data-count");
    });
  }
})();
