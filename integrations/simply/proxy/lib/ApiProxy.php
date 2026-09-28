<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/OidcAuth.php';
require_once __DIR__ . '/RequestSigner.php';

final class ApiProxy
{
    public function __construct(private readonly array $config)
    {
    }

    public function forward(): void
    {
        $base = rtrim((string) ($this->config['hetzner_api_url'] ?? ''), '/');
        $serviceToken = (string) ($this->config['service_token'] ?? '');
        $adminApiKey = (string) ($this->config['admin_api_key'] ?? '');

        if ($base === '' || ($serviceToken === '' && $adminApiKey === '')) {
            eck_json_error(500, 'Missing hetzner_api_url and service_token/admin_api_key');
        }

        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
        if (!str_starts_with($path, '/api/')) {
            eck_json_error(404, 'Not found');
        }

        $target = $base . $path;
        $query = $_SERVER['QUERY_STRING'] ?? '';
        if ($query !== '') {
            $target .= '?' . $query;
        }

        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $body = file_get_contents('php://input');
        $bodyStr = ($body !== false && $body !== '') ? $body : '';

        $correlationId = (string) ($_SERVER['HTTP_X_REQUEST_ID'] ?? '');
        if ($correlationId === '') {
            $correlationId = bin2hex(random_bytes(16));
        }
        header('X-Request-Id: ' . $correlationId);

        $headers = [
            'Accept: application/json',
            'X-Request-Id: ' . $correlationId,
        ];

        if ($serviceToken !== '') {
            $headers[] = 'Authorization: Bearer ' . $serviceToken;
        } elseif ($adminApiKey !== '') {
            $headers[] = 'X-Admin-Api-Key: ' . $adminApiKey;
        }

        $userSub = '';
        $oidc = new OidcAuth($this->config);
        if ($oidc->isEnabled()) {
            $userHeaders = $oidc->userHeadersForProxy();
            foreach ($userHeaders as $header) {
                if (str_starts_with($header, 'X-User-Sub: ')) {
                    $userSub = substr($header, 12);
                }
            }
            $headers = array_merge($headers, $userHeaders);
        }

        if ($serviceToken !== '') {
            $signer = new RequestSigner($this->config);
            $headers = array_merge($headers, $signer->sign($method, $path, $bodyStr, $userSub));
        }

        $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
        if ($bodyStr !== '' && $contentType !== '') {
            $headers[] = 'Content-Type: ' . $contentType;
        }

        $ch = curl_init($target);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => true,
            CURLOPT_TIMEOUT => 60,
            CURLOPT_HTTPHEADER => $headers,
        ]);

        if ($bodyStr !== '' && !in_array($method, ['GET', 'HEAD'], true)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyStr);
        }

        $response = curl_exec($ch);

        if ($response === false) {
            eck_json_error(502, 'Upstream unavailable: ' . curl_error($ch));
        }

        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);

        http_response_code($status);
        header('Content-Type: application/json');
        echo substr($response, $headerSize);
    }
}
