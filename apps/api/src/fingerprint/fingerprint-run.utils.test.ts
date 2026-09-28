import { describe, expect, it } from "vitest";
import {
  computeRunWindow,
  daysRemaining,
  isRunAcceptingIngest,
  isRunExpired,
} from "./fingerprint-run.utils";

describe("computeRunWindow", () => {
  it("adds 14 days by default", () => {
    const start = new Date("2026-06-01T12:00:00.000Z");
    const { endsAt, durationDays } = computeRunWindow(start);
    expect(durationDays).toBe(14);
    expect(endsAt.toISOString()).toBe("2026-06-15T12:00:00.000Z");
  });
});

describe("daysRemaining", () => {
  it("returns 0 when past end", () => {
    const endsAt = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date("2026-06-01T00:00:00.000Z");
    expect(daysRemaining(endsAt, now)).toBe(0);
  });
});

describe("isRunAcceptingIngest", () => {
  it("rejects completed runs", () => {
    const endsAt = new Date("2026-12-31T00:00:00.000Z");
    expect(isRunAcceptingIngest("complete", endsAt)).toBe(false);
  });

  it("accepts active running runs", () => {
    const endsAt = new Date("2026-12-31T00:00:00.000Z");
    const now = new Date("2026-06-01T00:00:00.000Z");
    expect(isRunAcceptingIngest("running", endsAt, now)).toBe(true);
  });

  it("stops ingest after endsAt", () => {
    const endsAt = new Date("2026-06-01T12:00:00.000Z");
    const now = new Date("2026-06-01T12:00:01.000Z");
    expect(isRunAcceptingIngest("running", endsAt, now)).toBe(false);
  });
});

describe("isRunExpired", () => {
  it("is false before endsAt", () => {
    const endsAt = new Date("2026-06-15T00:00:00.000Z");
    const now = new Date("2026-06-14T00:00:00.000Z");
    expect(isRunExpired("running", endsAt, now)).toBe(false);
  });

  it("is true after endsAt for running runs", () => {
    const endsAt = new Date("2026-06-15T00:00:00.000Z");
    const now = new Date("2026-06-15T00:00:01.000Z");
    expect(isRunExpired("running", endsAt, now)).toBe(true);
  });

  it("is false when already complete", () => {
    const endsAt = new Date("2020-01-01T00:00:00.000Z");
    const now = new Date("2026-06-01T00:00:00.000Z");
    expect(isRunExpired("complete", endsAt, now)).toBe(false);
  });
});
