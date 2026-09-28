<?php

declare(strict_types=1);

function eck_load_config(): ?array
{
    $paths = [
        __DIR__ . '/../config/eck-config.php',
        dirname(__DIR__, 3) . '/private/eck-config.php',
    ];
    foreach ($paths as $path) {
        if (is_readable($path)) {
            $cfg = require $path;
            return is_array($cfg) ? $cfg : null;
        }
    }
    return null;
}

function eck_json_error(int $code, string $message): void
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['message' => $message]);
    exit;
}

function eck_json(array $payload, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit;
}

function eck_start_session(array $config): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $session = is_array($config['session'] ?? null) ? $config['session'] : [];
    $name = (string) ($session['cookie_name'] ?? 'eck_session');
    $secure = (bool) ($session['cookie_secure'] ?? true);

    session_name($name);
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function eck_base64url(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
