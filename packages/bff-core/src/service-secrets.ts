import type { Request } from "express";

/** Active + previous secrets/tokens for zero-downtime rotation. */
export function getServiceTokens(): string[] {
  const tokens: string[] = [];
  const active = process.env.ECK_SERVICE_TOKEN?.trim();
  const previous = process.env.ECK_SERVICE_TOKEN_PREVIOUS?.trim();

  if (active) tokens.push(active);
  if (previous && previous !== active) tokens.push(previous);

  return tokens;
}

export function getSigningSecrets(): string[] {
  const secrets: string[] = [];
  const dedicated = process.env.ECK_BFF_SIGNING_SECRET?.trim();
  const dedicatedPrevious =
    process.env.ECK_BFF_SIGNING_SECRET_PREVIOUS?.trim();
  const fallback = process.env.ECK_SERVICE_TOKEN?.trim();
  const fallbackPrevious = process.env.ECK_SERVICE_TOKEN_PREVIOUS?.trim();

  if (dedicated) {
    secrets.push(dedicated);
    if (dedicatedPrevious && dedicatedPrevious !== dedicated) {
      secrets.push(dedicatedPrevious);
    }
  } else if (fallback) {
    secrets.push(fallback);
    if (fallbackPrevious && fallbackPrevious !== fallback) {
      secrets.push(fallbackPrevious);
    }
  }

  return secrets;
}

/** Primary signing secret for outbound BFF requests. */
export function getActiveSigningSecret(): string {
  return getSigningSecrets()[0] ?? "";
}

export function extractBearerToken(request: Request): string | null {
  const auth = request.header("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export function matchesServiceToken(request: Request): boolean {
  const token = extractBearerToken(request);
  if (!token) return false;
  return getServiceTokens().includes(token);
}
