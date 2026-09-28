import type { PlatformId } from "../canonical";
import type { CanonicalValue } from "../canonical/entity";
import type { TranslationContext } from "../context";

/** Inbound: platform API JSON → canonical model */
export interface PlatformInboundMapper<TPlatform = unknown> {
  readonly platformId: PlatformId;
  toCanonical(platform: TPlatform, ctx: TranslationContext): CanonicalValue;
}

/** Outbound: canonical model → platform API JSON (responses) */
export interface PlatformOutboundMapper<TPlatform = unknown> {
  readonly platformId: PlatformId;
  toPlatform(canonical: CanonicalValue, ctx: TranslationContext): TPlatform;
}

export interface PlatformRouteMapper<TPlatform = unknown> {
  readonly platformId: PlatformId;
  pattern: string;
  methods: string[];
  inbound?: PlatformInboundMapper<TPlatform>;
  outbound?: PlatformOutboundMapper<TPlatform>;
}

export interface PlatformMapperRegistry {
  register(mapper: PlatformRouteMapper): void;
  resolve(
    platformId: PlatformId,
    method: string,
    path: string,
  ): PlatformRouteMapper | null;
}
