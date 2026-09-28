CREATE TABLE IF NOT EXISTS integration_setups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  proxy_host varchar(255) NOT NULL UNIQUE,
  state jsonb NOT NULL,
  version integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS integration_setups_tenant_idx ON integration_setups(tenant_id);
ALTER TABLE fingerprint_log ADD COLUMN IF NOT EXISTS integration_id uuid REFERENCES integration_setups(id);
CREATE INDEX IF NOT EXISTS fingerprint_log_integration_idx ON fingerprint_log(integration_id);
CREATE TABLE IF NOT EXISTS integration_setup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES integration_setups(id),
  event varchar(64) NOT NULL,
  actor varchar(128) NOT NULL,
  from_status varchar(32) NOT NULL,
  to_status varchar(32) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tenant_memberships (
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_sub varchar(128) NOT NULL,
  role varchar(32) NOT NULL,
  PRIMARY KEY (tenant_id, user_sub)
);
