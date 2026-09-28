/**
 * Platform service identities for service-to-service (S2S) authentication.
 * All internal callers use Bearer token + X-ECK-Service-Id.
 */
export const SERVICE_IDENTITIES = [
  "bff",
  "api",
  "worker",
  "scheduler",
  "notifier",
  "importer",
] as const;

export type ServiceIdentity = (typeof SERVICE_IDENTITIES)[number];

export function isServiceIdentity(value: string): value is ServiceIdentity {
  return (SERVICE_IDENTITIES as readonly string[]).includes(value);
}

/** Admin `/api/v1/*` — browser traffic must arrive via BFF only. */
export const ADMIN_ROUTE_IDENTITIES: ServiceIdentity[] = ["bff"];

/** Internal ingest / automation routes. */
export const INTERNAL_ROUTE_IDENTITIES: ServiceIdentity[] = [
  "bff",
  "worker",
  "scheduler",
  "importer",
  "notifier",
];
