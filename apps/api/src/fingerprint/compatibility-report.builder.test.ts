import { describe, expect, it } from "vitest";
import { buildCompatibilityReport } from "./compatibility-report.builder";
import { FINGERPRINT_REPORT_DISCLAIMER } from "./compatibility-report.disclaimer";

describe("buildCompatibilityReport", () => {
  const base = {
    reportId: "rpt-1",
    runId: "run-1",
    tenantId: "tenant-1",
    tenantSlug: "pilot",
    tenantName: "Pilot Kommune",
    startedAt: new Date("2026-06-01T00:00:00.000Z"),
    endsAt: new Date("2026-06-15T00:00:00.000Z"),
    generatedAt: new Date("2026-06-15T12:00:00.000Z"),
  };

  it("includes disclaimer with draft status", () => {
    const result = buildCompatibilityReport({
      ...base,
      logs: [{ method: "GET", path: "/users" }],
    });
    expect(result.report.disclaimers).toEqual(FINGERPRINT_REPORT_DISCLAIMER);
    expect(result.report.disclaimers.status).toBe("draft_pending_lawyer");
  });

  it("lists gap endpoints separately from top endpoints", () => {
    const result = buildCompatibilityReport({
      ...base,
      logs: [
        { method: "GET", path: "/users" },
        { method: "POST", path: "/unknown/widget" },
        { method: "POST", path: "/unknown/widget" },
      ],
    });

    expect(result.report.gaps).toHaveLength(1);
    expect(result.report.gaps[0]?.path).toBe("/unknown/widget");
    expect(result.report.gaps[0]?.callCount).toBe(2);
    expect(result.report.topEndpoints[0]?.callCount).toBe(2);
    expect(result.schemaVersion).toBe("1.0");
  });

  it("exposes score and observation metadata", () => {
    const result = buildCompatibilityReport({
      ...base,
      logs: [{ method: "GET", path: "/users" }],
    });

    expect(result.report.score.totalPercent).toBeGreaterThan(0);
    expect(result.report.observation.callCount).toBe(1);
    expect(result.report.observation.uniqueEndpoints).toBe(1);
    expect(result.report.tenant.slug).toBe("pilot");
  });
});
