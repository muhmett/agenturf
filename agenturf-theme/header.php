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
	<a class="logo" href="<?php echo esc_url( home_url( '/' ) ); ?>">AGEN<em>TURF</em></a>
	<div class="actions">
		<a class="tb-btn" href="<?php echo esc_url( get_post_type_archive_link( 'course' ) ); ?>">Archives</a>
		<?php if ( is_user_logged_in() ) : ?>
			<a class="tb-btn" href="<?php echo esc_url( wp_logout_url( home_url( '/' ) ) ); ?>">Déconnexion</a>
		<?php elseif ( 'members' === agenturf_access_mode() ) : ?>
			<a class="tb-btn solid" href="<?php echo esc_url( agenturf_login_url() ); ?>">Se connecter</a>
		<?php elseif ( 'landing' === agenturf_current_view() ) : ?>
			<a class="tb-btn solid" href="<?php echo esc_url( add_query_arg( 'apercu', 'simulateur', home_url( '/' ) ) ); ?>">🏇 Simulateur</a>
		<?php endif; ?>
	</div>
</nav>
