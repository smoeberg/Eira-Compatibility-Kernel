import { describe, expect, it } from "vitest";
import { InMemoryTranslationRegistry } from "./registry";

describe("InMemoryTranslationRegistry", () => {
  it("resolves by pattern and method", () => {
    const reg = new InMemoryTranslationRegistry();
    reg.register({
      pattern: "/users/{id}",
      methods: ["GET"],
    });
    const hit = reg.resolve("GET", "/users/550e8400-e29b-41d4-a716-446655440000");
    expect(hit?.pattern).toBe("/users/{id}");
  });
});
