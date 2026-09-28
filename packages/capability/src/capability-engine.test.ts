import { describe, expect, it } from "vitest";
import { CapabilityEngine } from "./capability-engine";
import type { TenantCapabilityPolicy } from "./types";

describe("CapabilityEngine", () => {
  it("routes native matrix match to native + ldap/nextcloud", () => {
    const engine = new CapabilityEngine();
    const d = engine.resolve("GET", "/users/550e8400-e29b-41d4-a716-446655440000");
    expect(d.strategy).toBe("native");
    expect(d.support).toBe("native");
    expect(d.backend).toBe("ldap");
  });

  it("routes emulated match to emulated strategy", () => {
    const engine = new CapabilityEngine();
    const d = engine.resolve("POST", "/drive/items/42/lock");
    expect(d.strategy).toBe("emulated");
    expect(d.support).toBe("emulated");
  });

  it("rejects gap when coexist disabled", () => {
    const engine = new CapabilityEngine();
    const d = engine.resolve("POST", "/me/chats/99/messages");
    expect(d.strategy).toBe("reject");
    expect(d.support).toBe("gap");
  });

  it("coexists on gap when tenant policy allows", () => {
    const policy: TenantCapabilityPolicy = {
      tenantId: "t1",
      coexistOnGap: true,
      coexistMode: "primary_with_fallback",
      rejectPatterns: [],
      overrides: [],
    };
    const engine = new CapabilityEngine(undefined, policy);
    const d = engine.resolve("POST", "/me/chats/99/messages");
    expect(d.strategy).toBe("coexist");
    expect(d.backend).toBe("legacy");
    expect(d.coexistMode).toBe("primary_with_fallback");
  });

  it("honours reject patterns", () => {
    const policy: TenantCapabilityPolicy = {
      tenantId: "t1",
      coexistOnGap: true,
      coexistMode: "mirror",
      rejectPatterns: ["/users/{id}"],
      overrides: [],
    };
    const engine = new CapabilityEngine(undefined, policy);
    const d = engine.resolve("GET", "/users/blocked");
    expect(d.strategy).toBe("reject");
  });
});
