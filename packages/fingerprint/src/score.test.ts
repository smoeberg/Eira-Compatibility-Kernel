import { describe, expect, it } from "vitest";
import { classifyPath, normalizePath } from "./classifier";
import { calculateCompatibilityScore, checkSupport } from "./score";
import { getWeight } from "./weights";
import type { LogEntry } from "./types";
import matrixV0 from "./capability-matrix.v0.json";

describe("normalizePath", () => {
  it("replaces UUID segments with {id}", () => {
    expect(
      normalizePath("/drive/items/550e8400-e29b-41d4-a716-446655440000/content"),
    ).toBe("/drive/items/{id}/content");
  });
});

describe("classifyPath", () => {
  it("classifies identity paths", () => {
    expect(classifyPath("/users/abc")).toBe("identity");
  });

  it("classifies file paths", () => {
    expect(classifyPath("/drive/root/children")).toBe("files");
  });
});

describe("getWeight", () => {
  it("weights writes higher than reads", () => {
    expect(getWeight("POST", "/drive/items/1")).toBe(1.0);
    expect(getWeight("GET", "/drive/items/1")).toBe(0.5);
    expect(getWeight("OPTIONS", "/")).toBe(0.2);
  });

  it("weights lock paths as critical", () => {
    expect(getWeight("POST", "/drive/items/1/lock")).toBe(1.0);
  });
});

describe("checkSupport", () => {
  it("returns native for known GET user route", () => {
    expect(checkSupport("/users/{id}", "GET", matrixV0)).toBe("native");
  });

  it("returns gap for realtime chat", () => {
    expect(checkSupport("/me/chats/{id}/messages", "POST", matrixV0)).toBe("gap");
  });
});

describe("calculateCompatibilityScore", () => {
  const sampleLogs: LogEntry[] = [
    { method: "GET", path: "/users/550e8400-e29b-41d4-a716-446655440000" },
    { method: "GET", path: "/drive/root/children" },
    { method: "PUT", path: "/drive/items/550e8400-e29b-41d4-a716-446655440000/content" },
    { method: "POST", path: "/me/events" },
    { method: "POST", path: "/me/chats/abc/messages" },
    { method: "POST", path: "/notifications/webhook" },
  ];

  it("returns a score between 0 and 100", () => {
    const result = calculateCompatibilityScore(sampleLogs, matrixV0);
    expect(result.percent).toBeGreaterThan(0);
    expect(result.percent).toBeLessThanOrEqual(100);
  });

  it("includes per-category breakdown", () => {
    const result = calculateCompatibilityScore(sampleLogs, matrixV0);
    expect(result.byCategory.identity).toBeDefined();
    expect(result.byCategory.files).toBeDefined();
    expect(result.byCategory.chat_notify).toBeDefined();
  });

  it("matches fixture expectation band (regression)", () => {
    const result = calculateCompatibilityScore(sampleLogs, matrixV0);
    // 5 native/emulated weighted calls vs 1 gap chat POST (weight 1.0)
    expect(result.percent).toBeGreaterThan(70);
    expect(result.percent).toBeLessThan(95);
    expect(result.recommendation).toBe("yellow");
  });
});
