import {
  jsonb,
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
  contactEmail: varchar("contact_email", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
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

export const tenantMemberships = pgTable("tenant_memberships", {
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userSub: varchar("user_sub", { length: 128 }).notNull(),
  role: varchar("role", { length: 32 }).notNull(),
});
