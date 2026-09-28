<?php

if (!defined('ABSPATH')) {
    exit;
}

class ECK_Admin
{
    private ECK_Api_Client $api;

    public function __construct()
    {
        $this->api = new ECK_Api_Client();

        add_action('admin_menu', [$this, 'register_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_post_eck_create_tenant', [$this, 'handle_create_tenant']);
        add_action('admin_post_eck_start_run', [$this, 'handle_start_run']);
    }

    public function register_menu(): void
    {
        add_menu_page(
            __('ECK Fingerprint', 'eck-fingerprint'),
            __('ECK', 'eck-fingerprint'),
            'manage_options',
            'eck-fingerprint',
            [$this, 'render_dashboard'],
            'dashicons-networking',
            58
        );

        add_submenu_page(
            'eck-fingerprint',
            __('Indstillinger', 'eck-fingerprint'),
            __('Indstillinger', 'eck-fingerprint'),
            'manage_options',
            'eck-fingerprint-settings',
            [$this, 'render_settings']
        );

        add_submenu_page(
            null,
            __('Tenant', 'eck-fingerprint'),
            __('Tenant', 'eck-fingerprint'),
            'manage_options',
            'eck-fingerprint-tenant',
            [$this, 'render_tenant']
        );
    }

    public function register_settings(): void
    {
        register_setting('eck_fingerprint_settings', 'eck_api_base_url', [
            'type' => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'default' => 'https://api.eck.eira-systems.eu',
        ]);
        register_setting('eck_fingerprint_settings', 'eck_admin_api_key', [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => '',
        ]);
    }

    public function render_settings(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('ECK — Indstillinger', 'eck-fingerprint'); ?></h1>
            <form method="post" action="options.php">
                <?php settings_fields('eck_fingerprint_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th><label for="eck_api_base_url"><?php esc_html_e('ECK API base URL', 'eck-fingerprint'); ?></label></th>
                        <td>
                            <input type="url" id="eck_api_base_url" name="eck_api_base_url"
                                   value="<?php echo esc_attr((string) get_option('eck_api_base_url')); ?>"
                                   class="regular-text" placeholder="https://api.eck.eira-systems.eu" />
                        </td>
                    </tr>
                    <tr>
                        <th><label for="eck_admin_api_key"><?php esc_html_e('Admin API key', 'eck-fingerprint'); ?></label></th>
                        <td>
                            <input type="password" id="eck_admin_api_key" name="eck_admin_api_key"
                                   value="<?php echo esc_attr((string) get_option('eck_admin_api_key')); ?>"
                                   class="regular-text" autocomplete="off" />
                            <p class="description"><?php esc_html_e('Samme som ADMIN_API_KEY i ECK API. Gemmes kun server-side.', 'eck-fingerprint'); ?></p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    public function render_dashboard(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        $tenants = $this->api->is_configured() ? $this->api->list_tenants() : null;
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('ECK Fingerprint', 'eck-fingerprint'); ?></h1>

            <?php if (!$this->api->is_configured()) : ?>
                <div class="notice notice-warning"><p>
                    <?php esc_html_e('Konfigurér API under ECK → Indstillinger.', 'eck-fingerprint'); ?>
                </p></div>
            <?php elseif (is_wp_error($tenants)) : ?>
                <div class="notice notice-error"><p><?php echo esc_html($tenants->get_error_message()); ?></p></div>
            <?php else : ?>
                <h2><?php esc_html_e('Tenants', 'eck-fingerprint'); ?></h2>
                <table class="widefat striped">
                    <thead>
                        <tr>
                            <th><?php esc_html_e('Navn', 'eck-fingerprint'); ?></th>
                            <th><?php esc_html_e('Slug', 'eck-fingerprint'); ?></th>
                            <th><?php esc_html_e('Proxy URL', 'eck-fingerprint'); ?></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php if (empty($tenants)) : ?>
                        <tr><td colspan="4"><?php esc_html_e('Ingen tenants endnu.', 'eck-fingerprint'); ?></td></tr>
                    <?php else : ?>
                        <?php foreach ($tenants as $t) : ?>
                            <tr>
                                <td><?php echo esc_html((string) ($t['name'] ?? '')); ?></td>
                                <td><code><?php echo esc_html((string) ($t['slug'] ?? '')); ?></code></td>
                                <td><code><?php echo esc_html((string) ($t['proxyUrl'] ?? '')); ?></code></td>
                                <td>
                                    <a href="<?php echo esc_url(admin_url('admin.php?page=eck-fingerprint-tenant&id=' . rawurlencode((string) ($t['id'] ?? '')))); ?>">
                                        <?php esc_html_e('Åbn', 'eck-fingerprint'); ?>
                                    </a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                    </tbody>
                </table>

                <h2><?php esc_html_e('Ny tenant', 'eck-fingerprint'); ?></h2>
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                    <?php wp_nonce_field('eck_create_tenant'); ?>
                    <input type="hidden" name="action" value="eck_create_tenant" />
                    <table class="form-table">
                        <tr>
                            <th><label for="slug">Slug</label></th>
                            <td><input name="slug" id="slug" required pattern="[a-z0-9-]+" class="regular-text" /></td>
                        </tr>
                        <tr>
                            <th><label for="name">Navn</label></th>
                            <td><input name="name" id="name" required class="regular-text" /></td>
                        </tr>
                        <tr>
                            <th><label for="legacy_base_url">Legacy API URL</label></th>
                            <td><input name="legacy_base_url" id="legacy_base_url" type="url" required class="large-text" placeholder="https://graph.microsoft.com/v1.0" /></td>
                        </tr>
                    </table>
                    <?php submit_button(__('Opret tenant', 'eck-fingerprint')); ?>
                </form>
            <?php endif; ?>
        </div>
        <?php
    }

    public function render_tenant(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        $id = isset($_GET['id']) ? sanitize_text_field(wp_unslash($_GET['id'])) : '';
        if ($id === '') {
            echo '<div class="wrap"><p>Missing tenant id</p></div>';
            return;
        }

        $tenant = $this->api->get_tenant($id);
        $runs = $this->api->list_runs($id);

        if (is_wp_error($tenant)) {
            echo '<div class="wrap"><div class="notice notice-error"><p>' . esc_html($tenant->get_error_message()) . '</p></div></div>';
            return;
        }

        $runs_list = is_wp_error($runs) ? [] : $runs;
        ?>
        <div class="wrap">
            <h1><?php echo esc_html((string) ($tenant['name'] ?? 'Tenant')); ?></h1>
            <p><code><?php echo esc_html((string) ($tenant['proxyUrl'] ?? '')); ?></code></p>

            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin:1em 0">
                <?php wp_nonce_field('eck_start_run'); ?>
                <input type="hidden" name="action" value="eck_start_run" />
                <input type="hidden" name="tenant_id" value="<?php echo esc_attr($id); ?>" />
                <?php submit_button(__('Start fingerprint (14 dage)', 'eck-fingerprint'), 'primary', 'submit', false); ?>
            </form>

            <h2><?php esc_html_e('Runs', 'eck-fingerprint'); ?></h2>
            <table class="widefat striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th><?php esc_html_e('Status', 'eck-fingerprint'); ?></th>
                        <th><?php esc_html_e('Slut', 'eck-fingerprint'); ?></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ($runs_list as $run) : ?>
                    <tr>
                        <td><code><?php echo esc_html(substr((string) ($run['id'] ?? ''), 0, 8)); ?>…</code></td>
                        <td><?php echo esc_html((string) ($run['status'] ?? '')); ?></td>
                        <td><?php echo esc_html((string) ($run['endsAt'] ?? '')); ?></td>
                        <td>
                            <?php if (($run['status'] ?? '') === 'complete') : ?>
                                <a href="<?php echo esc_url(admin_url('admin.php?page=eck-fingerprint-report&run_id=' . rawurlencode((string) ($run['id'] ?? '')))); ?>"><?php esc_html_e('Rapport', 'eck-fingerprint'); ?></a>
                            <?php else : ?>
                                <?php
                                $setup = $this->api->get_setup((string) ($run['id'] ?? ''));
                                if (!is_wp_error($setup) && !empty($setup['proxyUrl'])) :
                                    ?>
                                    <code><?php echo esc_html((string) $setup['proxyUrl']); ?></code>
                                <?php endif; ?>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
    }

    public function handle_create_tenant(): void
    {
        if (!current_user_can('manage_options') || !check_admin_referer('eck_create_tenant')) {
            wp_die('Forbidden');
        }

        $result = $this->api->create_tenant([
            'slug' => sanitize_title((string) ($_POST['slug'] ?? '')),
            'name' => sanitize_text_field((string) ($_POST['name'] ?? '')),
            'legacyBaseUrl' => esc_url_raw((string) ($_POST['legacy_base_url'] ?? '')),
        ]);

        if (is_wp_error($result)) {
            wp_die(esc_html($result->get_error_message()));
        }

        $id = (string) ($result['id'] ?? '');
        wp_safe_redirect(admin_url('admin.php?page=eck-fingerprint-tenant&id=' . rawurlencode($id)));
        exit;
    }

    public function handle_start_run(): void
    {
        if (!current_user_can('manage_options') || !check_admin_referer('eck_start_run')) {
            wp_die('Forbidden');
        }

        $tenant_id = sanitize_text_field((string) ($_POST['tenant_id'] ?? ''));
        $result = $this->api->start_run($tenant_id);

        if (is_wp_error($result)) {
            wp_die(esc_html($result->get_error_message()));
        }

        wp_safe_redirect(admin_url('admin.php?page=eck-fingerprint-tenant&id=' . rawurlencode($tenant_id)));
        exit;
    }
}

// Rapport-side (skjult submenu via direkte URL — kan udbygges)
add_action('admin_menu', function (): void {
    add_submenu_page(
        null,
        __('Rapport', 'eck-fingerprint'),
        __('Rapport', 'eck-fingerprint'),
        'manage_options',
        'eck-fingerprint-report',
        function (): void {
            if (!current_user_can('manage_options')) {
                return;
            }
            $run_id = isset($_GET['run_id']) ? sanitize_text_field(wp_unslash($_GET['run_id'])) : '';
            $api = new ECK_Api_Client();
            $report = $api->get_report($run_id);
            echo '<div class="wrap"><h1>' . esc_html__('Compatibility Score', 'eck-fingerprint') . '</h1>';
            if (is_wp_error($report)) {
                echo '<div class="notice notice-error"><p>' . esc_html($report->get_error_message()) . '</p></div>';
            } else {
                $r = $report['report'] ?? $report;
                $score = is_array($r) ? ($r['score']['totalPercent'] ?? '?') : '?';
                echo '<p><strong>' . esc_html((string) $score) . '%</strong></p>';
                if (is_array($r) && isset($r['disclaimers']['primary'])) {
                    echo '<p class="description">' . esc_html((string) $r['disclaimers']['primary']) . '</p>';
                }
                echo '<pre style="background:#f6f7f7;padding:1em;overflow:auto">' . esc_html(wp_json_encode($report, JSON_PRETTY_PRINT)) . '</pre>';
            }
            echo '</div>';
        }
    );
}, 20);
