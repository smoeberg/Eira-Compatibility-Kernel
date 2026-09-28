CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), action varchar(64) NOT NULL,
  user_sub varchar(128), user_email varchar(255), tenant_id uuid,
  tenant_slug varchar(63), correlation_id varchar(64), client_ip varchar(45),
  method varchar(10), path text, metadata jsonb,
  created_at timestamptz DEFAULT now()
);
