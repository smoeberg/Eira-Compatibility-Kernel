<?php
/**
 * Plugin Name:       ECK Fingerprint
 * Plugin URI:        https://eira-systems.eu/eck
 * Description:       Salg og admin for Eira Compatibility Kernel fingerprint — kalder ECK API (NestJS).
 * Version:           0.1.0
 * Requires at least: 6.0
 * Requires PHP:      8.1
 * Author:            Eira Systems
 * License:           GPL-2.0-or-later
 * Text Domain:       eck-fingerprint
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ECK_FP_VERSION', '0.1.0');
define('ECK_FP_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ECK_FP_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once ECK_FP_PLUGIN_DIR . 'includes/class-eck-api-client.php';
require_once ECK_FP_PLUGIN_DIR . 'includes/class-eck-admin.php';
require_once ECK_FP_PLUGIN_DIR . 'includes/class-eck-public.php';

function eck_fingerprint_init(): void
{
    new ECK_Admin();
    new ECK_Public();
}
add_action('plugins_loaded', 'eck_fingerprint_init');

register_activation_hook(__FILE__, function (): void {
    if (get_option('eck_api_base_url') === false) {
        add_option('eck_api_base_url', 'https://api.eck.eira-systems.eu');
    }
});
