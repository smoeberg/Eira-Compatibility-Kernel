<?php

if (!defined('ABSPATH')) {
    exit;
}

class ECK_Public
{
    public function __construct()
    {
        add_shortcode('eck_fingerprint_cta', [$this, 'render_cta']);
        add_action('init', [$this, 'register_block']);
    }

    public function register_block(): void
    {
        if (!function_exists('register_block_type')) {
            return;
        }

        register_block_type('eck/fingerprint-cta', [
            'render_callback' => [$this, 'render_cta'],
        ]);
    }

    /**
     * @param array<string, string>|string $atts
     */
    public function render_cta($atts = []): string
    {
        $atts = shortcode_atts([
            'title' => __('Compatibility Score — 14 dages analyse', 'eck-fingerprint'),
            'text' => __('Få overblik over hvor kompatibel jeres fagsystem er med åbne standarder — uden migrering.', 'eck-fingerprint'),
            'button' => __('Kontakt os', 'eck-fingerprint'),
            'url' => '/kontakt/',
            'price' => '25.000 kr.',
        ], is_array($atts) ? $atts : [], 'eck_fingerprint_cta');

        ob_start();
        ?>
        <div class="eck-fingerprint-cta" style="border:1px solid #c3c4c7;padding:1.5em;border-radius:4px;max-width:36em">
            <h3 style="margin-top:0"><?php echo esc_html($atts['title']); ?></h3>
            <p><?php echo esc_html($atts['text']); ?></p>
            <p><strong><?php echo esc_html($atts['price']); ?></strong> · <?php esc_html_e('modregnes ved videre køb', 'eck-fingerprint'); ?></p>
            <a class="button button-primary" href="<?php echo esc_url($atts['url']); ?>"><?php echo esc_html($atts['button']); ?></a>
        </div>
        <?php
        return (string) ob_get_clean();
    }
}
