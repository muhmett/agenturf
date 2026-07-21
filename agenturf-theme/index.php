<?php
/**
 * AgenTurf — page unique :
 * visiteur                -> landing vidéo + porte Google
 * membre connecté         -> simulateur Quinté+ complet
 * ?apercu=portail         -> force l'aperçu de la landing (utile pour l'admin,
 *                            qui est toujours connecté et ne la verrait jamais)
 * ?apercu=simulateur      -> force l'aperçu du simulateur
 */
get_header();

$force = isset( $_GET['apercu'] ) ? sanitize_key( wp_unslash( $_GET['apercu'] ) ) : '';

if ( 'portail' === $force ) {
	get_template_part( 'template-parts/landing' );
} elseif ( 'simulateur' === $force && is_user_logged_in() ) {
	get_template_part( 'template-parts/simulator' );
} elseif ( is_user_logged_in() ) {
	get_template_part( 'template-parts/simulator' );
} else {
	get_template_part( 'template-parts/landing' );
}

get_footer();
