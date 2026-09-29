import type { SupportLevel } from "@eck/fingerprint";

export type BackendTarget = "ldap" | "nextcloud" | "caldav" | "legacy" | "none";
export type CapabilityStrategy = "native" | "emulated" | "coexist" | "reject";
export type CoexistMode = "primary_with_fallback" | "mirror";

export interface TenantCapabilityPolicy {
  tenantId: string;
  coexistOnGap: boolean;
  coexistMode: CoexistMode;
  rejectPatterns: string[];
  overrides: Array<{ pattern: string; strategy: CapabilityStrategy }>;
}

export interface CapabilityDecision {
  strategy: CapabilityStrategy;
  support: SupportLevel;
  backend: BackendTarget;
  coexistMode?: CoexistMode;
  reason: string;
}

export const DEFAULT_TENANT_POLICY: Omit<TenantCapabilityPolicy, "tenantId"> = {
  coexistOnGap: false,
  coexistMode: "primary_with_fallback",
  rejectPatterns: [],
  overrides: [],
};
