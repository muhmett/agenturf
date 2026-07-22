<?php
/** Archive d'une course : contenu indexable, ouvert à tous (SEO). */
get_header();
?>
<div class="wrap arch-wrap">
	<?php while ( have_posts() ) : the_post(); ?>
	<header class="card">
		<div class="eyebrow">Archive Quinté+ · <?php echo esc_html( get_the_date( 'j F Y' ) ); ?></div>
		<h1 class="racetitle"><?php the_title(); ?></h1>
	</header>

	<article class="arch-content">
		<?php the_content(); ?>
	</article>

	<div class="arch-cta">
		<a class="btn btn-go" href="<?php echo esc_url( home_url( '/' ) ); ?>">🏇 Simuler le Quinté du jour</a>
		<a class="btn btn-re" href="<?php echo esc_url( get_post_type_archive_link( 'course' ) ); ?>">📚 Toutes les archives</a>
	</div>
	<?php endwhile; ?>
</div>
<?php get_footer(); ?>
