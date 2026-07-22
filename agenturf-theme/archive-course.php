<?php
/** Liste des courses archivées : /quinte/ */
get_header();
?>
<div class="wrap arch-wrap">
	<header class="card">
		<div class="eyebrow">AgenTurf · Archives</div>
		<h1 class="racetitle">Tous les Quintés+ analysés</h1>
		<div class="meta"><span>Partants, avis des pros et scénarios simulés — jour par jour.</span></div>
	</header>

	<section class="sim-section">
		<?php if ( have_posts() ) : ?>
			<div class="arch-list">
				<?php while ( have_posts() ) : the_post(); ?>
					<a class="arch-item" href="<?php the_permalink(); ?>">
						<span class="d"><?php echo esc_html( get_the_date( 'j M Y' ) ); ?></span>
						<h2><?php the_title(); ?></h2>
						<p><?php echo esc_html( get_the_excerpt() ); ?></p>
					</a>
				<?php endwhile; ?>
			</div>
			<div class="arch-nav"><?php the_posts_pagination(); ?></div>
		<?php else : ?>
			<p>Les archives arrivent : chaque course enregistrée dans « Quinté du jour » sera automatiquement ajoutée ici.</p>
		<?php endif; ?>
	</section>

	<div class="arch-cta">
		<a class="btn btn-go" href="<?php echo esc_url( home_url( '/' ) ); ?>">🏇 Simuler le Quinté du jour</a>
	</div>
</div>
<?php get_footer(); ?>
