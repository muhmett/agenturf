<?php
/** Simulateur — membres connectés. Le markup reprend la maquette validée ; les textes viennent du JSON du jour. */
$race = agenturf_race_data();
$meta = $race['meta'];
$nb   = count( $race['horses'] );
$user = is_user_logged_in() ? wp_get_current_user() : null;
?>
<div class="wrap" id="simapp">

	<?php if ( $user ) : ?>
	<div class="member-bar">
		<img class="member-avatar" src="<?php echo esc_url( get_avatar_url( $user->ID, array( 'size' => 72 ) ) ); ?>" alt="" width="36" height="36">
		<div class="member-info">
			<strong>Bonjour <?php echo esc_html( $user->display_name ); ?></strong>
			<span><?php echo esc_html( $user->user_email ); ?></span>
		</div>
		<a class="member-logout" href="<?php echo esc_url( wp_logout_url( home_url( '/' ) ) ); ?>">Déconnexion</a>
	</div>

	<div class="member-panel" id="memberPanel">
		<div class="member-essentials">
			<h3>À savoir avant de jouer</h3>
			<ul>
				<li>🎯 Ceci est un <strong>simulateur</strong> — les arrivées sont générées par un modèle, pas des résultats officiels.</li>
				<li>🔞 <strong>18 ans et plus.</strong> Jeu responsable : ne mise que ce que tu peux te permettre de perdre.</li>
				<li>📚 Retrouve <a href="<?php echo esc_url( get_post_type_archive_link( 'course' ) ); ?>">l'historique de toutes les courses analysées</a> dans les archives.</li>
			</ul>
		</div>
		<div class="member-history">
			<h3>Tes dernières simulations <small>(sur cet appareil)</small></h3>
			<ol id="historyList" class="history-list"><li class="history-empty">Aucune simulation lancée pour l'instant — clique sur « Lancer la course » ci-dessous.</li></ol>
		</div>
	</div>
	<?php endif; ?>

	<header class="card">
		<div class="eyebrow"><?php echo esc_html( $meta['eyebrow'] ); ?></div>
		<h1 class="racetitle"><?php echo esc_html( $meta['title'] ); ?><br><?php echo esc_html( $meta['subtitle'] ); ?></h1>
		<div class="meta">
			<?php foreach ( (array) $meta['info'] as $info ) : ?>
				<span><?php echo wp_kses( $info, array( 'b' => array() ) ); ?></span>
			<?php endforeach; ?>
		</div>
	</header>

	<section class="sim-section">
		<h2 class="sim-h2"><span class="tick"></span>Choisis ton scénario <small>chaque scénario recalibre la simulation</small></h2>
		<div class="scenarios" id="scenarios"></div>
	</section>

	<section class="sim-section">
		<h2 class="sim-h2"><span class="tick"></span>La course en direct</h2>
		<div class="trackbox">
			<canvas id="cv" width="1020" height="560"></canvas>
			<div class="hud">
				<div class="badge" id="hudDist"><?php echo esc_html( number_format( (int) $meta['distance'], 0, ',', ' ' ) ); ?> m à parcourir</div>
				<div class="badge"><?php echo esc_html( $meta['track'] ); ?> <em>·</em> <?php echo esc_html( $meta['code'] ); ?></div>
			</div>
			<div class="count" id="count"></div>
			<div class="flash" id="flash"></div>
		</div>
		<div class="controls">
			<button class="btn btn-go" id="btnStart">🏇 Lancer la course</button>
			<button class="btn btn-re" id="btnReset">↺ Nouvelle simulation</button>
			<button class="btn btn-mc" id="btnMC">📊 100 courses en 1 clic</button>
			<button class="btn btn-sound" id="btnSound" type="button">🔊 Son</button>
			<div class="speedctl">Vitesse
				<select id="speed">
					<option value="1">Réelle ×1</option>
					<option value="2" selected>Rapide ×2</option>
					<option value="4">Turbo ×4</option>
				</select>
			</div>
		</div>

		<div class="live">
			<div class="panel">
				<h3>Classement en direct</h3>
				<div id="standings"></div>
			</div>
			<div class="panel">
				<h3>Commentaires — micro <?php echo esc_html( $meta['track'] ); ?></h3>
				<div id="feed"><p>Les partants se dirigent vers les stalles… choisis un scénario et lance la course.</p></div>
			</div>
		</div>

		<div id="mcbox">
			<div class="panel">
				<h3>📊 Statistiques sur 100 courses — scénario actuel</h3>
				<div class="mc-grid">
					<div id="mcbars"></div>
					<div>
						<h3>Combinaisons les plus fréquentes</h3>
						<div id="mccombos"></div>
					</div>
				</div>
				<p class="mc-note">% = victoires · T5 = présences dans les 5 premiers. Change de scénario puis relance pour comparer.</p>
			</div>
		</div>

		<div id="resultbox">
			<div class="arrivee">
				<h3>Arrivée simulée — ce lancement (Quinté+)</h3>
				<div class="combo" id="combo"></div>
				<ol id="resList"></ol>
				<p class="note">⚠️ Ceci est <strong>une</strong> arrivée simulée parmi une infinité — ce n'est pas le résultat officiel de la course. Pour la tendance de fond, regarde plutôt les <strong>statistiques sur 100 courses</strong> ci-dessus. Chaque lancement produit une arrivée différente ; rien n'est garanti. 18+.</p>
			</div>
		</div>
	</section>

	<section class="sim-section">
		<h2 class="sim-h2"><span class="tick"></span>L'avis des professionnels <small>pronostics presse · cotes · écuries</small></h2>
		<div class="avisgrid" id="avisbox"></div>
	</section>

	<section class="sim-section">
		<h2 class="sim-h2"><span class="tick"></span>Les <?php echo (int) $nb; ?> partants décryptés <small>driver · entraîneur · musique · avis</small></h2>
		<div class="grid" id="cards"></div>
	</section>

	<div id="cinema" hidden>
		<div class="cine-stage">
			<canvas id="cv3" width="1280" height="720"></canvas>
			<div class="cine-intro" id="cineIntro" hidden>
				<video id="cineIntroVid" muted playsinline preload="auto"></video>
				<button type="button" class="skip" id="cineSkip">Passer l'intro ▸</button>
			</div>
			<div class="cine-hud">
				<div class="badge" id="cineDist"></div>
				<div class="badge"><span class="cine-live">●</span> EN DIRECT · <?php echo esc_html( $meta['track'] ); ?></div>
			</div>
			<button type="button" class="cine-sound" id="cineSound">🔊 Son</button>
			<button type="button" class="cine-full" id="cineFull">⛶ Plein écran</button>
			<div class="cine-pos" id="cinePos"></div>
			<div class="cine-ticker" id="cineTicker"></div>
			<div class="count" id="cineCount"></div>
			<div class="cine-result" id="cineResult" hidden></div>
			<button type="button" class="cine-close" id="cineClose">✕ Quitter le direct</button>
		</div>
	</div>

	<div class="inter-ad" id="interAd" hidden>
		<div class="inter-card">
			<div class="inter-tag">Publicité</div>
			<div id="interSlot" class="inter-slot" hidden></div>
			<h3 id="interTitle"></h3>
			<a id="interLink" href="#" target="_blank" rel="nofollow sponsored noopener">
				<img id="interImg" alt="Offre partenaire">
				<span class="inter-btn" id="interBtn">Voir l'offre</span>
			</a>
			<button type="button" class="inter-skip" id="interSkip"></button>
		</div>
	</div>

	<div class="gate-pop" id="gate" hidden>
		<div class="gate-card">
			<div class="gate-badge">🔓 Accès gratuit</div>
			<h3>Débloque les simulations illimitées</h3>
			<p>Tu as vu ta simulation gratuite. Connecte-toi avec <strong>Google</strong> — un clic, gratuit — pour continuer à lancer les courses et débloquer le mode <strong>« 1 clic = 100 courses »</strong>.</p>
			<a class="gate-google" id="gateGoogle" href="#" rel="nofollow">
				<svg viewBox="0 0 48 48" aria-hidden="true" width="20" height="20"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
				Continuer avec Google
			</a>
			<p class="gate-mini"><a href="#" id="gateLater">Plus tard</a> · 🔒 Gratuit, aucune carte bancaire. Juste ton compte Google.</p>
		</div>
	</div>

	<p class="disclaimer">Outil d'analyse et de divertissement. Les probabilités affichées sont des estimations issues du modèle, pas des cotes officielles. Jouer comporte des risques : ne mise que ce que tu peux te permettre de perdre.</p>
</div>
