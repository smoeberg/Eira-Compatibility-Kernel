<?php
/**
 * ECK BFF — /auth/* (OIDC) + /api/* → Hetzner NestJS.
 *
 * Deploy: integrations/simply/proxy/ (NOT inside WordPress)
 * Config: ../config/eck-config.php (outside public_html)
 *
 * @see docs/specs/ECK_BFF_Identity_v0.1.md
 */

declare(strict_types=1);

require_once __DIR__ . '/../lib/bootstrap.php';
require_once __DIR__ . '/../lib/OidcAuth.php';
require_once __DIR__ . '/../lib/ApiProxy.php';

$config = eck_load_config();
if ($config === null) {
    eck_json_error(500, 'ECK BFF not configured');
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

if (str_starts_with($path, '/auth/')) {
    (new OidcAuth($config))->handle($path);
}

if (str_starts_with($path, '/api/')) {
    (new ApiProxy($config))->forward();
}

eck_json_error(404, 'Not found');
