import type { LogCategory, ScoreResult, SupportLevel } from "@eck/fingerprint";

export const COMPATIBILITY_REPORT_SCHEMA_VERSION = "1.0" as const;

export type ReportDisclaimerStatus = "draft_pending_lawyer";

export interface CompatibilityReportDisclaimer {
  status: ReportDisclaimerStatus;
  /** Primær disclaimer — skal godkendes af advokat før produktionssalg */
  primary: string;
  secondary: string;
}

export interface CompatibilityReportEndpoint {
  method: string;
  path: string;
  normalizedPath: string;
  category: LogCategory | string;
  support: SupportLevel;
  callCount: number;
}

export interface CompatibilityReportDocument {
  schemaVersion: typeof COMPATIBILITY_REPORT_SCHEMA_VERSION;
  reportId: string;
  runId: string;
  tenantId: string;
  tenant: {
    slug: string;
    name: string;
  };
  generatedAt: string;
  observation: {
    startedAt: string;
    endsAt: string;
    durationDays: number;
    callCount: number;
    uniqueEndpoints: number;
  };
  score: {
    totalPercent: number;
    recommendation: ScoreResult["recommendation"];
    recommendationLabel: string;
    byCategory: ScoreResult["byCategory"];
    matrixVersion: string;
  };
  /** Endpoints uden native/emulated dækning i capability matrix */
  gaps: CompatibilityReportEndpoint[];
  /** Mest kaldte endpoints (alle support-niveauer) */
  topEndpoints: CompatibilityReportEndpoint[];
  disclaimers: CompatibilityReportDisclaimer;
  metadata: {
    product: "ECK Fingerprint";
    phase: "A";
    locale: "da-DK";
  };
}

export interface CompatibilityReportResponse {
  schemaVersion: typeof COMPATIBILITY_REPORT_SCHEMA_VERSION;
  report: CompatibilityReportDocument;
}
