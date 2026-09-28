<?php

declare(strict_types=1);

final class RequestSigner
{
    public function __construct(private readonly array $config)
    {
    }

    /**
     * @return list<string> Signature headers (X-ECK-Timestamp, X-ECK-Signature)
     */
    public function sign(
        string $method,
        string $path,
        string $body,
        string $userSub,
    ): array {
        $secret = $this->signingSecret();
        if ($secret === '') {
            return [];
        }

        $timestamp = (string) time();
        $payload = $timestamp
            . strtoupper($method)
            . $path
            . $body
            . $userSub;

        $signature = hash_hmac('sha256', $payload, $secret);

        return [
            'X-ECK-Timestamp: ' . $timestamp,
            'X-ECK-Signature: sha256=' . $signature,
        ];
    }

    private function signingSecret(): string
    {
        $dedicated = (string) ($this->config['signing_secret'] ?? '');
        if ($dedicated !== '') {
            return $dedicated;
        }

        return (string) ($this->config['service_token'] ?? '');
    }
}
