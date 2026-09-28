import { createHash, randomBytes } from "node:crypto";

export function base64url(data: Buffer): string {
  return data
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function randomToken(bytes = 32): string {
  return base64url(randomBytes(bytes));
}

export function pkceChallenge(verifier: string): string {
  return base64url(createHash("sha256").update(verifier).digest());
}

export function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const parts = jwt.split(".");
  if (parts.length < 2) return {};
  const payload = Buffer.from(
    parts[1].replace(/-/g, "+").replace(/_/g, "/"),
    "base64",
  ).toString("utf8");
  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return {};
  }
}
