export interface IngestFingerprintDto {
  tenantId: string;
  runId?: string;
  method: string;
  path: string;
  pathRaw?: string;
  requestHeaders?: Record<string, unknown>;
  responseStatus?: number;
  latencyMs?: number;
  payloadHash?: string;
}

export interface ScoreFromLogsDto {
  logs: Array<{ method: string; path: string }>;
}
