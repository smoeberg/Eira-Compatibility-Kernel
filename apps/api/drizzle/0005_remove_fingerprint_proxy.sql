-- Fjerner proxy-modellens tabeller og kolonner (afløst af ADR-001 og ADR-002).
DROP TABLE IF EXISTS integration_setup_events;
DROP TABLE IF EXISTS integration_setups;
DROP TABLE IF EXISTS compatibility_reports;
DROP TABLE IF EXISTS fingerprint_log;
DROP TABLE IF EXISTS fingerprint_runs;
ALTER TABLE tenants DROP COLUMN IF EXISTS legacy_base_url;
