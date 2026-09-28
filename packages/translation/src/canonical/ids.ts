/** Stable ECK-internal identifier (UUID v4). Never exposed to platform APIs. */
export type CanonicalId = string;

export type IsoDateTime = string;

/**
 * Known platform APIs (inbound / emulated surface).
 * Add new platforms by implementing a PlatformMapper — not by changing canonical types.
 */
export const PLATFORM_IDS = {
  MICROSOFT_GRAPH: "microsoft_graph",
  GOOGLE_WORKSPACE: "google_workspace",
} as const;

export type PlatformId = (typeof PLATFORM_IDS)[keyof typeof PLATFORM_IDS];

/**
 * Known backend systems (outbound).
 * Each backend gets a BackendMapper — canonical model stays unchanged.
 */
export const BACKEND_IDS = {
  LDAP: "ldap",
  NEXTCLOUD: "nextcloud",
  OWNCLOUD: "owncloud",
  OPEN_XCHANGE: "open_xchange",
  GOOGLE_WORKSPACE: "google_workspace",
  CALDAV: "caldav",
  S3: "s3",
  COLLABORA: "collabora",
  MATRIX: "matrix",
} as const;

export type BackendId = (typeof BACKEND_IDS)[keyof typeof BACKEND_IDS];

export type ExternalSystemId = PlatformId | BackendId;

/** Cross-system identifier — Graph id, LDAP DN, Nextcloud file id, etc. */
export interface ExternalRef {
  system: ExternalSystemId;
  id: string;
  /** WebDAV path, LDAP DN, CalDAV href — when id alone is insufficient */
  path?: string;
}

export interface CanonicalEntityBase {
  /** ECK-internal id — assigned on first ingest if missing */
  id: CanonicalId;
  /** All known external ids for this entity across systems */
  externalRefs: ExternalRef[];
  createdAt?: IsoDateTime;
  modifiedAt?: IsoDateTime;
}

export function externalRef(
  system: ExternalSystemId,
  id: string,
  path?: string,
): ExternalRef {
  return path ? { system, id, path } : { system, id };
}

export function findExternalRef(
  refs: ExternalRef[],
  system: ExternalSystemId,
): ExternalRef | undefined {
  return refs.find((r) => r.system === system);
}
