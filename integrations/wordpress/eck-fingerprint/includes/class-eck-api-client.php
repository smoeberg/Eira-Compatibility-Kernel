<?php

if (!defined('ABSPATH')) {
    exit;
}

class ECK_Api_Client
{
    private string $base_url;
    private string $api_key;

    public function __construct()
    {
        $this->base_url = rtrim((string) get_option('eck_api_base_url', ''), '/');
        $this->api_key = (string) get_option('eck_admin_api_key', '');
    }

    public function is_configured(): bool
    {
        return $this->base_url !== '' && $this->api_key !== '';
    }

    /**
     * @return array<string, mixed>|WP_Error
     */
    public function list_tenants(): array|WP_Error
    {
        return $this->request('GET', '/api/v1/tenants');
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>|WP_Error
     */
    public function create_tenant(array $body): array|WP_Error
    {
        return $this->request('POST', '/api/v1/tenants', $body);
    }

    /**
     * @return array<string, mixed>|WP_Error
     */
    public function get_tenant(string $id): array|WP_Error
    {
        return $this->request('GET', '/api/v1/tenants/' . rawurlencode($id));
    }

    /**
     * @return array<string, mixed>|WP_Error
     */
    public function start_run(string $tenant_id): array|WP_Error
    {
        return $this->request('POST', '/api/v1/tenants/' . rawurlencode($tenant_id) . '/runs');
    }

    /**
     * @return array<string, mixed>|WP_Error
     */
    public function list_runs(string $tenant_id): array|WP_Error
    {
        return $this->request('GET', '/api/v1/tenants/' . rawurlencode($tenant_id) . '/runs');
    }

    /**
     * @return array<string, mixed>|WP_Error
     */
    public function get_setup(string $run_id): array|WP_Error
    {
        return $this->request('GET', '/api/v1/runs/' . rawurlencode($run_id) . '/setup');
    }

    /**
     * @return array<string, mixed>|WP_Error
     */
    public function get_report(string $run_id): array|WP_Error
    {
        return $this->request('GET', '/api/v1/runs/' . rawurlencode($run_id) . '/report');
    }

    /**
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>|WP_Error
     */
    private function request(string $method, string $path, ?array $body = null): array|WP_Error
    {
        if (!$this->is_configured()) {
            return new WP_Error('eck_not_configured', __('ECK API URL og Admin API key skal sættes under Indstillinger.', 'eck-fingerprint'));
        }

        $url = $this->base_url . $path;
        $args = [
            'method' => $method,
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Admin-Api-Key' => $this->api_key,
            ],
        ];

        if ($body !== null) {
            $args['body'] = wp_json_encode($body);
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            return $response;
        }

        $code = (int) wp_remote_retrieve_response_code($response);
        $raw = wp_remote_retrieve_body($response);
        $data = json_decode($raw, true);

        if ($code < 200 || $code >= 300) {
            $message = is_array($data) && isset($data['message'])
                ? (string) $data['message']
                : $raw;
            return new WP_Error('eck_api_error', sprintf(__('ECK API fejl (%d): %s', 'eck-fingerprint'), $code, $message));
        }

        return is_array($data) ? $data : [];
    }
}
