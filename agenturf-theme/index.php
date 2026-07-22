<?php
/**
 * AgenTurf — page unique.
 * Vue déterminée par agenturf_current_view() :
 *   - mode « open »   : le simulateur est visible par tout le monde (lancement rapide)
 *   - mode « members »: portail vidéo pour les invités, simulateur pour les connectés
 *   - ?apercu=portail / ?apercu=simulateur : forcer une vue (aperçu admin)
 */
get_header();

if ( 'simulator' === agenturf_current_view() ) {
	get_template_part( 'template-parts/simulator' );
} else {
	get_template_part( 'template-parts/landing' );
}

get_footer();
