import { describe, expect, it } from "vitest";
import { normalizeSlug, assertValidSlug } from "./tenant.utils";

describe("normalizeSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(normalizeSlug("Hvidovre Kommune")).toBe("hvidovre-kommune");
  });
});

describe("assertValidSlug", () => {
  it("accepts valid slug", () => {
    expect(() => assertValidSlug("hvidovre")).not.toThrow();
  });

  it("rejects invalid slug", () => {
    expect(() => assertValidSlug("-bad-")).toThrow();
  });
});
