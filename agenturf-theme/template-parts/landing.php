<?php
/** Landing visiteur : hero vidéo + outils + porte Google. */
$login = agenturf_login_url();
$race  = agenturf_race_data();
$meta  = $race['meta'];
$nb    = count( $race['horses'] );
$nbsc  = count( $race['scenarios'] );
$google_svg = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>';
?>
<div id="landing">

	<div class="hero" id="hero">
		<div class="hero-sticky">
			<video class="hero-video" id="heroVideo"
				src="<?php echo esc_url( agenturf_video_url() ); ?>"
				poster="<?php echo esc_url( agenturf_poster_url() ); ?>"
				autoplay muted loop playsinline></video>
			<div class="hero-veil" id="heroVeil"></div>
			<div class="hero-inner" id="heroTitle">
				<span class="hero-chip"><?php echo esc_html( $meta['eyebrow'] ); ?></span>
				<h1 class="hero-h1">Le Quinté du jour,<br><em>simulé</em> avant d'être couru</h1>
				<p class="hero-sub">Analyse complète des partants, <?php echo (int) $nbsc; ?> scénarios pondérés par un modèle, et une course animée en direct — relance-la autant de fois que tu veux, chaque arrivée est différente.</p>
				<a class="hero-cta google-cta-like" href="#acces">🏇 Accéder au simulateur</a>
			</div>
			<div class="hero-cue">Fais défiler</div>
		</div>
	</div>

	<section class="land-section">
		<h2 class="land-h2 reveal"><span class="tick"></span>Les outils AgenTurf</h2>
		<p class="land-lead reveal">Tout ce qu'il faut pour lire la course avant tout le monde — mis à jour chaque jour de Quinté+.</p>
		<div class="tools">
			<div class="tool reveal">
				<div class="ico">🏇</div>
				<h3>Simulateur en direct</h3>
				<p>La course animée sur la piste : départ, train, rabattement à la corde, emballage final. Classement en direct et commentaires comme au micro de l'hippodrome.</p>
				<span class="mini">Arrivée différente à chaque lancement</span>
			</div>
			<div class="tool reveal d1">
				<div class="ico">🎯</div>
				<h3><?php echo (int) $nbsc; ?> scénarios pondérés</h3>
				<p>Course de bon sens, coup d'écurie, revanche des poids plume, chaos total… chaque scénario recalibre le modèle avec sa probabilité estimée.</p>
				<span class="mini">Probabilités du modèle</span>
			</div>
			<div class="tool reveal d2">
				<div class="ico">📋</div>
				<h3>Partants décryptés</h3>
				<p>Valeur handicap, poids, corde, musique, style de course et avis entraîneurs — chaque partant analysé en une fiche claire.</p>
				<span class="mini">Mise à jour quotidienne</span>
			</div>
		</div>
		<div class="counters">
			<div class="counter reveal"><b data-count="<?php echo (int) $nb; ?>">0</b><span>partants analysés</span></div>
			<div class="counter reveal d1"><b data-count="<?php echo (int) $nbsc; ?>">0</b><span>scénarios de course</span></div>
			<div class="counter reveal d2"><b>∞</b><span>simulations</span></div>
			<div class="counter reveal d3"><b>100<small>%</small></b><span>gratuit</span></div>
		</div>
	</section>

	<section class="land-section">
		<h2 class="land-h2 reveal"><span class="tick"></span>Comment ça marche</h2>
		<div class="steps">
			<div class="step reveal"><span class="num">1</span><h3>Connecte-toi avec Google</h3><p>Un clic, aucune carte bancaire. Ton compte débloque tous les outils, tous les jours.</p></div>
			<div class="step reveal d1"><span class="num">2</span><h3>Choisis ton scénario</h3><p>Lis l'analyse des partants, puis choisis le scénario de course auquel tu crois.</p></div>
			<div class="step reveal d2"><span class="num">3</span><h3>Lance la simulation</h3><p>Regarde la course se jouer et compare les combinaisons qui reviennent le plus souvent.</p></div>
		</div>
	</section>

	<section class="land-section">
		<h2 class="land-h2 reveal"><span class="tick"></span>L'analyse du jour <small><?php echo esc_html( wp_strip_all_tags( $meta['eyebrow'] ) ); ?></small></h2>
		<p class="land-lead reveal"><strong><?php echo esc_html( $meta['title'] ); ?></strong> — <?php echo esc_html( $meta['subtitle'] ); ?>. Les <?php echo (int) $nb; ?> partants, les avis des professionnels et la simulation complète t'attendent derrière la connexion gratuite.</p>

		<?php if ( ! empty( $meta['avis'] ) ) : ?>
		<div class="avisgrid">
			<?php foreach ( $meta['avis'] as $a ) : ?>
				<div class="avis reveal"><h4><?php echo esc_html( $a['src'] ); ?></h4><p><?php echo wp_kses( $a['txt'], array( 'b' => array() ) ); ?></p></div>
			<?php endforeach; ?>
		</div>
		<?php endif; ?>

		<div class="parttable reveal">
			<table>
				<thead><tr><th>N°</th><th>Cheval</th><th>Driver / Jockey</th><th>Cote</th><th>Musique</th></tr></thead>
				<tbody>
				<?php foreach ( $race['horses'] as $h ) : ?>
					<tr>
						<td><b><?php echo (int) $h['n']; ?></b></td>
						<td><?php echo esc_html( $h['name'] ); ?></td>
						<td><?php echo esc_html( $h['jockey'] ); ?></td>
						<td><?php echo esc_html( $h['odds'] ); ?></td>
						<td class="mus"><?php echo esc_html( isset( $h['musique'] ) ? $h['musique'] : '' ); ?></td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>
		</div>
		<p class="land-lead reveal" style="margin-top:14px">📚 <a href="<?php echo esc_url( get_post_type_archive_link( 'course' ) ); ?>">Consulter les archives de tous les Quintés analysés</a></p>
	</section>

	<div class="gatewrap" id="acces">
		<div class="gatecard reveal">
			<h2>La course du jour t'attend<br><em><?php echo esc_html( $meta['title'] ); ?></em></h2>
			<p><?php echo esc_html( $meta['subtitle'] ); ?> — l'accès au simulateur est réservé aux membres. C'est gratuit et immédiat :</p>
			<ul>
				<li>Simulations illimitées, chaque arrivée est différente</li>
				<li>Les <?php echo (int) $nbsc; ?> scénarios du modèle débloqués</li>
				<li>L'analyse complète des <?php echo (int) $nb; ?> partants</li>
				<li>Le Quinté+ du jour, chaque jour</li>
			</ul>
			<br>
			<a class="google-cta" href="<?php echo esc_url( $login ); ?>" rel="nofollow"><?php echo $google_svg; // phpcs:ignore ?> Continuer avec Google</a>
			<p class="gate-note">Gratuit. Aucune carte bancaire. Juste ton compte Google.</p>
		</div>
	</div>

	<section class="land-section seo-section">
		<h2 class="land-h2 reveal"><span class="tick"></span>Pronostic Quinté+ du jour, simulé avant la course</h2>
		<div class="seo-grid">
			<div class="seo-col reveal">
				<h3>Le simulateur de Quinté+ nouvelle génération</h3>
				<p>AgenTurf réunit tout ce que cherche un turfiste : le <strong>pronostic Quinté+ du jour</strong>, l'<strong>analyse des partants</strong>, les <strong>cotes PMU</strong>, les <strong>musiques</strong> et surtout une <strong>simulation de course en direct</strong>. Avant même le départ, tu vois la course se jouer sous tes yeux — départ, train, rabattement à la corde et emballage final — puis l'<strong>arrivée du Quinté+</strong> et la combinaison gagnante. Chaque lancement rejoue la course : tu compares les combinaisons qui reviennent le plus souvent.</p>
				<p>Que tu joues le <strong>Quinté+</strong>, le <strong>Quarté+</strong>, le <strong>Tiercé</strong>, le <strong>2 sur 4</strong> ou le <strong>Multi</strong>, l'outil t'aide à construire ta base, tes tocards et tes chevaux de complément à partir des <strong>pronostics PMU</strong> et des avis de la presse (Equidia, Canalturf, ZEturf, Geny).</p>
				<h3>Trot attelé, plat et obstacle</h3>
				<p>Le simulateur s'adapte à la discipline : <strong>trot attelé</strong> (sulky et driver), <strong>trot monté</strong>, <strong>plat</strong> et <strong>obstacle</strong>, sur tous les hippodromes — Vincennes, Enghien, Chantilly, Deauville, Longchamp, ParisLongchamp, Cagnes-sur-Mer, Vichy, Auteuil et les réunions de province.</p>
			</div>
			<div class="seo-col reveal d1">
				<h3>Questions fréquentes</h3>
				<div class="faq">
					<details><summary>C'est quoi le Quinté+ du jour ?</summary><p>Le Quinté+ est le pari phare du PMU : trouver les 5 premiers chevaux d'une course. AgenTurf te donne chaque jour les partants, les pronostics et une simulation animée de l'arrivée probable.</p></details>
					<details><summary>Comment avoir le pronostic Quinté+ gratuit ?</summary><p>Crée un compte gratuit avec Google : tu débloques l'analyse complète des partants, les scénarios du modèle et les simulations illimitées, sans carte bancaire.</p></details>
					<details><summary>Où voir l'arrivée du Quinté+ d'aujourd'hui ?</summary><p>La simulation te montre une arrivée probable ; l'arrivée officielle est publiée après la course. Consulte aussi nos archives quotidiennes de chaque Quinté analysé.</p></details>
					<details><summary>Le simulateur donne-t-il des pronostics sûrs ?</summary><p>Non — aucun pronostic n'est garanti. C'est un outil d'analyse et de divertissement : les probabilités sont des estimations du modèle, pas des certitudes.</p></details>
					<details><summary>Puis-je l'installer comme une application ?</summary><p>Oui : sur Android comme sur iPhone, tu peux ajouter AgenTurf à ton écran d'accueil et l'ouvrir comme une vraie app (voir le bouton « Installer l'app »).</p></details>
				</div>
			</div>
		</div>
		<p class="seo-tags reveal">Mots-clés : pronostic quinté demain · arrivée quinté du jour · quinté+ PMU gratuit · partants quinté · pronostic PMU · simulateur course de chevaux · tiercé quarté quinté · pronostic trot attelé · pronostic plat · cote PMU · base quinté · tocard du jour · quinté de demain · course en direct · Vincennes · Enghien · Deauville · ParisLongchamp.</p>
	</section>

	<footer class="land-footer">
		<hr>
		Outil d'analyse et de divertissement. Les probabilités affichées sont des estimations issues du modèle, pas des cotes officielles. Jouer comporte des risques : ne mise que ce que tu peux te permettre de perdre. 18+ · Interdit aux mineurs.
	</footer>

</div>
