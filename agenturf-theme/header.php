<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<?php
$agenturf_dom = agenturf_domain_cfg();
$agenturf_wa  = agenturf_domain_wa_url();
if ( $agenturf_dom['on'] && $agenturf_wa ) : ?>
<div class="dbar">
	<span class="dbar-txt">
		<span class="dbar-tag">🌐 <?php echo esc_html( $agenturf_dom['domain'] ); ?></span>
		<span class="dbar-lab"><?php echo esc_html( $agenturf_dom['label'] ); ?></span>
		<span class="dbar-price"><?php echo esc_html( '' !== $agenturf_dom['price'] ? $agenturf_dom['price'] : 'Faire une offre' ); ?></span>
	</span>
	<a class="dbar-wa" href="<?php echo esc_url( $agenturf_wa ); ?>" target="_blank" rel="noopener nofollow">
		<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false"><path fill="currentColor" d="M17.5 14.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.755.9-.925 1.1-.17.2-.34.2-.63.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.45.13-.6.13-.13.3-.34.44-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35M12.05 21.8h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.72.97 1-3.62-.24-.37a9.78 9.78 0 0 1-1.5-5.22c0-5.4 4.4-9.8 9.83-9.8 2.62 0 5.08 1.03 6.93 2.88a9.74 9.74 0 0 1 2.87 6.93c0 5.4-4.4 9.8-9.8 9.8m8.34-18.14A11.7 11.7 0 0 0 12.05 0C5.6 0 .35 5.25.35 11.7c0 2.06.54 4.08 1.56 5.86L.25 24l6.58-1.72a11.66 11.66 0 0 0 5.22 1.24h.01c6.45 0 11.7-5.25 11.7-11.7 0-3.13-1.22-6.07-3.43-8.28"/></svg>
		<span>WhatsApp</span>
	</a>
</div>
<?php endif; ?>
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
