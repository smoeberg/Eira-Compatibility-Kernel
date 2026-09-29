# Eira Compatibility Kernel (ECK)

ECK is an integration layer for mapping API traffic from existing systems and evaluating compatibility with open backends. The fingerprint phase records limited request metadata and produces a compatibility report; the wider monorepo also contains translation, adapters, an API, an admin UI and deployment tooling.

## Repository layout

- `apps/`: API, BFF and admin application.
- `packages/`: fingerprinting, capabilities, translation, adapters and shared libraries.
- `integrations/`: optional CMS and proxy integrations.
- `infra/`: deployment configuration and operational instructions.
- `docs/specs/`: technical design documents.
- `docs/architecture/KUBERNETES_SAAS.md`: target SaaS architecture and delivery gates.
- `docs/architecture/SETUP_AND_ROLLBACK.md`: guided per-integration setup, verification and rollback.
- `tools/`: development and deployment helpers.

## Development

Requires Node.js 20+ and pnpm 9.15.4. Copy `.env.example` to `.env`, set local credentials, then run `pnpm install`, `pnpm build` and `pnpm test`. See the package scripts and `infra/` for service-specific setup. The example values in the local Compose file are for development only.

This repository was imported from the ECK directory in a project archive. Internal legal, commercial and planning drafts from that archive are excluded from this public code repository. Runtime adapters and parts of the historical report workflow remain placeholders.

## Guided fingerprint setup

The admin portal creates a separate integration URL for each fagsystem. `POST /api/v1/tenants/:tenantId/integrations` accepts a test environment, name and HTTPS upstream origin. `POST .../:id/transitions` applies customer-confirmed events. The API requires a signed BFF user context and a `tenant_memberships` role for each tenant. A `platform_admin` OIDC app role can create a tenant and receives its first tenant membership.

Set `DATABASE_URL`, `ECK_FP_DOMAIN` (the wildcard DNS/TLS domain), and a comma-separated `ECK_ALLOWED_UPSTREAM_HOSTS` list before creating integrations. Configure BFF OIDC, service token and signature secrets for admin access. Apply SQL migrations in `apps/api/drizzle` in order. Route the wildcard fingerprint hostname to the API before JSON body parsing. The proxy streams the request to the approved upstream; the API stores only reviewed route templates, method, category and status while an integration is active. Unknown paths are reduced to `/unknown`. The observation stops automatically after at most 14 days, while forwarding remains enabled for safe rollback.

The state machine and synthetic proxy tests are in `apps/api/src/onboarding`. They cover unsuccessful and successful upstream calls, explicit confirmation, expiry and continued forwarding after rollback. The current portal shows live counters and setup transitions; its readiness and volume indicators are not a verified baseline, and the new integration records are not yet wired to report/PDF generation. Do not use this branch for a customer production run until database migration, real upstream compatibility, durable BFF sessions, operational controls and retention are verified.

The admin console uses `/tenants/:tenantId/integrations/:integrationId` as its setup workspace. Its former run view is removed; the integration report is still pending API work. Production browser access uses the BFF OIDC session and the portal CSP; the API-key login remains a development-only path with session-scoped storage. Run `pnpm --filter @eck/admin test` for the integration confirmation UI test.

## Deployment direction

The target product is a multi-tenant SaaS on Kubernetes. The fingerprint phase uses an ECK-hosted pass-through proxy: the customer changes a configurable API base URL, without installing an ECK component. Raw traffic passes through ECK in memory; only approved structural aggregates may be persisted. See [KUBERNETES_SAAS.md](docs/architecture/KUBERNETES_SAAS.md) and [FINGERPRINT_DATA_FLOW.md](docs/architecture/FINGERPRINT_DATA_FLOW.md). Existing Docker Compose and single-server deployment guides are historical/development material, not the target production deployment. No Kubernetes production deployment is claimed for this snapshot.
