<?php
/**
 * Copy to proxy/config/eck-config.php — never commit.
 */
return [
    'hetzner_api_url' => 'https://api.eck.eira-systems.eu',

    /** Preferred v1+ — shared with NestJS ECK_SERVICE_TOKEN */
    'service_token' => 'CHANGE_ME',

    /** HMAC signing — prefer separate secret; falls back to service_token if empty */
    'signing_secret' => 'CHANGE_ME_SIGNING',

    /** Legacy fallback — same as Hetzner ADMIN_API_KEY */
    'admin_api_key' => '',

    /** Entra ID / Keycloak OIDC (v2) */
    'oidc' => [
        'enabled' => false,
        'tenant_id' => 'YOUR_ENTRA_TENANT_ID',
        'client_id' => 'YOUR_APP_CLIENT_ID',
        'client_secret' => 'YOUR_APP_CLIENT_SECRET',
        'redirect_uri' => 'https://eck.eira-systems.eu/auth/callback',
        'post_logout_redirect' => 'https://eck.eira-systems.eu/eck/',
        'scopes' => 'openid profile email',
    ],

    'session' => [
        'cookie_name' => 'eck_session',
        'cookie_secure' => true,
    ],
];
