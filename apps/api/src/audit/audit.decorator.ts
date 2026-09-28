import { SetMetadata } from "@nestjs/common";

export const AUDIT_METADATA_KEY = "eck:audit";

export interface AuditMetadata {
  /** Machine-readable action, e.g. tenant.create */
  action: string;
  /** Route param name holding tenant UUID */
  tenantParam?: string;
  /** Use `tenantId` from response body when present */
  tenantFromResult?: boolean;
}

export const Audit = (metadata: AuditMetadata) =>
  SetMetadata(AUDIT_METADATA_KEY, metadata);
