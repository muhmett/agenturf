<?php
/**
 * AgenTurf — fonctions du thème.
 * Landing vidéo + simulateur Quinté+ réservé aux membres.
 */

defined( 'ABSPATH' ) || exit;

define( 'AGENTURF_VERSION', '1.3.0' );
define( 'AGENTURF_OPT_RACE', 'agenturf_race_json' );
define( 'AGENTURF_OPT_VIDEO', 'agenturf_hero_video' );
define( 'AGENTURF_OPT_POSTER', 'agenturf_hero_poster' );
define( 'AGENTURF_OPT_CINE', 'agenturf_cine_intro' );

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

	$apercu       = isset( $_GET['apercu'] ) ? sanitize_key( wp_unslash( $_GET['apercu'] ) ) : '';
	$show_landing = ( ! is_user_logged_in() ) || 'portail' === $apercu;

	if ( $show_landing ) {
		wp_enqueue_script( 'agenturf-landing', get_template_directory_uri() . '/assets/js/landing.js', array(), (string) filemtime( get_template_directory() . '/assets/js/landing.js' ), true );
	} else {
		wp_enqueue_script( 'agenturf-sim', get_template_directory_uri() . '/assets/js/simulator.js', array(), (string) filemtime( get_template_directory() . '/assets/js/simulator.js' ), true );
		wp_add_inline_script(
			'agenturf-sim',
			'window.QUINTE_SIM_CFG = ' . wp_json_encode( array(
				'race'      => agenturf_race_data(),
				'cineIntro' => get_option( AGENTURF_OPT_CINE, '' ),
			) ) . ';',
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
				<tr>
					<th scope="row"><label for="cine_intro">Vidéo d'intro du Direct (mp4, optionnel)</label></th>
					<td>
						<input type="url" class="regular-text" id="cine_intro" name="cine_intro" value="<?php echo esc_attr( get_option( AGENTURF_OPT_CINE, '' ) ); ?>">
						<p class="description">Jouée 4 secondes en plein écran quand un membre lance la course, avant le compte à rebours (ambiance TV). Vide = désactivé.</p>
					</td>
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

/* Après connexion (y compris via Google/Nextend) : les non-admins vont à l'accueil, pas à wp-admin. */
add_filter( 'login_redirect', function ( $redirect_to, $requested, $user ) {
	if ( $user instanceof WP_User && ! user_can( $user, 'manage_options' ) ) {
		return home_url( '/' );
	}
	return $redirect_to;
}, 10, 3 );

/* Après inscription : retour à l'accueil. */
add_filter( 'registration_redirect', function () {
	return home_url( '/' );
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

/* Contenu HTML indexable généré depuis le JSON de la course. */
function agenturf_race_html( $data ) {
	$meta = $data['meta'];
	$html = '<p><strong>' . esc_html( wp_strip_all_tags( $meta['eyebrow'] ) ) . '</strong> — '
		. esc_html( $meta['subtitle'] ) . '. ' . count( $data['horses'] ) . ' partants analysés, '
		. count( $data['scenarios'] ) . ' scénarios de course simulés.</p>';

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
	$title = 'Quinté+ du ' . date_i18n( 'j F Y' ) . ' : ' . wp_strip_all_tags( $meta['title'] ) . ' (' . wp_strip_all_tags( $meta['track'] ) . ')';
	$slug  = sanitize_title( gmdate( 'Y-m-d' ) . '-' . $meta['title'] . '-' . $meta['track'] );

	$existing = get_page_by_path( $slug, OBJECT, 'course' );
	$postarr  = array(
		'post_type'    => 'course',
		'post_status'  => 'publish',
		'post_name'    => $slug,
		'post_title'   => $title,
		'post_content' => agenturf_race_html( $data ),
		'post_excerpt' => 'Pronostic, analyse des partants et simulation du ' . wp_strip_all_tags( $meta['title'] ) . ' à ' . wp_strip_all_tags( $meta['track'] ) . '.',
	);
	if ( $existing ) {
		$postarr['ID'] = $existing->ID;
	}
	$id = wp_insert_post( $postarr );
	if ( $id && ! is_wp_error( $id ) ) {
		update_post_meta( $id, '_agenturf_race', wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );
	}
}

/* =====================================================
   SEO : titres, meta description, Open Graph, JSON-LD
   ===================================================== */

add_filter( 'pre_get_document_title', function ( $title ) {
	if ( is_front_page() ) {
		$race = agenturf_race_data();
		return 'Quinté+ du jour : ' . wp_strip_all_tags( $race['meta']['title'] ) . ' — pronostic, analyse & simulateur | ' . get_bloginfo( 'name' );
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
		echo '<meta property="og:image" content="' . esc_url( agenturf_poster_url() ) . '">' . "\n";
		echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
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
