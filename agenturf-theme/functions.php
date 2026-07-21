<?php
/**
 * AgenTurf — fonctions du thème.
 * Landing vidéo + simulateur Quinté+ réservé aux membres.
 */

defined( 'ABSPATH' ) || exit;

define( 'AGENTURF_VERSION', '1.0.0' );
define( 'AGENTURF_OPT_RACE', 'agenturf_race_json' );
define( 'AGENTURF_OPT_VIDEO', 'agenturf_hero_video' );
define( 'AGENTURF_OPT_POSTER', 'agenturf_hero_poster' );

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
	wp_enqueue_style( 'agenturf', get_stylesheet_uri(), array( 'agenturf-fonts' ), AGENTURF_VERSION );

	$apercu       = isset( $_GET['apercu'] ) ? sanitize_key( wp_unslash( $_GET['apercu'] ) ) : '';
	$show_landing = ( ! is_user_logged_in() ) || 'portail' === $apercu;

	if ( $show_landing ) {
		wp_enqueue_script( 'agenturf-landing', get_template_directory_uri() . '/assets/js/landing.js', array(), AGENTURF_VERSION, true );
	} else {
		wp_enqueue_script( 'agenturf-sim', get_template_directory_uri() . '/assets/js/simulator.js', array(), AGENTURF_VERSION, true );
		wp_add_inline_script(
			'agenturf-sim',
			'window.QUINTE_SIM_CFG = ' . wp_json_encode( array( 'race' => agenturf_race_data() ) ) . ';',
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
			</table>

			<p>
				<?php submit_button( 'Enregistrer', 'primary', 'submit', false ); ?>
				&nbsp;
				<button type="submit" name="reset_default" value="1" class="button">Revenir à la course d'exemple</button>
			</p>
		</form>
		<p><em>Astuce : donne l'ancien JSON + le programme de la nouvelle course à une IA et demande-lui le même format — deux minutes et c'est prêt.</em></p>
	</div>
	<?php
}

add_action( 'admin_post_agenturf_save', function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Accès refusé.' );
	}
	check_admin_referer( 'agenturf_save' );

	$redirect = admin_url( 'admin.php?page=agenturf-race' );

	if ( ! empty( $_POST['reset_default'] ) ) {
		delete_option( AGENTURF_OPT_RACE );
		wp_safe_redirect( $redirect . '&saved=ok' );
		exit;
	}

	/* vidéo hero */
	update_option( AGENTURF_OPT_VIDEO, isset( $_POST['hero_video'] ) ? esc_url_raw( wp_unslash( $_POST['hero_video'] ) ) : '', false );
	update_option( AGENTURF_OPT_POSTER, isset( $_POST['hero_poster'] ) ? esc_url_raw( wp_unslash( $_POST['hero_poster'] ) ) : '', false );

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
	wp_safe_redirect( $redirect . '&saved=ok' );
	exit;
} );
