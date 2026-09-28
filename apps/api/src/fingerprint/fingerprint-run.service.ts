import { Injectable, GoneException, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { and, eq, lt } from "drizzle-orm";
import { getDb, schema } from "../db";
import { daysRemaining, isRunAcceptingIngest } from "./fingerprint-run.utils";
import type { CreateFingerprintRunDto, FingerprintRunResponse } from "./fingerprint-run.dto";

@Injectable()
export class FingerprintRunService {
  private db() {
    const db = getDb();
    if (!db) throw new ServiceUnavailableException("DATABASE_URL required");
    return db;
  }
  private response(row: typeof schema.fingerprintRuns.$inferSelect): FingerprintRunResponse {
    return { id: row.id, tenantId: row.tenantId, startedAt: row.startedAt.toISOString(),
      endsAt: row.endsAt.toISOString(), status: row.status, mirrorPercent: row.mirrorPercent,
      daysRemaining: daysRemaining(row.endsAt) };
  }
  createRun(_input: CreateFingerprintRunDto): never {
    throw new GoneException("Use the guided integration setup and verified traffic transition");
  }
  async listRuns(tenantId: string) {
    return (await this.db().select().from(schema.fingerprintRuns).where(eq(schema.fingerprintRuns.tenantId, tenantId)))
      .map((row) => this.response(row));
  }
  async getRun(runId: string) {
    const [row] = await this.db().select().from(schema.fingerprintRuns).where(eq(schema.fingerprintRuns.id, runId)).limit(1);
    if (!row) throw new NotFoundException("Run not found");
    return this.response(row);
  }
  async getActiveRunForTenant(tenantId: string) {
    const runs = await this.listRuns(tenantId);
    return runs.find((run) => run.status === "running") ?? null;
  }
  async assertRunAcceptsIngest(runId: string, tenantId: string) {
    const run = await this.getRun(runId);
    if (run.tenantId !== tenantId || !isRunAcceptingIngest(run.status, new Date(run.endsAt))) {
      throw new GoneException("Run is not accepting traffic");
    }
  }
  cancelRun(_runId: string): never { throw new GoneException("Legacy runs are read-only"); }
  completeRun(_runId: string): never { throw new GoneException("Legacy runs are read-only"); }
  getReportForRun(_runId: string): never { throw new GoneException("Legacy report endpoint is read-only"); }
  async completeExpiredRuns(): Promise<{ completed: string[]; errors: Array<{ runId: string; message: string }> }> {
    const rows = await this.db().update(schema.fingerprintRuns).set({ status: "completed" })
      .where(and(eq(schema.fingerprintRuns.status, "running"), lt(schema.fingerprintRuns.endsAt, new Date())))
      .returning({ id: schema.fingerprintRuns.id });
    return { completed: rows.map((row) => row.id), errors: [] };
  }
}
