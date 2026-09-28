import type { PlatformId } from "./canonical";
import type { CanonicalValue } from "./canonical/entity";
import type { BackendId } from "./canonical/ids";
import type { TranslationContext } from "./context";

/**
 * End-to-end translation through the canonical hub:
 *
 *   Platform API  →  Canonical Model  →  Backend
 *   (Graph)            (ECK)             (Nextcloud, LDAP, …)
 *
 * Platform and backend mappers never call each other directly.
 */
export interface TranslationPipeline {
  /** Inbound request: platform body → canonical command/entity */
  platformToCanonical<TPlatform>(
    platformId: PlatformId,
    platform: TPlatform,
    ctx: TranslationContext,
  ): CanonicalValue;

  /** Outbound to backend: canonical → backend operation */
  canonicalToBackend(
    backendId: BackendId,
    canonical: CanonicalValue,
    ctx: TranslationContext,
  ): unknown;

  /** Inbound from backend: backend response → canonical */
  backendToCanonical(
    backendId: BackendId,
    backend: unknown,
    ctx: TranslationContext,
  ): CanonicalValue;

  /** Outbound response: canonical → platform JSON */
  canonicalToPlatform<TPlatform>(
    platformId: PlatformId,
    canonical: CanonicalValue,
    ctx: TranslationContext,
  ): TPlatform;
}
