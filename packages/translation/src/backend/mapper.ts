import type { BackendId } from "../canonical";
import type { CanonicalKind, CanonicalValue } from "../canonical/entity";
import type { TranslationContext } from "../context";

/** Backend-specific payload — opaque to platform mappers */
export type BackendPayload = unknown;

/** Outbound: canonical → backend-native operation (LDAP mod, WebDAV, CalDAV, …) */
export interface BackendOutboundMapper {
  readonly backendId: BackendId;
  /** Which canonical kinds/commands this mapper handles */
  supports: CanonicalKind[] | import("../canonical/commands").CanonicalCommandOp[];
  toBackend(canonical: CanonicalValue, ctx: TranslationContext): BackendPayload;
}

/** Inbound: backend response → canonical */
export interface BackendInboundMapper {
  readonly backendId: BackendId;
  fromBackend(backend: BackendPayload, ctx: TranslationContext): CanonicalValue;
}

export interface BackendMapperPair {
  readonly backendId: BackendId;
  outbound: BackendOutboundMapper;
  inbound: BackendInboundMapper;
}
