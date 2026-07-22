<button type="button" class="pwa-install" id="pwaInstall" hidden>📲 Installer l'app</button>
<div class="pwa-ios" id="pwaIos" hidden>
	<button type="button" class="pwa-ios-close" id="pwaIosClose">✕</button>
	Pour installer AgenTurf sur ton iPhone : appuie sur <b>Partager</b> <span class="pwa-share">⬆️</span> puis <b>« Sur l'écran d'accueil »</b>.
</div>
<script>
(function () {
	var btn = document.getElementById('pwaInstall');
	var ios = document.getElementById('pwaIos');
	if (!btn) return;
	var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
	if (standalone) return; // déjà installée
	var deferred = null;
	window.addEventListener('beforeinstallprompt', function (e) {
		e.preventDefault(); deferred = e; btn.hidden = false;
	});
	btn.addEventListener('click', function () {
		if (deferred) { deferred.prompt(); deferred.userChoice.finally(function () { deferred = null; btn.hidden = true; }); }
		else if (ios) { ios.hidden = false; }
	});
	// iOS : pas de beforeinstallprompt -> proposer le bouton avec la notice
	var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
	if (isIos) { btn.hidden = false; }
	var c = document.getElementById('pwaIosClose');
	if (c) c.addEventListener('click', function () { ios.hidden = true; });
})();
</script>
<?php wp_footer(); ?>
</body>
</html>
