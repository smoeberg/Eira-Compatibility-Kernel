import {
  calculateCompatibilityScore,
  checkSupport,
  classifyPath,
  loadCapabilityMatrix,
  normalizePath,
  type LogEntry,
  type SupportLevel,
} from "@eck/fingerprint";
import { FINGERPRINT_REPORT_DISCLAIMER } from "./compatibility-report.disclaimer";
import type {
  CompatibilityReportDocument,
  CompatibilityReportEndpoint,
  CompatibilityReportResponse,
} from "./compatibility-report.types";
import { COMPATIBILITY_REPORT_SCHEMA_VERSION } from "./compatibility-report.types";

const RECOMMENDATION_LABELS: Record<
  "green" | "yellow" | "red",
  string
> = {
  green: "Grøn — høj kompatibilitet ift. nuværende capability matrix",
  yellow: "Gul — migrering mulig med forbehold og yderligere analyse",
  red: "Rød — væsentlige huller; udvidet analyse eller begrænset scope anbefales",
};

export interface BuildReportInput {
  reportId: string;
  runId: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  startedAt: Date;
  endsAt: Date;
  logs: LogEntry[];
  generatedAt?: Date;
}

interface EndpointAggregate {
  method: string;
  path: string;
  normalizedPath: string;
  category: string;
  support: SupportLevel;
  callCount: number;
}

function aggregateEndpoints(
  logs: LogEntry[],
  matrix = loadCapabilityMatrix(),
): EndpointAggregate[] {
  const map = new Map<string, EndpointAggregate>();

  for (const log of logs) {
    const path = log.path;
    const method = log.method.toUpperCase();
    const key = `${method} ${path}`;
    const normalizedPath = normalizePath(path);
    const category = log.category ?? classifyPath(path);
    const support = checkSupport(path, method, matrix);

    const existing = map.get(key);
    if (existing) {
      existing.callCount += 1;
      continue;
    }

    map.set(key, {
      method,
      path,
      normalizedPath,
      category,
      support,
      callCount: 1,
    });
  }

  return [...map.values()].sort((a, b) => b.callCount - a.callCount);
}

function toEndpointRow(row: EndpointAggregate): CompatibilityReportEndpoint {
  return {
    method: row.method,
    path: row.path,
    normalizedPath: row.normalizedPath,
    category: row.category,
    support: row.support,
    callCount: row.callCount,
  };
}

function durationDays(startedAt: Date, endsAt: Date): number {
  const ms = endsAt.getTime() - startedAt.getTime();
  return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)));
}

export function buildCompatibilityReport(
  input: BuildReportInput,
): CompatibilityReportResponse {
  const matrix = loadCapabilityMatrix();
  const generatedAt = input.generatedAt ?? new Date();
  const score = calculateCompatibilityScore(input.logs, matrix);
  const aggregates = aggregateEndpoints(input.logs, matrix);

  const gaps = aggregates
    .filter((row) => row.support === "gap")
    .map(toEndpointRow);

  const topEndpoints = aggregates.slice(0, 25).map(toEndpointRow);

  const document: CompatibilityReportDocument = {
    schemaVersion: COMPATIBILITY_REPORT_SCHEMA_VERSION,
    reportId: input.reportId,
    runId: input.runId,
    tenantId: input.tenantId,
    tenant: {
      slug: input.tenantSlug,
      name: input.tenantName,
    },
    generatedAt: generatedAt.toISOString(),
    observation: {
      startedAt: input.startedAt.toISOString(),
      endsAt: input.endsAt.toISOString(),
      durationDays: durationDays(input.startedAt, input.endsAt),
      callCount: input.logs.length,
      uniqueEndpoints: aggregates.length,
    },
    score: {
      totalPercent: score.percent,
      recommendation: score.recommendation,
      recommendationLabel: RECOMMENDATION_LABELS[score.recommendation],
      byCategory: score.byCategory,
      matrixVersion: matrix.version,
    },
    gaps,
    topEndpoints,
    disclaimers: FINGERPRINT_REPORT_DISCLAIMER,
    metadata: {
      product: "ECK Fingerprint",
      phase: "A",
      locale: "da-DK",
    },
  };

  return {
    schemaVersion: COMPATIBILITY_REPORT_SCHEMA_VERSION,
    report: document,
  };
}
