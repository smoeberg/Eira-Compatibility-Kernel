const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
]);

export function sanitizeHeaders(
  headers: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!headers) {
    return null;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_HEADERS.has(lower)) {
      if (lower === "authorization" && typeof value === "string") {
        const [scheme] = value.split(" ");
        sanitized[key] = scheme ?? "Bearer";
      }
      continue;
    }
    sanitized[key] = value;
  }

  return sanitized;
}
