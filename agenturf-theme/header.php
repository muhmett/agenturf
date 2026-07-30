<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div class="scrollbar" id="scrollbar"></div>
<nav class="topbar">
	<a class="logo" href="<?php echo esc_url( home_url( '/' ) ); ?>">
		<img class="logo-mark"
			src="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo-64.png' ); ?>"
			srcset="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo-64.png' ); ?> 1x, <?php echo esc_url( get_template_directory_uri() . '/assets/img/logo-180.png' ); ?> 2x"
			width="64" height="64" alt="" decoding="async">
		<span class="logo-txt">AGEN<em>TURF</em></span>
	</a>
	<div class="actions">
		<a class="tb-btn" href="<?php echo esc_url( agenturf_youtube_url() ); ?>">▶ Vidéos</a>
		<a class="tb-btn" href="<?php echo esc_url( get_post_type_archive_link( 'course' ) ); ?>">Archives</a>
		<?php if ( is_user_logged_in() ) : ?>
			<a class="tb-btn" href="<?php echo esc_url( wp_logout_url( home_url( '/' ) ) ); ?>">Déconnexion</a>
		<?php else : ?>
			<div class="gsi-slot tb-gsi" data-width="180"></div>
			<noscript><a class="tb-btn solid" href="<?php echo esc_url( agenturf_login_url() ); ?>">Se connecter</a></noscript>
		<?php endif; ?>
	</div>
</nav>
