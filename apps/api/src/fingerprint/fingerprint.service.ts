import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import {
  calculateCompatibilityScore,
  classifyPath,
  loadCapabilityMatrix,
  normalizePath,
} from "@eck/fingerprint";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import { FingerprintRunService } from "./fingerprint-run.service";
import type { IngestFingerprintDto, ScoreFromLogsDto } from "./fingerprint.dto";
import { sanitizeHeaders } from "./sanitize-headers";

@Injectable()
export class FingerprintService {
  private readonly logger = new Logger(FingerprintService.name);
  private readonly matrix = loadCapabilityMatrix();

  constructor(private readonly runService: FingerprintRunService) {}

  async ingest(dto: IngestFingerprintDto) {
    if (!dto.tenantId) {
      throw new BadRequestException("tenantId is required");
    }

    if (dto.runId) {
      await this.runService.assertRunAcceptsIngest(dto.runId, dto.tenantId);
    }

    const normalizedPath = normalizePath(dto.path);
    const category = classifyPath(dto.path);
    const headers = sanitizeHeaders(dto.requestHeaders);

    const row = {
      tenantId: dto.tenantId,
      runId: dto.runId ?? null,
      method: dto.method.toUpperCase(),
      path: normalizedPath,
      pathRaw: dto.pathRaw ?? dto.path,
      requestHeaders: headers,
      responseStatus: dto.responseStatus ?? null,
      latencyMs: dto.latencyMs ?? null,
      payloadHash: dto.payloadHash ?? null,
      category,
    };

    const db = getDb();
    if (!db) {
      this.logger.warn("DATABASE_URL not set — ingest skipped (dev mode)");
      return { stored: false, normalizedPath, category };
    }

    const [inserted] = await db
      .insert(schema.fingerprintLog)
      .values(row)
      .returning({ id: schema.fingerprintLog.id });

    return { stored: true, id: inserted.id, normalizedPath, category };
  }

  scoreFromLogs(dto: ScoreFromLogsDto) {
    return calculateCompatibilityScore(dto.logs, this.matrix);
  }

  async scoreFromRun(runId: string) {
    const db = getDb();
    if (!db) {
      throw new Error("DATABASE_URL required for run-based scoring");
    }

    const logs = await db
      .select({
        method: schema.fingerprintLog.method,
        path: schema.fingerprintLog.path,
        category: schema.fingerprintLog.category,
      })
      .from(schema.fingerprintLog)
      .where(eq(schema.fingerprintLog.runId, runId));

    const entries = logs
      .filter((l) => l.method && l.path)
      .map((l) => ({
        method: l.method!,
        path: l.path!,
        category: l.category as
          | "identity"
          | "files"
          | "calendar"
          | "chat_notify"
          | "other"
          | undefined,
      }));

    return calculateCompatibilityScore(entries, this.matrix);
  }
}
