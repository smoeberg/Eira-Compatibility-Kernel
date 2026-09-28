# Eira Compatibility Kernel (ECK)

ECK is an integration layer for mapping API traffic from existing systems and evaluating compatibility with open backends. The fingerprint phase records limited request metadata and produces a compatibility report; the wider monorepo also contains translation, adapters, an API, an admin UI and deployment tooling.

## Repository layout

- `apps/`: API, BFF and admin application.
- `packages/`: fingerprinting, capabilities, translation, adapters and shared libraries.
- `integrations/`: optional CMS and proxy integrations.
- `infra/`: deployment configuration and operational instructions.
- `docs/specs/`: technical design documents.
- `tools/`: development and deployment helpers.

## Development

Requires Node.js 20+ and pnpm 9.15.4. Copy `.env.example` to `.env`, set local credentials, then run `pnpm install`, `pnpm build` and `pnpm test`. See the package scripts and `infra/` for service-specific setup. The example values in the local Compose file are for development only.

This repository was imported from the ECK directory in a project archive. Internal legal, commercial and planning drafts from that archive are excluded from this public code repository. Some configuration and implementation files in the supplied snapshot are empty placeholders; the build and tests have not been verified.
