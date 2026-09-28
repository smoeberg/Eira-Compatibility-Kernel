<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

final class OidcAuth
{
    public function __construct(private readonly array $config)
    {
    }

    public function isEnabled(): bool
    {
        $oidc = $this->oidcConfig();
        return (bool) ($oidc['enabled'] ?? false)
            && (string) ($oidc['client_id'] ?? '') !== ''
            && (string) ($oidc['client_secret'] ?? '') !== ''
            && (string) ($oidc['tenant_id'] ?? '') !== '';
    }

    public function handle(string $path): void
    {
        eck_start_session($this->config);

        match ($path) {
            '/auth/login' => $this->login(),
            '/auth/callback' => $this->callback(),
            '/auth/logout' => $this->logout(),
            '/auth/me' => $this->me(),
            default => eck_json_error(404, 'Not found'),
        };
    }

    /** @return list<string> */
    public function userHeadersForProxy(): array
    {
        if (!$this->isEnabled()) {
            return [];
        }

        eck_start_session($this->config);
        $user = $_SESSION['eck_user'] ?? null;
        if (!is_array($user) || empty($user['sub'])) {
            eck_json_error(401, 'Authentication required');
        }

        $headers = [
            'X-User-Sub: ' . $user['sub'],
        ];
        if (!empty($user['email'])) {
            $headers[] = 'X-User-Email: ' . $user['email'];
        }
        if (!empty($user['access_token'])) {
            $headers[] = 'X-User-Token: ' . $user['access_token'];
        }
        if (!empty($user['roles']) && is_array($user['roles'])) {
            $headers[] = 'X-User-Roles: ' . implode(',', $user['roles']);
        }

        return $headers;
    }

    private function login(): void
    {
        if (!$this->isEnabled()) {
            eck_json_error(503, 'OIDC not configured');
        }

        $returnTo = (string) ($_GET['return'] ?? '/eck/');
        if (!str_starts_with($returnTo, '/')) {
            $returnTo = '/eck/';
        }

        $verifier = eck_base64url(random_bytes(32));
        $challenge = eck_base64url(hash('sha256', $verifier, true));
        $state = eck_base64url(random_bytes(16));

        $_SESSION['oidc_state'] = $state;
        $_SESSION['oidc_verifier'] = $verifier;
        $_SESSION['oidc_return'] = $returnTo;

        $oidc = $this->oidcConfig();
        $params = http_build_query([
            'client_id' => $oidc['client_id'],
            'response_type' => 'code',
            'redirect_uri' => $oidc['redirect_uri'],
            'response_mode' => 'query',
            'scope' => $oidc['scopes'] ?? 'openid profile email',
            'state' => $state,
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
        ]);

        header('Location: ' . $this->authorizeUrl() . '?' . $params);
        exit;
    }

    private function callback(): void
    {
        if (!$this->isEnabled()) {
            eck_json_error(503, 'OIDC not configured');
        }

        $error = (string) ($_GET['error'] ?? '');
        if ($error !== '') {
            eck_json_error(401, 'OIDC error: ' . $error);
        }

        $code = (string) ($_GET['code'] ?? '');
        $state = (string) ($_GET['state'] ?? '');
        $expectedState = (string) ($_SESSION['oidc_state'] ?? '');
        $verifier = (string) ($_SESSION['oidc_verifier'] ?? '');
        $returnTo = (string) ($_SESSION['oidc_return'] ?? '/eck/');

        unset($_SESSION['oidc_state'], $_SESSION['oidc_verifier'], $_SESSION['oidc_return']);

        if ($code === '' || $state === '' || $state !== $expectedState || $verifier === '') {
            eck_json_error(400, 'Invalid OIDC callback');
        }

        $tokens = $this->exchangeCode($code, $verifier);
        $claims = $this->decodeJwtPayload((string) ($tokens['id_token'] ?? ''));

        $_SESSION['eck_user'] = [
            'sub' => (string) ($claims['sub'] ?? ''),
            'email' => (string) ($claims['email'] ?? $claims['preferred_username'] ?? ''),
            'name' => (string) ($claims['name'] ?? ''),
            'access_token' => (string) ($tokens['access_token'] ?? ''),
            'roles' => [],
        ];

        if ($_SESSION['eck_user']['sub'] === '') {
            eck_json_error(401, 'OIDC token missing subject');
        }

        header('Location: ' . $returnTo);
        exit;
    }

    private function logout(): void
    {
        eck_start_session($this->config);
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params);
        }
        session_destroy();

        if (!$this->isEnabled()) {
            header('Location: /eck/');
            exit;
        }

        $oidc = $this->oidcConfig();
        $logout = $this->logoutUrl();
        $redirect = (string) ($oidc['post_logout_redirect'] ?? '/eck/');
        header('Location: ' . $logout . '?' . http_build_query([
            'post_logout_redirect_uri' => $redirect,
        ]));
        exit;
    }

    private function me(): void
    {
        $user = $_SESSION['eck_user'] ?? null;
        if (!is_array($user) || empty($user['sub'])) {
            eck_json(['authenticated' => false, 'user' => null]);
        }

        eck_json([
            'authenticated' => true,
            'user' => [
                'sub' => $user['sub'],
                'email' => $user['email'] ?? null,
                'name' => $user['name'] ?? null,
            ],
        ]);
    }

    /** @return array<string, mixed> */
    private function oidcConfig(): array
    {
        return is_array($this->config['oidc'] ?? null) ? $this->config['oidc'] : [];
    }

    private function authorizeUrl(): string
    {
        return $this->issuerBase() . '/oauth2/v2.0/authorize';
    }

    private function tokenUrl(): string
    {
        return $this->issuerBase() . '/oauth2/v2.0/token';
    }

    private function logoutUrl(): string
    {
        return $this->issuerBase() . '/oauth2/v2.0/logout';
    }

    private function issuerBase(): string
    {
        $oidc = $this->oidcConfig();
        $issuer = (string) ($oidc['issuer'] ?? '');
        if ($issuer !== '') {
            return rtrim($issuer, '/');
        }

        $tenantId = (string) ($oidc['tenant_id'] ?? '');
        return 'https://login.microsoftonline.com/' . rawurlencode($tenantId) . '/v2.0';
    }

    /** @return array<string, mixed> */
    private function exchangeCode(string $code, string $verifier): array
    {
        $oidc = $this->oidcConfig();
        $body = http_build_query([
            'client_id' => $oidc['client_id'],
            'client_secret' => $oidc['client_secret'],
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $oidc['redirect_uri'],
            'code_verifier' => $verifier,
        ]);

        $ch = curl_init($this->tokenUrl());
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        ]);

        $response = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false || $status >= 400) {
            eck_json_error(502, 'OIDC token exchange failed');
        }

        $json = json_decode($response, true);
        if (!is_array($json)) {
            eck_json_error(502, 'Invalid OIDC token response');
        }

        return $json;
    }

    /** @return array<string, mixed> */
    private function decodeJwtPayload(string $jwt): array
    {
        $parts = explode('.', $jwt);
        if (count($parts) < 2) {
            return [];
        }

        $payload = base64_decode(strtr($parts[1], '-_', '+/'), true);
        if ($payload === false) {
            return [];
        }

        $json = json_decode($payload, true);
        return is_array($json) ? $json : [];
    }
}
