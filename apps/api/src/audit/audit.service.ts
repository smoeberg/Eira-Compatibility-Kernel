import { Injectable, Logger } from "@nestjs/common";
import { getDb } from "../db";
import { auditLog } from "../db/schema";

export interface AuditEntry {
  action: string;
  userSub?: string;
  userEmail?: string;
  tenantId?: string;
  tenantSlug?: string;
  correlationId?: string;
  clientIp?: string;
  method?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async record(entry: AuditEntry): Promise<void> {
    const line = [
      entry.userSub ? `sub=${entry.userSub}` : null,
      `action=${entry.action}`,
      entry.tenantSlug ? `tenant=${entry.tenantSlug}` : null,
      entry.tenantId ? `tenantId=${entry.tenantId}` : null,
      entry.correlationId ? `correlationId=${entry.correlationId}` : null,
      entry.clientIp ? `ip=${entry.clientIp}` : null,
    ]
      .filter(Boolean)
      .join(" ");

    this.logger.log(line);

    try {
      const db = getDb();
      if (!db) return;
      await db.insert(auditLog).values({
        action: entry.action,
        userSub: entry.userSub ?? null,
        userEmail: entry.userEmail ?? null,
        tenantId: entry.tenantId ?? null,
        tenantSlug: entry.tenantSlug ?? null,
        correlationId: entry.correlationId ?? null,
        clientIp: entry.clientIp ?? null,
        method: entry.method ?? null,
        path: entry.path ?? null,
        metadata: entry.metadata ?? null,
      });
    } catch (err) {
      this.logger.error(
        `Failed to persist audit log: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
