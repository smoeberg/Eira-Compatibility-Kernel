CREATE TABLE IF NOT EXISTS "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(63) NOT NULL UNIQUE,
  "name" text NOT NULL,
  "legacy_base_url" text NOT NULL,
  "contact_email" varchar(255),
  "created_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "fingerprint_runs"
  ADD CONSTRAINT "fingerprint_runs_tenant_id_tenants_id_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants" ("slug");
