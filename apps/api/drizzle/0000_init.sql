CREATE TABLE IF NOT EXISTS "fingerprint_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "started_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "status" varchar(20) DEFAULT 'running' NOT NULL,
  "mirror_percent" integer DEFAULT 100 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "fingerprint_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "run_id" uuid,
  "method" varchar(10),
  "path" text,
  "path_raw" text,
  "req_headers" jsonb,
  "res_status" integer,
  "latency_ms" integer,
  "payload_hash" varchar(64),
  "category" varchar(32),
  "captured_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "compatibility_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "run_id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL,
  "total_score" numeric(5, 2),
  "scores_by_category" jsonb,
  "levels" jsonb,
  "recommendation" varchar(10),
  "generated_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "fingerprint_log"
  ADD CONSTRAINT "fingerprint_log_run_id_fingerprint_runs_id_fk"
  FOREIGN KEY ("run_id") REFERENCES "fingerprint_runs"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "compatibility_reports"
  ADD CONSTRAINT "compatibility_reports_run_id_fingerprint_runs_id_fk"
  FOREIGN KEY ("run_id") REFERENCES "fingerprint_runs"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX IF NOT EXISTS "fingerprint_log_tenant_id_idx" ON "fingerprint_log" ("tenant_id");
CREATE INDEX IF NOT EXISTS "fingerprint_log_run_id_idx" ON "fingerprint_log" ("run_id");
