<?php
/**
 * Plugin Name:       Quinté+ Simulator Pro
 * Description:       Simulateur de Quinté+ animé avec accès freemium : 1 simulation gratuite pour les visiteurs, puis inscription (Google via Nextend Social Login) pour tout débloquer. Shortcode : [quinte_simulator]. La course du jour se met à jour dans Réglages → Quinté Simulator.
 * Version:           1.0.0
 * Author:            AgenTurf
 * License:           GPL-2.0-or-later
 * Text Domain:       quinte-simulator
 */

defined( 'ABSPATH' ) || exit;

final class Quinte_Simulator_Plugin {

	const VERSION = '1.0.0';
	const OPTION  = 'quinte_sim_race_json';

	private static $instance = null;

	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_shortcode( 'quinte_simulator', array( $this, 'render_shortcode' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'register_assets' ) );
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_action( 'admin_post_quinte_sim_save', array( $this, 'save_settings' ) );
	}

	/* ---------------- assets ---------------- */

	public function register_assets() {
		wp_register_style(
			'quinte-sim-fonts',
			'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700;900&family=Barlow:wght@400;500;600&display=swap',
			array(),
			null
		);
		wp_register_style(
			'quinte-sim',
			plugins_url( 'assets/css/quinte.css', __FILE__ ),
			array( 'quinte-sim-fonts' ),
			self::VERSION
		);
		wp_register_script(
			'quinte-sim',
			plugins_url( 'assets/js/quinte.js', __FILE__ ),
			array(),
			self::VERSION,
			true
		);
	}

	/* ---------------- données course ---------------- */

	public function race_data() {
		$raw = get_option( self::OPTION, '' );
		if ( ! is_string( $raw ) || '' === trim( $raw ) ) {
			$raw = (string) file_get_contents( __DIR__ . '/data/default-race.json' );
		}
		$data = json_decode( $raw, true );
		if ( ! is_array( $data ) || empty( $data['horses'] ) || empty( $data['scenarios'] ) ) {
			$data = json_decode( (string) file_get_contents( __DIR__ . '/data/default-race.json' ), true );
		}
		return $data;
	}

	/* ---------------- shortcode ---------------- */

	public function render_shortcode() {
		wp_enqueue_style( 'quinte-sim' );
		wp_enqueue_script( 'quinte-sim' );

		$cfg = array(
			'loggedIn' => is_user_logged_in(),
			'loginUrl' => wp_login_url( get_permalink() ? get_permalink() : home_url( '/' ) ),
			'race'     => $this->race_data(),
		);
		wp_add_inline_script(
			'quinte-sim',
			'window.QUINTE_SIM_CFG = ' . wp_json_encode( $cfg ) . ';',
			'before'
		);

		ob_start();
		?>
<div class="qs-wrap" id="qsApp">

	<header class="qs-header">
		<div class="qs-eyebrow" id="qsEyebrow"></div>
		<h1 class="qs-h1" id="qsTitle"></h1>
		<div class="qs-meta" id="qsMeta"></div>
		<div class="qs-depart"><span class="dot"></span> SIMULATION DISPONIBLE</div>
	</header>

	<section class="qs-section qs-reveal">
		<h2 class="qs-h2"><span class="qs-tick"></span>Choisis ton scénario <small>chaque scénario recalibre la simulation</small></h2>
		<div class="qs-scenarios" id="qsScenarios"></div>
	</section>

	<section class="qs-section qs-reveal">
		<h2 class="qs-h2"><span class="qs-tick"></span>La course en direct</h2>
		<div class="qs-trackbox">
			<canvas id="qsCanvas" width="1060" height="600"></canvas>
			<div class="qs-hud">
				<div class="qs-badge" id="qsHudDist"></div>
				<div class="qs-badge"><span class="qs-live"></span><span id="qsBadgeTrack"></span></div>
			</div>
			<div class="qs-count" id="qsCount"></div>
			<div class="qs-flash" id="qsFlash"></div>
		</div>
		<div class="qs-controls">
			<button type="button" class="qs-btn qs-btn-go" id="qsStart">🏇 Lancer la course</button>
			<button type="button" class="qs-btn qs-btn-re" id="qsReset">↺ Nouvelle simulation</button>
			<div class="qs-speed">Vitesse
				<select id="qsSpeedSel">
					<option value="1">Réelle ×1</option>
					<option value="2" selected>Rapide ×2</option>
					<option value="4">Turbo ×4</option>
				</select>
			</div>
		</div>

		<div class="qs-live-grid">
			<div class="qs-panel">
				<h3>Classement en direct</h3>
				<div class="qs-standings" id="qsStandings"></div>
			</div>
			<div class="qs-panel">
				<h3>Commentaires — micro de l'hippodrome</h3>
				<div class="qs-feed" id="qsFeed"></div>
			</div>
		</div>

		<div class="qs-resultbox" id="qsResultbox">
			<div class="qs-arrivee">
				<h3>Arrivée officielle — combinaison Quinté+</h3>
				<div class="qs-combo" id="qsCombo"></div>
				<ol id="qsResList"></ol>
				<p class="qs-note">Simulation basée sur les valeurs handicap, poids, musiques, cordes et avis entraîneurs du jour. Chaque lancement produit une arrivée différente — comme la vraie course, rien n'est garanti.</p>
			</div>
		</div>
	</section>

	<div class="qs-ad"><?php echo wp_kses_post( apply_filters( 'quinte_sim_ad_top', '' ) ); ?></div>

	<section class="qs-section qs-reveal">
		<h2 class="qs-h2"><span class="qs-tick"></span>Les partants décryptés <small>valeur · poids · style de course · avis</small></h2>
		<div class="qs-grid" id="qsCards"></div>
	</section>

	<div class="qs-ad"><?php echo wp_kses_post( apply_filters( 'quinte_sim_ad_bottom', '' ) ); ?></div>

	<p class="qs-disclaimer">Outil d'analyse et de divertissement. Les probabilités affichées sont des estimations issues du modèle, pas des cotes officielles. Jouer comporte des risques : ne mise que ce que tu peux te permettre de perdre.</p>

	<div class="qs-gate" id="qsGate" hidden>
		<div class="qs-gate-card">
			<div class="qs-gate-ico">🏇</div>
			<h3>Ta simulation gratuite est utilisée</h3>
			<p>Crée un compte gratuit en 5 secondes pour continuer :</p>
			<ul>
				<li>Simulations illimitées, à chaque lancement une arrivée différente</li>
				<li>Les 6 scénarios du modèle débloqués</li>
				<li>Le Quinté+ du jour analysé, chaque jour</li>
			</ul>
			<a class="qs-google-btn" id="qsGoogleBtn" href="#" rel="nofollow">
				<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
				Continuer avec Google
			</a>
			<button type="button" class="qs-gate-later" id="qsGateLater">Plus tard — je regarde encore l'analyse</button>
			<p class="qs-gate-note">Gratuit. Aucune carte bancaire. Juste ton compte Google.</p>
		</div>
	</div>

</div>
		<?php
		return ob_get_clean();
	}

	/* ---------------- admin : course du jour ---------------- */

	public function admin_menu() {
		add_options_page(
			'Quinté Simulator',
			'Quinté Simulator',
			'manage_options',
			'quinte-simulator',
			array( $this, 'settings_page' )
		);
	}

	public function settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$raw = get_option( self::OPTION, '' );
		if ( '' === trim( (string) $raw ) ) {
			$raw = (string) file_get_contents( __DIR__ . '/data/default-race.json' );
		}
		$saved = isset( $_GET['saved'] ) ? sanitize_text_field( wp_unslash( $_GET['saved'] ) ) : '';
		?>
		<div class="wrap">
			<h1>Quinté Simulator — course du jour</h1>
			<?php if ( 'ok' === $saved ) : ?>
				<div class="notice notice-success"><p>Course enregistrée ! Elle est en ligne immédiatement.</p></div>
			<?php elseif ( 'err' === $saved ) : ?>
				<div class="notice notice-error"><p>JSON invalide — rien n'a été enregistré. Vérifie les virgules et guillemets (utilise jsonlint.com pour valider).</p></div>
			<?php endif; ?>
			<p>Colle ici le JSON de la course du jour (mêmes champs que la course fournie par défaut : <code>meta</code>, <code>horses</code>, <code>scenarios</code>). Enregistre, et la page publique est à jour instantanément.</p>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="quinte_sim_save">
				<?php wp_nonce_field( 'quinte_sim_save' ); ?>
				<textarea name="race_json" rows="28" style="width:100%;font-family:monospace;font-size:12px;"><?php echo esc_textarea( $raw ); ?></textarea>
				<p>
					<?php submit_button( 'Enregistrer la course', 'primary', 'submit', false ); ?>
					&nbsp;
					<button type="submit" name="reset_default" value="1" class="button">Revenir à la course d'exemple</button>
				</p>
			</form>
			<p><em>Astuce : garde un fichier modèle et change seulement les chevaux, cotes et scénarios chaque matin.</em></p>
		</div>
		<?php
	}

	public function save_settings() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Accès refusé.' );
		}
		check_admin_referer( 'quinte_sim_save' );

		$redirect = admin_url( 'options-general.php?page=quinte-simulator' );

		if ( ! empty( $_POST['reset_default'] ) ) {
			delete_option( self::OPTION );
			wp_safe_redirect( $redirect . '&saved=ok' );
			exit;
		}

		$raw  = isset( $_POST['race_json'] ) ? trim( (string) wp_unslash( $_POST['race_json'] ) ) : '';
		$data = json_decode( $raw, true );
		if ( ! is_array( $data ) || empty( $data['meta'] ) || empty( $data['horses'] ) || empty( $data['scenarios'] ) ) {
			wp_safe_redirect( $redirect . '&saved=err' );
			exit;
		}
		update_option( self::OPTION, wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ), false );
		wp_safe_redirect( $redirect . '&saved=ok' );
		exit;
	}
}

Quinte_Simulator_Plugin::instance();
