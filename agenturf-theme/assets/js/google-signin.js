/* =========================================================
   AgenTurf — connexion Google intégrée (Google Identity Services)
   Rend le bouton Google directement dans les emplacements .gsi-slot
   présents sur la page (topbar, popup "porte"). Aucun passage par
   wp-login.php : le popup Google s'ouvre sur place, le ID token reçu
   est vérifié côté serveur puis le compte WordPress est connecté.
   ========================================================= */
(function () {
  function whenGoogleReady(cb, tries) {
    tries = tries || 0;
    if (window.google && google.accounts && google.accounts.id) { cb(); return; }
    if (tries > 60) return; // ~15s, abandon silencieux (script Google bloqué/lent)
    setTimeout(function () { whenGoogleReady(cb, tries + 1); }, 250);
  }

  function postCredential(credential) {
    var cfg = window.AGENTURF_GSI;
    if (!cfg || !cfg.ajax) return;
    var body = "action=agenturf_google_signin&credential=" + encodeURIComponent(credential) +
      "&_wpnonce=" + encodeURIComponent(cfg.nonce || "");
    fetch(cfg.ajax, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body,
      credentials: "same-origin",
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.success) {
          location.href = (data.data && data.data.redirect) || location.href;
        }
      })
      .catch(function () {});
  }

  function renderButtons() {
    document.querySelectorAll(".gsi-slot").forEach(function (el) {
      if (el.dataset.rendered) return;
      google.accounts.id.renderButton(el, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        locale: "fr",
        width: el.dataset.width || undefined,
      });
      el.dataset.rendered = "1";
    });
  }

  whenGoogleReady(function () {
    var cfg = window.AGENTURF_GSI;
    if (!cfg || !cfg.clientId) return;
    google.accounts.id.initialize({
      client_id: cfg.clientId,
      callback: function (resp) { if (resp && resp.credential) postCredential(resp.credential); },
    });
    renderButtons();
  });
})();
