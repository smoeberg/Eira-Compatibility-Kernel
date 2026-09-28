import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { getSigningSecrets } from "./service-secrets";

const DEFAULT_MAX_SKEW_SECONDS = 300;

/** Canonical payload: timestamp + method + path + body + userSub (no delimiters). */
export function buildBffSignaturePayload(
  timestamp: string,
  method: string,
  path: string,
  body: string,
  userSub: string,
): string {
  return `${timestamp}${method.toUpperCase()}${path}${body}${userSub}`;
}

export function computeBffSignature(
  secret: string,
  timestamp: string,
  method: string,
  path: string,
  body: string,
  userSub: string,
): string {
  const payload = buildBffSignaturePayload(
    timestamp,
    method,
    path,
    body,
    userSub,
  );
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export interface OutboundSignatureHeaders {
  "X-ECK-Timestamp": string;
  "X-ECK-Signature": string;
}

export function signOutboundRequest(
  secret: string,
  method: string,
  path: string,
  body: string,
  userSub: string,
  timestamp = String(Math.floor(Date.now() / 1000)),
): OutboundSignatureHeaders {
  const signature = computeBffSignature(
    secret,
    timestamp,
    method,
    path,
    body,
    userSub,
  );
  return {
    "X-ECK-Timestamp": timestamp,
    "X-ECK-Signature": `sha256=${signature}`,
  };
}

export function requestPathForSignature(request: Request): string {
  const url = request.originalUrl ?? request.url ?? "/";
  const q = url.indexOf("?");
  return q >= 0 ? url.slice(0, q) : url;
}

export function requestBodyForSignature(request: Request): string {
  const raw = (request as Request & { rawBody?: Buffer }).rawBody;
  if (raw && raw.length > 0) {
    return raw.toString("utf8");
  }
  if (request.method === "GET" || request.method === "HEAD") {
    return "";
  }
  if (request.body === undefined || request.body === null) {
    return "";
  }
  if (typeof request.body === "string") {
    return request.body;
  }
  if (Buffer.isBuffer(request.body)) {
    return request.body.toString("utf8");
  }
  return JSON.stringify(request.body);
}

function parseSignatureHeader(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("sha256=")) {
    return trimmed.slice("sha256=".length);
  }
  return trimmed;
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export interface BffSignatureVerifyResult {
  ok: boolean;
  reason?: string;
}

export function verifyBffSignature(request: Request): BffSignatureVerifyResult {
  const secrets = getSigningSecrets();
  if (secrets.length === 0) {
    return { ok: false, reason: "Signing secret not configured" };
  }

  const timestamp = request.header("x-eck-timestamp")?.trim();
  const signature = parseSignatureHeader(request.header("x-eck-signature"));
  if (!timestamp || !signature) {
    return { ok: false, reason: "Missing X-ECK-Timestamp or X-ECK-Signature" };
  }

  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) {
    return { ok: false, reason: "Invalid timestamp" };
  }

  const maxSkew = Number.parseInt(
    process.env.ECK_BFF_SIGNATURE_MAX_SKEW_SECONDS ??
      String(DEFAULT_MAX_SKEW_SECONDS),
    10,
  );
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > maxSkew) {
    return { ok: false, reason: "Timestamp outside allowed skew" };
  }

  const method = request.method;
  const path = requestPathForSignature(request);
  const body = requestBodyForSignature(request);
  const userSub = request.header("x-user-sub")?.trim() ?? "";

  for (const secret of secrets) {
    const expected = computeBffSignature(
      secret,
      timestamp,
      method,
      path,
      body,
      userSub,
    );
    if (safeEqualHex(expected, signature)) {
      return { ok: true };
    }
  }

  return { ok: false, reason: "Signature mismatch" };
}
