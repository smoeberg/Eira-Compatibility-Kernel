import type { CanonicalValue } from "./canonical/entity";
import type { TranslationContext } from "./context";

export type PlatformPayload = unknown;
export interface RequestMapper {
  toCanonical(payload: PlatformPayload, ctx: TranslationContext): CanonicalValue;
}
export interface ResponseMapper {
  toPlatform(value: CanonicalValue, ctx: TranslationContext): PlatformPayload;
}
export interface RouteMapper {
  pattern: string;
  methods: string[];
  request?: RequestMapper;
  response?: ResponseMapper;
}
export interface TranslationRegistry {
  register(mapper: RouteMapper): void;
  resolve(method: string, path: string): RouteMapper | null;
}
