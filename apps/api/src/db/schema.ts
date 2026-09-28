import {
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 63 }).notNull().unique(),
  name: text("name").notNull(),
  legacyBaseUrl: text("legacy_base_url").notNull(),
  contactEmail: varchar("contact_email", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const fingerprintRuns = pgTable("fingerprint_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("running"),
  mirrorPercent: integer("mirror_percent").notNull().default(100),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const fingerprintLog = pgTable("fingerprint_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  runId: uuid("run_id").references(() => fingerprintRuns.id),
  method: varchar("method", { length: 10 }),
  path: text("path"),
  pathRaw: text("path_raw"),
  requestHeaders: jsonb("req_headers"),
  responseStatus: integer("res_status"),
  latencyMs: integer("latency_ms"),
  payloadHash: varchar("payload_hash", { length: 64 }),
  category: varchar("category", { length: 32 }),
  capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow(),
});

export const compatibilityReports = pgTable("compatibility_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id")
    .notNull()
    .unique()
    .references(() => fingerprintRuns.id),
  tenantId: uuid("tenant_id").notNull(),
  totalScore: numeric("total_score", { precision: 5, scale: 2 }),
  scoresByCategory: jsonb("scores_by_category"),
  levels: jsonb("levels"),
  recommendation: varchar("recommendation", { length: 10 }),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: varchar("action", { length: 64 }).notNull(),
  userSub: varchar("user_sub", { length: 128 }),
  userEmail: varchar("user_email", { length: 255 }),
  tenantId: uuid("tenant_id"),
  tenantSlug: varchar("tenant_slug", { length: 63 }),
  correlationId: varchar("correlation_id", { length: 64 }),
  clientIp: varchar("client_ip", { length: 45 }),
  method: varchar("method", { length: 10 }),
  path: text("path"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
