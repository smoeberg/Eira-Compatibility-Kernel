import type { Request } from "express";
import { matchesServiceToken } from "@eck/bff-core";
import type { ServiceIdentity } from "./service-identity";
import { isServiceIdentity } from "./service-identity";

export interface ServiceAuthHeaders {
  Authorization: string;
  "X-ECK-Service-Id": ServiceIdentity;
}

export interface ServiceAuthVerifyResult {
  ok: boolean;
  serviceId?: ServiceIdentity;
  reason?: string;
}

export function getServiceTokenForIdentity(
  identity: ServiceIdentity,
): string | undefined {
  const envKey = `ECK_SERVICE_TOKEN_${identity.toUpperCase()}`;
  const specific = process.env[envKey]?.trim();
  if (specific) return specific;

  return process.env.ECK_SERVICE_TOKEN?.trim() || undefined;
}

export function buildServiceAuthHeaders(
  identity: ServiceIdentity,
  token?: string,
): ServiceAuthHeaders {
  const bearer =
    token?.trim() ||
    getServiceTokenForIdentity(identity) ||
    process.env.ECK_SERVICE_TOKEN?.trim() ||
    "";

  return {
    Authorization: `Bearer ${bearer}`,
    "X-ECK-Service-Id": identity,
  };
}

export function parseServiceIdentity(
  request: Request,
): ServiceIdentity | undefined {
  const raw = request.header("x-eck-service-id")?.trim().toLowerCase();
  if (!raw || !isServiceIdentity(raw)) return undefined;
  return raw;
}

export function requireServiceId(): boolean {
  return process.env.ECK_REQUIRE_SERVICE_ID !== "false";
}

export function apiBffOnly(): boolean {
  return process.env.ECK_API_BFF_ONLY === "true";
}

export function verifyServiceAuth(
  request: Request,
  allowedIdentities: readonly ServiceIdentity[],
): ServiceAuthVerifyResult {
  if (!matchesServiceToken(request)) {
    return { ok: false, reason: "Invalid or missing service token" };
  }

  const serviceId = parseServiceIdentity(request);

  if (requireServiceId()) {
    if (!serviceId) {
      return { ok: false, reason: "Missing X-ECK-Service-Id" };
    }
    if (!allowedIdentities.includes(serviceId)) {
      return {
        ok: false,
        reason: `Service identity '${serviceId}' not allowed for this route`,
      };
    }
  }

  return { ok: true, serviceId };
}
