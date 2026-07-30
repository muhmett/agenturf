<?php
/**
 * Page vidéos — bannière + grille de Shorts YouTube.
 *
 * Les vignettes sont servies par i.ytimg.com et l'iframe n'est créée qu'au
 * clic : la page reste légère sur mobile même avec vingt vidéos.
 */

defined( 'ABSPATH' ) || exit;

$yt  = agenturf_yt_cfg();
$ids = $yt['ids'];
?>
<main class="ytpage">

	<header class="yt-hero"<?php echo $yt['banner'] ? ' style="background-image:linear-gradient(180deg,rgba(11,26,20,.55),rgba(11,26,20,.92)),url(' . esc_url( $yt['banner'] ) . ')"' : ''; ?>>
		<div class="yt-hero-in">
			<span class="yt-kicker">▶ Chaîne AgenTurf</span>
			<h1><?php echo esc_html( $yt['title'] ); ?></h1>
			<p><?php echo esc_html( $yt['sub'] ); ?></p>
			<div class="yt-cta">
				<?php if ( $yt['channel'] ) : ?>
					<a class="yt-btn yt-btn-red" href="<?php echo esc_url( $yt['channel'] ); ?>" target="_blank" rel="noopener">S’abonner sur YouTube</a>
				<?php endif; ?>
				<a class="yt-btn yt-btn-ghost" href="<?php echo esc_url( home_url( '/' ) ); ?>">🏇 Lancer une simulation</a>
			</div>
		</div>
	</header>

	<?php if ( empty( $ids ) ) : ?>

		<section class="yt-empty">
			<p>Aucune vidéo pour l’instant.</p>
			<?php if ( current_user_can( 'manage_options' ) ) : ?>
				<p class="yt-hint">Ajoute tes liens dans <strong>Quinté du jour → Page vidéos (/youtube/)</strong>, un lien par ligne.</p>
			<?php endif; ?>
		</section>

	<?php else : ?>

		<section class="yt-grid-wrap">
			<h2 class="yt-h2">Les derniers Shorts</h2>
			<div class="yt-grid">
				<?php foreach ( $ids as $i => $id ) : ?>
					<article class="yt-card" data-yt="<?php echo esc_attr( $id ); ?>">
						<button class="yt-thumb" type="button" aria-label="Lire la vidéo <?php echo (int) ( $i + 1 ); ?>">
							<img
								src="https://i.ytimg.com/vi/<?php echo esc_attr( $id ); ?>/hqdefault.jpg"
								alt=""
								loading="<?php echo $i < 2 ? 'eager' : 'lazy'; ?>"
								decoding="async"
								width="480" height="360">
							<span class="yt-play" aria-hidden="true"></span>
						</button>
					</article>
				<?php endforeach; ?>
			</div>
			<p class="yt-note">Les vidéos se chargent au clic — la page reste légère en 4G.</p>
		</section>

	<?php endif; ?>
</main>

<script>
/* Procédé « façade » : on ne crée l'iframe qu'au clic. */
document.querySelectorAll(".yt-card").forEach(function (card) {
	var btn = card.querySelector(".yt-thumb");
	if (!btn) return;
	btn.addEventListener("click", function () {
		var id = card.getAttribute("data-yt");
		var f = document.createElement("iframe");
		f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1";
		f.title = "Short YouTube AgenTurf";
		f.loading = "lazy";
		f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
		f.referrerPolicy = "strict-origin-when-cross-origin";
		f.allowFullscreen = true;
		card.innerHTML = "";
		card.appendChild(f);
	});
});
</script>
