<?php
/**
 * AgenTurf — fonctions du thème.
 * Landing vidéo + simulateur Quinté+ réservé aux membres.
 */

defined( 'ABSPATH' ) || exit;

define( 'AGENTURF_VERSION', '1.15.1' );
define( 'AGENTURF_OPT_RACE', 'agenturf_race_json' );
define( 'AGENTURF_OPT_VIDEO', 'agenturf_hero_video' );
define( 'AGENTURF_OPT_POSTER', 'agenturf_hero_poster' );
define( 'AGENTURF_OPT_CINE', 'agenturf_cine_intro' );
define( 'AGENTURF_OPT_ACCESS', 'agenturf_access' ); // 'open' (tout le monde) ou 'members' (connexion requise)
define( 'AGENTURF_OPT_INTER', 'agenturf_inter' );   // interstitiel avant la course (JSON)
define( 'AGENTURF_OPT_ADHEAD', 'agenturf_ad_head' ); // code publicitaire (en-tête, réseaux type Adsterra/Monetag)
define( 'AGENTURF_OPT_GATE', 'agenturf_gate' );     // porte email : 'off' | 'email'
define( 'AGENTURF_OPT_LEADS', 'agenturf_leads' );    // emails collectés (liste)

/* Config de l'interstitiel « avant la course ». */
function agenturf_inter_cfg() {
	$raw = get_option( AGENTURF_OPT_INTER, '' );
	$d   = json_decode( (string) $raw, true );
	if ( ! is_array( $d ) ) {
		$d = array();
	}
	return array(
		'img'   => isset( $d['img'] ) ? $d['img'] : '',
		'link'  => isset( $d['link'] ) ? $d['link'] : '',
		'title' => isset( $d['title'] ) ? $d['title'] : '',
		'btn'   => isset( $d['btn'] ) ? $d['btn'] : 'Voir l\'offre',
		'code'  => isset( $d['code'] ) ? $d['code'] : '', // code brut du réseau (vidéo/interstitiel)
		'skip'  => isset( $d['skip'] ) ? (int) $d['skip'] : 4,
		'freq'  => isset( $d['freq'] ) ? (int) $d['freq'] : 0, // 0 = désactivé, N = 1 fois sur N
	);
}

/* Mode d'accès : 'open' par défaut → le simulateur est visible sans connexion. */
function agenturf_access_mode() {
	$m = get_option( AGENTURF_OPT_ACCESS, 'open' );
	return ( 'members' === $m ) ? 'members' : 'open';
}

/* Porte email : 'email' = 1 simulation gratuite puis email requis (bouton 100 toujours protégé). */
function agenturf_gate_mode() {
	$m = get_option( AGENTURF_OPT_GATE, 'email' );
	return ( 'off' === $m ) ? 'off' : 'email';
}

/* Vue à afficher : 'landing' (portail vidéo) ou 'simulator'. */
function agenturf_current_view() {
	$apercu = isset( $_GET['apercu'] ) ? sanitize_key( wp_unslash( $_GET['apercu'] ) ) : '';
	if ( 'portail' === $apercu ) {
		return 'landing';
	}
	if ( 'simulateur' === $apercu ) {
		return 'simulator';
	}
	if ( 'open' === agenturf_access_mode() ) {
		// Portail vidéo d'abord ; on entre au simulateur par un clic (?apercu=simulateur).
		return 'landing';
	}
	return is_user_logged_in() ? 'simulator' : 'landing';
}

/* Vidéo hero par défaut : course de chevaux, Pexels (licence libre) */
define( 'AGENTURF_DEFAULT_VIDEO', 'https://videos.pexels.com/video-files/31653765/13486027_1920_1080_25fps.mp4' );
define( 'AGENTURF_DEFAULT_POSTER', 'https://images.pexels.com/videos/31653765/nanango-31653765.jpeg?auto=compress&w=1600' );

add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
} );

/* Barre d'admin masquée pour les simples membres (lecture propre) */
add_filter( 'show_admin_bar', function ( $show ) {
	return current_user_can( 'manage_options' ) ? $show : false;
} );

/* ---------------- données de la course du jour ---------------- */

function agenturf_race_data() {
	$raw = get_option( AGENTURF_OPT_RACE, '' );
	if ( ! is_string( $raw ) || '' === trim( $raw ) ) {
		$raw = (string) file_get_contents( get_template_directory() . '/data/default-race.json' );
	}
	$data = json_decode( $raw, true );
	if ( ! is_array( $data ) || empty( $data['horses'] ) || empty( $data['scenarios'] ) ) {
		$data = json_decode( (string) file_get_contents( get_template_directory() . '/data/default-race.json' ), true );
	}
	return $data;
}

function agenturf_video_url() {
	$v = get_option( AGENTURF_OPT_VIDEO, '' );
	return $v ? $v : AGENTURF_DEFAULT_VIDEO;
}

function agenturf_poster_url() {
	$p = get_option( AGENTURF_OPT_POSTER, '' );
	return $p ? $p : AGENTURF_DEFAULT_POSTER;
}

function agenturf_login_url() {
	return wp_login_url( home_url( '/' ) );
}

/* ---------------- assets ---------------- */

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style(
		'agenturf-fonts',
		'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700;900&family=Barlow:wght@400;500;600&display=swap',
		array(),
		null
	);
	wp_enqueue_style( 'agenturf', get_stylesheet_uri(), array( 'agenturf-fonts' ), (string) filemtime( get_template_directory() . '/style.css' ) );

	if ( 'landing' === agenturf_current_view() ) {
		wp_enqueue_script( 'agenturf-landing', get_template_directory_uri() . '/assets/js/landing.js', array(), (string) filemtime( get_template_directory() . '/assets/js/landing.js' ), true );
	} else {
		wp_enqueue_script( 'agenturf-sim', get_template_directory_uri() . '/assets/js/simulator.js', array(), (string) filemtime( get_template_directory() . '/assets/js/simulator.js' ), true );
		wp_add_inline_script(
			'agenturf-sim',
			'window.QUINTE_SIM_CFG = ' . wp_json_encode( array(
				'race'       => agenturf_race_data(),
				'cineIntro'  => get_option( AGENTURF_OPT_CINE, '' ),
				'grandstand' => get_template_directory_uri() . '/assets/img/grandstand.jpg',
				'interAd'    => agenturf_inter_cfg(),
				'gate'       => array(
					'mode'  => is_user_logged_in() ? 'off' : agenturf_gate_mode(), // membres connectés : jamais bloqués
					'free'  => 1,
					'ajax'  => admin_url( 'admin-ajax.php' ),
					'nonce' => wp_create_nonce( 'agenturf_lead' ),
				),
			), JSON_HEX_TAG | JSON_HEX_AMP ) . ';', // HEX_TAG : le code pub peut contenir </script>, on l'échappe pour ne pas casser la page
			'before'
		);
	}
} );

/* ---------------- admin : « Quinté du jour » ---------------- */

add_action( 'admin_menu', function () {
	add_menu_page(
		'Quinté du jour',
		'Quinté du jour',
		'manage_options',
		'agenturf-race',
		'agenturf_admin_page',
		'dashicons-awards',
		3
	);
} );

function agenturf_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$raw = get_option( AGENTURF_OPT_RACE, '' );
	if ( '' === trim( (string) $raw ) ) {
		$raw = (string) file_get_contents( get_template_directory() . '/data/default-race.json' );
	}
	$saved = isset( $_GET['saved'] ) ? sanitize_text_field( wp_unslash( $_GET['saved'] ) ) : '';
	?>
	<div class="wrap">
		<h1>🏇 Quinté du jour</h1>
		<?php if ( 'ok' === $saved ) : ?>
			<div class="notice notice-success"><p>Enregistré ! La page publique est à jour immédiatement.</p></div>
		<?php elseif ( 'err' === $saved ) : ?>
			<div class="notice notice-error"><p>Fichier ou JSON invalide — rien n'a été enregistré. Le JSON doit contenir <code>meta</code>, <code>horses</code> et <code>scenarios</code> (vérifie sur jsonlint.com).</p></div>
		<?php endif; ?>

		<form method="post" enctype="multipart/form-data" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="agenturf_save">
			<?php wp_nonce_field( 'agenturf_save' ); ?>

			<h2 class="title">Accès au simulateur</h2>
			<?php $mode = agenturf_access_mode(); ?>
			<p>
				<label style="display:block;margin:4px 0;">
					<input type="radio" name="access_mode" value="open" <?php checked( 'open', $mode ); ?>>
					<strong>Ouvert à tout le monde</strong> — n'importe quel visiteur voit le simulateur, sans connexion. <em>(idéal pour lancer le site tout de suite)</em>
				</label>
				<label style="display:block;margin:4px 0;">
					<input type="radio" name="access_mode" value="members" <?php checked( 'members', $mode ); ?>>
					<strong>Membres seulement</strong> — les visiteurs voient le portail vidéo et doivent se connecter (Google via Nextend) pour accéder au simulateur.
				</label>
			</p>

			<?php $gate = agenturf_gate_mode(); $leads = get_option( AGENTURF_OPT_LEADS, array() ); $nleads = is_array( $leads ) ? count( $leads ) : 0; ?>
			<h3 style="margin:14px 0 4px;">Porte email (Gmail) — sans Google</h3>
			<p class="description" style="margin-top:0;">Fonctionne <strong>même si la connexion Google n'est pas encore active</strong> : le visiteur regarde <strong>1 simulation gratuite</strong>, puis une fenêtre lui demande son email pour continuer. Le bouton <strong>« 1 clic = 100 courses »</strong> est <strong>toujours</strong> protégé. Les emails sont collectés ici (ta liste de diffusion).</p>
			<p>
				<label style="display:block;margin:4px 0;">
					<input type="radio" name="gate_mode" value="email" <?php checked( 'email', $gate ); ?>>
					<strong>Activée</strong> — 1 simulation gratuite puis email requis · bouton 100 protégé. <em>(recommandé)</em>
				</label>
				<label style="display:block;margin:4px 0;">
					<input type="radio" name="gate_mode" value="off" <?php checked( 'off', $gate ); ?>>
					<strong>Désactivée</strong> — tout est libre, aucune demande d'email.
				</label>
			</p>
			<p class="description"><strong><?php echo (int) $nleads; ?></strong> email(s) collecté(s).
				<?php if ( $nleads > 0 ) : ?>
					<a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=agenturf_leads_csv' ), 'agenturf_leads_csv' ) ); ?>" class="button button-secondary" style="margin-left:8px;">⬇️ Télécharger les emails (CSV)</a>
				<?php endif; ?>
			</p>
			<hr>

			<h2 class="title">1. Charger la course du jour (fichier JSON)</h2>
			<p>Chaque matin, téléverse simplement le fichier JSON de la course — aucun code à toucher.</p>
			<p><input type="file" name="race_file" accept=".json,application/json"></p>

			<h2 class="title">2. … ou coller le JSON directement</h2>
			<textarea name="race_json" rows="18" style="width:100%;font-family:monospace;font-size:12px;"><?php echo esc_textarea( $raw ); ?></textarea>
			<p class="description">Si un fichier est téléversé ci-dessus, c'est lui qui est utilisé et ce champ est ignoré.</p>

			<h2 class="title">3. Vidéo de la page d'accueil</h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="hero_video">URL de la vidéo (mp4)</label></th>
					<td>
						<input type="url" class="regular-text" id="hero_video" name="hero_video" value="<?php echo esc_attr( get_option( AGENTURF_OPT_VIDEO, '' ) ); ?>" placeholder="<?php echo esc_attr( AGENTURF_DEFAULT_VIDEO ); ?>">
						<p class="description">Laisser vide = vidéo Pexels par défaut (course de chevaux). Tu peux téléverser ta propre vidéo dans Médias puis coller son URL ici.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="hero_poster">Image d'attente (poster)</label></th>
					<td><input type="url" class="regular-text" id="hero_poster" name="hero_poster" value="<?php echo esc_attr( get_option( AGENTURF_OPT_POSTER, '' ) ); ?>" placeholder="<?php echo esc_attr( AGENTURF_DEFAULT_POSTER ); ?>"></td>
				</tr>
				<tr>
					<th scope="row"><label for="cine_intro">Vidéo d'intro du Direct (mp4, optionnel)</label></th>
					<td>
						<input type="url" class="regular-text" id="cine_intro" name="cine_intro" value="<?php echo esc_attr( get_option( AGENTURF_OPT_CINE, '' ) ); ?>">
						<p class="description">Jouée 4 secondes en plein écran quand un membre lance la course, avant le compte à rebours (ambiance TV). Vide = désactivé.</p>
					</td>
				</tr>
			</table>

			<hr>
			<h2 class="title">4. Publicité avant la course (interstitiel)</h2>
			<?php $inter = agenturf_inter_cfg(); ?>
			<p>S'affiche quand un visiteur clique sur <strong>« Lancer la course »</strong>. Parfait pour une offre d'affiliation (ZEturf, Unibet…). Laisse la fréquence à 0 pour désactiver.</p>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="inter_freq">Fréquence</label></th>
					<td>
						<input type="number" min="0" max="20" id="inter_freq" name="inter_freq" value="<?php echo (int) $inter['freq']; ?>" style="width:80px">
						<p class="description">0 = désactivé · 1 = à chaque course · 2 = 1 course sur 2 · 3 = 1 sur 3… (recommandé : 2 ou 3, pour ne pas lasser).</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="inter_img">Image de la pub (URL)</label></th>
					<td><input type="url" class="regular-text" id="inter_img" name="inter_img" value="<?php echo esc_attr( $inter['img'] ); ?>" placeholder="https://…/banniere.jpg">
					<p class="description">Bannière/visuel de l'offre (téléverse dans Médias puis colle l'URL).</p></td>
				</tr>
				<tr>
					<th scope="row"><label for="inter_link">Lien (affiliation)</label></th>
					<td><input type="url" class="regular-text" id="inter_link" name="inter_link" value="<?php echo esc_attr( $inter['link'] ); ?>" placeholder="https://www.zeturf.fr/…ton-lien-affilié"></td>
				</tr>
				<tr>
					<th scope="row"><label for="inter_title">Titre</label></th>
					<td><input type="text" class="regular-text" id="inter_title" name="inter_title" value="<?php echo esc_attr( $inter['title'] ); ?>" placeholder="Joue ce Quinté sur ZEturf — 100€ offerts"></td>
				</tr>
				<tr>
					<th scope="row"><label for="inter_btn">Texte du bouton</label></th>
					<td><input type="text" class="regular-text" id="inter_btn" name="inter_btn" value="<?php echo esc_attr( $inter['btn'] ); ?>" placeholder="Voir l'offre"></td>
				</tr>
				<tr>
					<th scope="row"><label for="inter_code">Code pub VIDÉO du réseau</label></th>
					<td>
						<textarea id="inter_code" name="inter_code" rows="5" style="width:100%;font-family:monospace;font-size:12px;" placeholder="<!-- Colle ici le code que ton réseau pub te donne (Adsterra, Monetag, HilltopAds…) --></p>"><?php echo esc_textarea( $inter['code'] ); ?></textarea>
						<p class="description"><strong>Pour une pub VIDÉO :</strong> colle ici <em>uniquement</em> le code que ton réseau pub te donne (Adsterra « Interstitial/Video », Monetag « Vignette/Interstitial », HilltopAds « VAST Video », AdMaven…). Il s'affiche et se lance tout seul au clic sur « Lancer la course ». Tu n'as rien d'autre à faire. Laisse vide pour garder la pub image ci-dessus. La fréquence ci-dessus s'applique aussi au code vidéo.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="inter_skip">Délai avant « Passer » (s)</label></th>
					<td><input type="number" min="0" max="15" id="inter_skip" name="inter_skip" value="<?php echo (int) $inter['skip']; ?>" style="width:80px">
					<p class="description">Nombre de secondes avant que le bouton « Passer et lancer » apparaisse.</p></td>
				</tr>
			</table>

			<hr>
			<h2 class="title">5. Réseau publicitaire (code en-tête, optionnel)</h2>
			<p>Colle ici le code fourni par ton réseau (<strong>Adsterra</strong>, <strong>Monetag</strong>, AdSense…). Il gère lui-même ses pubs/interstitiels au clic. Laisse vide si tu utilises seulement l'interstitiel d'affiliation ci-dessus.</p>
			<textarea name="ad_head" rows="5" style="width:100%;font-family:monospace;font-size:12px;" placeholder="<script>…code du réseau…</script>"><?php echo esc_textarea( get_option( AGENTURF_OPT_ADHEAD, '' ) ); ?></textarea>

			<p>
				<?php submit_button( 'Enregistrer', 'primary', 'submit', false ); ?>
				&nbsp;
				<button type="submit" name="reset_default" value="1" class="button">Revenir à la course d'exemple</button>
			</p>
		</form>
		<p><em>Astuce : donne l'ancien JSON + le programme de la nouvelle course à une IA et demande-lui le même format — deux minutes et c'est prêt.</em></p>
		<hr>
		<h2 class="title">Mises à jour du thème</h2>
		<p>Le thème vérifie tout seul les nouvelles versions publiées sur GitHub (Apparence → Thèmes affiche « Mise à jour disponible »).</p>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="agenturf_check_update">
			<?php wp_nonce_field( 'agenturf_check_update' ); ?>
			<?php submit_button( '🔄 Vérifier les mises à jour maintenant', 'secondary', 'submit', false ); ?>
			<span class="description">&nbsp;Version installée : <?php echo esc_html( wp_get_theme( get_template() )->get( 'Version' ) ); ?></span>
		</form>
	</div>
	<?php
}

add_action( 'admin_post_agenturf_save', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Accès refusé.' );
	}
	check_admin_referer( 'agenturf_save' );

	$redirect = admin_url( 'admin.php?page=agenturf-race' );

	/* mode d'accès */
	$mode = isset( $_POST['access_mode'] ) && 'members' === $_POST['access_mode'] ? 'members' : 'open';
	update_option( AGENTURF_OPT_ACCESS, $mode, false );

	/* porte email */
	$gate = isset( $_POST['gate_mode'] ) && 'off' === $_POST['gate_mode'] ? 'off' : 'email';
	update_option( AGENTURF_OPT_GATE, $gate, false );

	/* interstitiel avant course */
	update_option( AGENTURF_OPT_INTER, wp_json_encode( array(
		'img'   => isset( $_POST['inter_img'] ) ? esc_url_raw( wp_unslash( $_POST['inter_img'] ) ) : '',
		'link'  => isset( $_POST['inter_link'] ) ? esc_url_raw( wp_unslash( $_POST['inter_link'] ) ) : '',
		'title' => isset( $_POST['inter_title'] ) ? sanitize_text_field( wp_unslash( $_POST['inter_title'] ) ) : '',
		'btn'   => isset( $_POST['inter_btn'] ) ? sanitize_text_field( wp_unslash( $_POST['inter_btn'] ) ) : 'Voir l\'offre',
		'code'  => isset( $_POST['inter_code'] ) ? trim( (string) wp_unslash( $_POST['inter_code'] ) ) : '', // brut : code réseau vidéo, admin de confiance
		'skip'  => isset( $_POST['inter_skip'] ) ? max( 0, min( 15, (int) $_POST['inter_skip'] ) ) : 4,
		'freq'  => isset( $_POST['inter_freq'] ) ? max( 0, min( 20, (int) $_POST['inter_freq'] ) ) : 0,
	) ), false );

	/* code réseau publicitaire (brut, admin de confiance) */
	update_option( AGENTURF_OPT_ADHEAD, isset( $_POST['ad_head'] ) ? trim( (string) wp_unslash( $_POST['ad_head'] ) ) : '', false );

	if ( ! empty( $_POST['reset_default'] ) ) {
		delete_option( AGENTURF_OPT_RACE );
		wp_safe_redirect( $redirect . '&saved=ok' );
		exit;
	}

	/* vidéos */
	update_option( AGENTURF_OPT_VIDEO, isset( $_POST['hero_video'] ) ? esc_url_raw( wp_unslash( $_POST['hero_video'] ) ) : '', false );
	update_option( AGENTURF_OPT_POSTER, isset( $_POST['hero_poster'] ) ? esc_url_raw( wp_unslash( $_POST['hero_poster'] ) ) : '', false );
	update_option( AGENTURF_OPT_CINE, isset( $_POST['cine_intro'] ) ? esc_url_raw( wp_unslash( $_POST['cine_intro'] ) ) : '', false );

	/* course : fichier téléversé prioritaire, sinon textarea */
	$raw = '';
	if ( ! empty( $_FILES['race_file']['tmp_name'] ) && is_uploaded_file( $_FILES['race_file']['tmp_name'] ) ) {
		$raw = (string) file_get_contents( $_FILES['race_file']['tmp_name'] );
	} elseif ( isset( $_POST['race_json'] ) ) {
		$raw = trim( (string) wp_unslash( $_POST['race_json'] ) );
	}

	$data = json_decode( $raw, true );
	if ( ! is_array( $data ) || empty( $data['meta'] ) || empty( $data['horses'] ) || empty( $data['scenarios'] ) ) {
		wp_safe_redirect( $redirect . '&saved=err' );
		exit;
	}
	update_option( AGENTURF_OPT_RACE, wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ), false );
	agenturf_archive_race( $data );
	wp_safe_redirect( $redirect . '&saved=ok' );
	exit;
} );


/* ---------------- redirections membres ---------------- */

/* Après connexion (y compris via Google/Nextend) : les non-admins vont DIRECTEMENT
   au simulateur (jamais wp-admin). */
add_filter( 'login_redirect', function ( $redirect_to, $requested, $user ) {
	if ( $user instanceof WP_User && ! user_can( $user, 'manage_options' ) ) {
		return add_query_arg( 'apercu', 'simulateur', home_url( '/' ) );
	}
	return $redirect_to;
}, 10, 3 );

/* Après inscription : direction le simulateur. */
add_filter( 'registration_redirect', function () {
	return add_query_arg( 'apercu', 'simulateur', home_url( '/' ) );
} );

/* Un membre simple qui tape /wp-admin est renvoyé vers l'accueil. */
add_action( 'admin_init', function () {
	if ( is_admin() && ! current_user_can( 'edit_posts' ) && ! wp_doing_ajax() ) {
		wp_safe_redirect( home_url( '/' ) );
		exit;
	}
} );


/* =====================================================
   ARCHIVES SEO — chaque course du jour devient une page
   indexable /quinte/{slug}, listée sur /quinte/
   ===================================================== */

add_action( 'init', function () {
	register_post_type( 'course', array(
		'labels'       => array(
			'name'          => 'Courses (archives)',
			'singular_name' => 'Course',
		),
		'public'       => true,
		'has_archive'  => 'quinte',
		'rewrite'      => array( 'slug' => 'quinte', 'with_front' => false ),
		'menu_icon'    => 'dashicons-flag',
		'supports'     => array( 'title', 'editor', 'excerpt' ),
		'show_in_rest' => true, // sitemap + éditeur
	) );
} );

add_action( 'after_switch_theme', function () {
	flush_rewrite_rules();
} );

/* Pronostic du jour : base / compléments / tocard, dérivés de la valeur du modèle
   (aptitude + poids + corde). Retourne un tableau { base, comp, tocard, html, text }. */
function agenturf_pronostic( $data ) {
	$scored = array();
	foreach ( $data['horses'] as $h ) {
		$w    = isset( $h['w'] ) ? (float) $h['w'] : 56;
		$draw = isset( $h['draw'] ) ? (int) $h['draw'] : 8;
		$wadj = ( 56 - $w ) * 0.9;
		$dadj = ( $draw >= 12 ) ? -1.6 : ( ( $draw <= 4 ) ? 0.7 : 0 );
		$scored[] = array(
			'n'    => (int) $h['n'],
			'name' => $h['name'],
			'odds' => isset( $h['odds'] ) ? (float) $h['odds'] : 99,
			'score' => ( isset( $h['ab'] ) ? (float) $h['ab'] : 75 ) + $wadj + $dadj,
		);
	}
	usort( $scored, function ( $a, $b ) { return $b['score'] <=> $a['score']; } );

	$base = array_slice( $scored, 0, 5 );
	$comp = array_slice( $scored, 5, 2 );

	// tocard = meilleure cote parmi les 8 premiers du modèle (la vraie « valeur »)
	$pool   = array_slice( $scored, 0, 8 );
	$tocard = $pool[0];
	foreach ( $pool as $p ) {
		if ( $p['odds'] > $tocard['odds'] ) { $tocard = $p; }
	}

	$nums = function ( $arr ) { return implode( ' - ', array_map( function ( $x ) { return $x['n']; }, $arr ) ); };
	$base_s = $nums( $base );
	$comp_s = $nums( $comp );

	$html  = '<div class="prono-box"><h2>🎯 Le pronostic du jour</h2>';
	$html .= '<p><strong>Base (5) :</strong> ' . esc_html( $base_s ) . '</p>';
	$html .= '<p><strong>Compléments :</strong> ' . esc_html( $comp_s ) . '</p>';
	$html .= '<p><strong>Le tocard :</strong> ' . (int) $tocard['n'] . ' ' . esc_html( $tocard['name'] ) . ' (cote ' . esc_html( $tocard['odds'] ) . ')</p>';
	$html .= '<p><em>Pronostic issu de la simulation du modèle — outil de divertissement, aucun résultat garanti. 18+.</em></p></div>';

	$text = 'Pronostic : base ' . $base_s . ' · tocard ' . $tocard['n'] . ' ' . $tocard['name'] . ' (' . $tocard['odds'] . ').';

	return array( 'base' => $base_s, 'comp' => $comp_s, 'tocard' => $tocard, 'html' => $html, 'text' => $text );
}

/* Contenu HTML indexable généré depuis le JSON de la course. */
function agenturf_race_html( $data ) {
	$meta  = $data['meta'];
	$prono = agenturf_pronostic( $data );
	$html  = '<p><strong>' . esc_html( wp_strip_all_tags( $meta['eyebrow'] ) ) . '</strong> — '
		. esc_html( $meta['subtitle'] ) . '. ' . count( $data['horses'] ) . ' partants analysés, '
		. count( $data['scenarios'] ) . ' scénarios de course simulés.</p>';

	// le pronostic figure en tête de chaque archive
	$html .= $prono['html'];

	if ( ! empty( $meta['avis'] ) ) {
		$html .= '<h2>L\'avis des professionnels</h2>';
		foreach ( $meta['avis'] as $a ) {
			$html .= '<h3>' . esc_html( $a['src'] ) . '</h3><p>' . wp_kses( $a['txt'], array( 'b' => array() ) ) . '</p>';
		}
	}

	$html .= '<h2>Les partants</h2><ul>';
	foreach ( $data['horses'] as $h ) {
		$line = '<strong>' . (int) $h['n'] . ' — ' . esc_html( $h['name'] ) . '</strong>';
		if ( ! empty( $h['jockey'] ) )  { $line .= ' (' . esc_html( $h['jockey'] ) . ')'; }
		if ( ! empty( $h['trainer'] ) ) { $line .= ', entraînement ' . esc_html( $h['trainer'] ); }
		if ( ! empty( $h['odds'] ) )    { $line .= ', cote ' . esc_html( $h['odds'] ); }
		if ( ! empty( $h['musique'] ) ) { $line .= '. Musique : ' . esc_html( $h['musique'] ); }
		if ( ! empty( $h['note'] ) )    { $line .= '. ' . esc_html( $h['note'] ); }
		$html .= '<li>' . $line . '</li>';
	}
	$html .= '</ul>';

	$html .= '<h2>Les scénarios du modèle</h2><ul>';
	foreach ( $data['scenarios'] as $sc ) {
		$html .= '<li><strong>' . esc_html( $sc['title'] ) . '</strong> (' . esc_html( $sc['prob'] ) . ') — ' . esc_html( $sc['desc'] ) . '</li>';
	}
	$html .= '</ul>';
	return $html;
}

/* Crée/actualise l'archive de la course (appelé à chaque enregistrement admin). */
function agenturf_archive_race( $data ) {
	$meta  = $data['meta'];
	$prono = agenturf_pronostic( $data );
	$title = 'Pronostic Quinté+ du ' . date_i18n( 'j F Y' ) . ' : ' . wp_strip_all_tags( $meta['title'] ) . ' (' . wp_strip_all_tags( $meta['track'] ) . ')';
	$slug  = sanitize_title( gmdate( 'Y-m-d' ) . '-' . $meta['title'] . '-' . $meta['track'] );

	$existing = get_page_by_path( $slug, OBJECT, 'course' );
	$postarr  = array(
		'post_type'    => 'course',
		'post_status'  => 'publish',
		'post_name'    => $slug,
		'post_title'   => $title,
		'post_content' => agenturf_race_html( $data ),
		'post_excerpt' => $prono['text'] . ' Analyse des ' . count( $data['horses'] ) . ' partants et simulation du ' . wp_strip_all_tags( $meta['title'] ) . ' à ' . wp_strip_all_tags( $meta['track'] ) . '.',
	);
	if ( $existing ) {
		$postarr['ID'] = $existing->ID;
	}
	$id = wp_insert_post( $postarr );
	if ( $id && ! is_wp_error( $id ) ) {
		update_post_meta( $id, '_agenturf_race', wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );
	}
}

/* Toute archive de course affiche son pronostic — même les anciennes,
   régénéré à la volée depuis le JSON stocké si absent du contenu. */
add_filter( 'the_content', function ( $content ) {
	if ( ! is_singular( 'course' ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}
	if ( false !== strpos( $content, 'prono-box' ) ) {
		return $content; // pronostic déjà présent
	}
	$raw  = get_post_meta( get_the_ID(), '_agenturf_race', true );
	$data = json_decode( (string) $raw, true );
	if ( ! is_array( $data ) || empty( $data['horses'] ) ) {
		return $content;
	}
	$prono = agenturf_pronostic( $data );
	return $prono['html'] . $content;
} );

/* =====================================================
   SEO : titres, meta description, Open Graph, JSON-LD
   ===================================================== */

add_filter( 'pre_get_document_title', function ( $title ) {
	if ( is_front_page() ) {
		$race = agenturf_race_data();
		return 'Pronostic Quinté+ du jour : ' . wp_strip_all_tags( $race['meta']['title'] ) . ' — analyse, base & simulateur | ' . get_bloginfo( 'name' );
	}
	if ( is_post_type_archive( 'course' ) ) {
		return 'Pronostic Quinté+ : archives des pronostics & simulations, jour par jour | ' . get_bloginfo( 'name' );
	}
	return $title;
} );

add_action( 'wp_head', function () {
	$race = agenturf_race_data();
	$m    = $race['meta'];
	$desc = '';
	$og_title = '';

	if ( is_front_page() ) {
		$desc = 'Pronostic et simulation du Quinté+ du jour : ' . wp_strip_all_tags( $m['title'] ) . ' à ' . wp_strip_all_tags( $m['track'] ) . '. '
			. count( $race['horses'] ) . ' partants analysés, avis des pros, scénarios de course et statistiques sur 100 courses simulées. Gratuit.';
		$og_title = 'Quinté+ du jour : ' . wp_strip_all_tags( $m['title'] ) . ' — simulateur & pronostic';
	} elseif ( is_singular( 'course' ) ) {
		$desc = get_the_excerpt();
		$og_title = get_the_title();
	} elseif ( is_post_type_archive( 'course' ) ) {
		$desc = 'Toutes les archives des Quintés+ analysés et simulés : partants, avis des professionnels, scénarios et résultats du modèle, jour par jour.';
		$og_title = 'Archives des Quintés+ — ' . get_bloginfo( 'name' );
	}

	if ( $desc ) {
		echo '<meta name="description" content="' . esc_attr( $desc ) . '">' . "\n";
		echo '<meta property="og:title" content="' . esc_attr( $og_title ) . '">' . "\n";
		echo '<meta property="og:description" content="' . esc_attr( $desc ) . '">' . "\n";
		echo '<meta property="og:type" content="website">' . "\n";
		echo '<meta property="og:site_name" content="' . esc_attr( get_bloginfo( 'name' ) ) . '">' . "\n";
		echo '<meta property="og:locale" content="fr_FR">' . "\n";
		echo '<meta property="og:image" content="' . esc_url( agenturf_poster_url() ) . '">' . "\n";
		echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
	}

	/* Mots-clés dynamiques : bâtis à partir de la course du jour + termes turf à fort volume. */
	if ( is_front_page() ) {
		$track = strtolower( wp_strip_all_tags( $m['track'] ) );
		$disc  = isset( $m['discipline'] ) ? strtolower( $m['discipline'] ) : '';
		$disc_kw = ( 'trot' === $disc ) ? 'pronostic trot attelé, trot monté' : 'pronostic plat, pronostic galop';
		$kw = array(
			'quinté du jour', 'pronostic quinté', 'quinté+ gratuit', 'pronostic quinté demain',
			'arrivée quinté du jour', 'partants quinté', 'simulateur quinté', 'simulateur course de chevaux',
			'pronostic PMU', 'cote PMU', 'base quinté', 'tocard du jour', 'tiercé quarté quinté',
			'quinté ' . $track, 'pronostic ' . $track, $disc_kw,
			wp_strip_all_tags( $m['title'] ), 'course en direct',
		);
		echo '<meta name="keywords" content="' . esc_attr( implode( ', ', array_filter( $kw ) ) ) . '">' . "\n";
	}

	if ( is_front_page() ) {
		$ld = array(
			array(
				'@context' => 'https://schema.org',
				'@type'    => 'WebSite',
				'name'     => get_bloginfo( 'name' ),
				'url'      => home_url( '/' ),
			),
			array(
				'@context'  => 'https://schema.org',
				'@type'     => 'SportsEvent',
				'name'      => wp_strip_all_tags( $m['title'] ) . ' — Quinté+',
				'sport'     => 'Horse racing',
				'startDate' => gmdate( 'c' ),
				'location'  => array(
					'@type' => 'Place',
					'name'  => 'Hippodrome de ' . ucwords( strtolower( wp_strip_all_tags( $m['track'] ) ) ),
				),
			),
		);
		echo '<script type="application/ld+json">' . wp_json_encode( $ld, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";
	} elseif ( is_singular( 'course' ) ) {
		$ld = array(
			'@context'      => 'https://schema.org',
			'@type'         => 'Article',
			'headline'      => get_the_title(),
			'datePublished' => get_the_date( 'c' ),
			'dateModified'  => get_the_modified_date( 'c' ),
			'author'        => array( '@type' => 'Organization', 'name' => get_bloginfo( 'name' ) ),
		);
		echo '<script type="application/ld+json">' . wp_json_encode( $ld, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) . '</script>' . "\n";
	}
}, 5 );


/* =====================================================
   MISES À JOUR AUTOMATIQUES — le thème se met à jour
   depuis GitHub en un clic (Apparence → Thèmes), plus
   besoin de réinstaller le zip à la main.
   ===================================================== */

define( 'AGENTURF_UPDATE_JSON', 'https://raw.githubusercontent.com/muhmett/agenturf/claude/wordpress-quinte-simulator-2qch31/theme-update.json' );

function agenturf_remote_update_info() {
	$cached = get_site_transient( 'agenturf_update_info' );
	if ( is_array( $cached ) ) {
		return $cached;
	}
	$resp = wp_remote_get( AGENTURF_UPDATE_JSON, array( 'timeout' => 8 ) );
	$info = array();
	if ( ! is_wp_error( $resp ) && 200 === wp_remote_retrieve_response_code( $resp ) ) {
		$body = json_decode( wp_remote_retrieve_body( $resp ), true );
		if ( is_array( $body ) && ! empty( $body['version'] ) && ! empty( $body['zip'] ) ) {
			$info = $body;
		}
	}
	set_site_transient( 'agenturf_update_info', $info, 6 * HOUR_IN_SECONDS );
	return $info;
}

add_filter( 'pre_set_site_transient_update_themes', function ( $transient ) {
	if ( empty( $transient ) || ! is_object( $transient ) ) {
		return $transient;
	}
	$info = agenturf_remote_update_info();
	if ( empty( $info['version'] ) ) {
		return $transient;
	}
	$slug    = get_template();
	$current = wp_get_theme( $slug )->get( 'Version' );
	if ( version_compare( $info['version'], (string) $current, '>' ) ) {
		$transient->response[ $slug ] = array(
			'theme'       => $slug,
			'new_version' => $info['version'],
			'url'         => isset( $info['details'] ) ? $info['details'] : 'https://github.com/muhmett/agenturf',
			'package'     => $info['zip'],
		);
	}
	return $transient;
} );

/* Bouton « Vérifier les mises à jour » dans la page Quinté du jour. */
add_action( 'admin_post_agenturf_check_update', function () {
	if ( ! current_user_can( 'update_themes' ) ) {
		wp_die( 'Accès refusé.' );
	}
	check_admin_referer( 'agenturf_check_update' );
	delete_site_transient( 'agenturf_update_info' );
	delete_site_transient( 'update_themes' );
	wp_update_themes();
	wp_safe_redirect( admin_url( 'themes.php' ) );
	exit;
} );


/* =====================================================
   PWA — « Ajouter à l'écran d'accueil » (Android/iPhone)
   Manifest servi dynamiquement pour avoir des URL absolues.
   ===================================================== */
add_action( 'template_redirect', function () {
	if ( ! isset( $_GET['agenturf_manifest'] ) ) {
		return;
	}
	$img = get_template_directory_uri() . '/assets/pwa/';
	$manifest = array(
		'name'             => get_bloginfo( 'name' ) . ' — Simulateur Quinté+',
		'short_name'       => 'AgenTurf',
		'description'      => 'Le Quinté+ du jour simulé avant d\'être couru : pronostics, analyse des partants et course en direct.',
		'start_url'        => home_url( '/?utm_source=pwa' ),
		'scope'            => home_url( '/' ),
		'display'          => 'standalone',
		'orientation'      => 'portrait',
		'background_color' => '#0c3b26',
		'theme_color'      => '#0c3b26',
		'icons'            => array(
			array( 'src' => $img . 'icon-192.png', 'sizes' => '192x192', 'type' => 'image/png', 'purpose' => 'any maskable' ),
			array( 'src' => $img . 'icon-512.png', 'sizes' => '512x512', 'type' => 'image/png', 'purpose' => 'any maskable' ),
		),
	);
	header( 'Content-Type: application/manifest+json; charset=utf-8' );
	echo wp_json_encode( $manifest, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	exit;
} );

/* Code publicitaire des réseaux (Adsterra, Monetag, AdSense…) — sortie brute en tête.
   Réservé à l'admin ; c'est leur script qui gère les interstitiels/pop au clic. */
add_action( 'wp_head', function () {
	$code = get_option( AGENTURF_OPT_ADHEAD, '' );
	if ( $code ) {
		echo "\n<!-- AgenTurf ad -->\n" . $code . "\n<!-- /AgenTurf ad -->\n"; // phpcs:ignore WordPress.Security.EscapeOutput
	}
}, 20 );

/* ---------------- porte email : capture des adresses ---------------- */
add_action( 'wp_ajax_agenturf_lead', 'agenturf_capture_lead' );
add_action( 'wp_ajax_nopriv_agenturf_lead', 'agenturf_capture_lead' );
function agenturf_capture_lead() {
	check_ajax_referer( 'agenturf_lead' );
	$email = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	if ( ! $email || ! is_email( $email ) ) {
		wp_send_json_error( 'invalid' );
	}
	$leads = get_option( AGENTURF_OPT_LEADS, array() );
	if ( ! is_array( $leads ) ) {
		$leads = array();
	}
	foreach ( $leads as $l ) {
		if ( isset( $l['e'] ) && strtolower( $l['e'] ) === strtolower( $email ) ) {
			wp_send_json_success( 'exists' ); // déjà inscrit
		}
	}
	$leads[] = array( 'e' => $email, 't' => time() );
	if ( count( $leads ) > 20000 ) {
		$leads = array_slice( $leads, -20000 );
	}
	update_option( AGENTURF_OPT_LEADS, $leads, false );
	wp_send_json_success( 'ok' );
}

/* Export CSV des emails collectés (admin). */
add_action( 'admin_post_agenturf_leads_csv', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Accès refusé.' );
	}
	check_admin_referer( 'agenturf_leads_csv' );
	$leads = get_option( AGENTURF_OPT_LEADS, array() );
	if ( ! is_array( $leads ) ) {
		$leads = array();
	}
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename=agenturf-emails.csv' );
	$out = fopen( 'php://output', 'w' );
	fputcsv( $out, array( 'email', 'date' ) );
	foreach ( $leads as $l ) {
		fputcsv( $out, array(
			isset( $l['e'] ) ? $l['e'] : '',
			isset( $l['t'] ) ? gmdate( 'Y-m-d H:i', (int) $l['t'] ) : '',
		) );
	}
	fclose( $out );
	exit;
} );

add_action( 'wp_head', function () {
	$img = get_template_directory_uri() . '/assets/pwa/';
	echo '<link rel="manifest" href="' . esc_url( home_url( '/?agenturf_manifest=1' ) ) . '">' . "\n";
	echo '<meta name="theme-color" content="#0c3b26">' . "\n";
	echo '<meta name="mobile-web-app-capable" content="yes">' . "\n";
	echo '<meta name="apple-mobile-web-app-capable" content="yes">' . "\n";
	echo '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">' . "\n";
	echo '<meta name="apple-mobile-web-app-title" content="AgenTurf">' . "\n";
	echo '<link rel="apple-touch-icon" href="' . esc_url( $img . 'icon-192.png' ) . '">' . "\n";
}, 6 );
