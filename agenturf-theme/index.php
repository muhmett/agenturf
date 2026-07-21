<?php
/**
 * AgenTurf — page unique :
 * visiteur  -> landing vidéo + porte Google
 * membre    -> simulateur Quinté+ complet
 */
get_header();

if ( is_user_logged_in() ) {
	get_template_part( 'template-parts/simulator' );
} else {
	get_template_part( 'template-parts/landing' );
}

get_footer();
