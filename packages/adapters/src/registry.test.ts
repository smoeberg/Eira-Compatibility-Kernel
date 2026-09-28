import { describe, expect, it } from "vitest";
import { BACKEND_IDS } from "@eck/translation";
import { AdapterPluginRegistry, registerDefaultPlugins } from "./index";

describe("AdapterPluginRegistry", () => {
  it("resolves storage plugins by backend id", () => {
    const registry = new AdapterPluginRegistry();
    registerDefaultPlugins(registry);
    expect(registry.storageAdapter(BACKEND_IDS.NEXTCLOUD)?.domain).toBe(
      "storage",
    );
    expect(registry.identityAdapter(BACKEND_IDS.LDAP)?.domain).toBe(
      "identity",
    );
    expect(registry.listRegistered()).toContain(BACKEND_IDS.S3);
  });
});
