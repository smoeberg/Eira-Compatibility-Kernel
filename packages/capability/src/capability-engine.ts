import {
  checkSupport,
  classifyPath,
  loadCapabilityMatrix,
  patternToRegex,
  type CapabilityMatrix,
  type SupportLevel,
} from "@eck/fingerprint";
import type {
  BackendTarget,
  CapabilityDecision,
  CapabilityStrategy,
  TenantCapabilityPolicy,
} from "./types";
import { DEFAULT_TENANT_POLICY } from "./types";

/** Maps API category → planned backend (adapters not wired yet). */
const CATEGORY_BACKEND: Record<string, BackendTarget> = {
  identity: "ldap",
  files: "nextcloud",
  calendar: "caldav",
  chat_notify: "legacy",
  other: "none",
};

function backendForCategory(category: string, support: SupportLevel): BackendTarget {
  if (support === "gap") return "legacy";
  return CATEGORY_BACKEND[category] ?? "none";
}

function isRejected(path: string, policy: TenantCapabilityPolicy): boolean {
  const normalized = path.split("?")[0] ?? path;
  return policy.rejectPatterns.some((pattern) =>
    patternToRegex(pattern).test(normalized),
  );
}

function overrideStrategy(
  path: string,
  policy: TenantCapabilityPolicy,
): CapabilityStrategy | null {
  const normalized = path.split("?")[0] ?? path;
  for (const o of policy.overrides) {
    if (patternToRegex(o.pattern).test(normalized)) {
      return o.strategy;
    }
  }
  return null;
}

function strategyFromSupport(
  support: SupportLevel,
  policy: TenantCapabilityPolicy,
): CapabilityStrategy {
  if (support === "native") return "native";
  if (support === "emulated") return "emulated";
  if (policy.coexistOnGap) return "coexist";
  return "reject";
}

/**
 * Runtime Capability Engine (LAG 3).
 * Decides how a request is handled: native adapter, emulation, coexistence, or reject.
 *
 * Fingerprint scoring uses the same matrix statically; this engine is for Phase B routing.
 */
export class CapabilityEngine {
  constructor(
    private readonly matrix: CapabilityMatrix = loadCapabilityMatrix(),
    private readonly policy: TenantCapabilityPolicy = {
      tenantId: "default",
      ...DEFAULT_TENANT_POLICY,
    },
  ) {}

  resolve(method: string, path: string): CapabilityDecision {
    if (isRejected(path, this.policy)) {
      return {
        strategy: "reject",
        support: "gap",
        backend: "none",
        reason: "Blocked by tenant policy",
      };
    }

    const forced = overrideStrategy(path, this.policy);
    const support = checkSupport(path, method, this.matrix);
    const category = classifyPath(path);
    const strategy = forced ?? strategyFromSupport(support, this.policy);
    const backend =
      strategy === "coexist"
        ? "legacy"
        : backendForCategory(category, support);

    const reason = forced
      ? `Policy override → ${forced}`
      : support === "native"
        ? "Matrix: native adapter"
        : support === "emulated"
          ? "Matrix: compatibility layer"
          : this.policy.coexistOnGap
            ? `Matrix gap → coexist (${this.policy.coexistMode})`
            : "Matrix gap — no adapter";

    return {
      strategy,
      support,
      backend,
      coexistMode:
        strategy === "coexist" ? this.policy.coexistMode : undefined,
      reason,
    };
  }
}

export function createCapabilityEngine(
  policy?: TenantCapabilityPolicy,
  matrix?: CapabilityMatrix,
): CapabilityEngine {
  return new CapabilityEngine(matrix, policy);
}
