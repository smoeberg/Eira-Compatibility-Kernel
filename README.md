# Eira Compatibility Kernel (ECK)

ECK er en foranalyse for kommuner, der overvejer at skifte fra Microsoft Office til LibreOffice. Den kortlægger, hvordan kommunens fagsystemer faktisk afhænger af Word og Excel – via COM-automation, skabeloner, makroer og tilføjelser – så kommunen kender mulighederne og begrænsningerne, før den skifter.

Fagsystemerne ændres ikke. Rådata forlader aldrig kommunen: kun en rapportfil, som kommunens IT har set og godkendt, uploades til Eira.

## Beslutninger

| Dokument | Indhold |
|---|---|
| [ADR-001](docs/decisions/ADR-001-office-centric-discovery.md) | Office-centreret kortlægning, datagrænser, evidensniveauer E0–E5 og bindende krav ECK-OCD-001–014 |
| [ADR-002](docs/decisions/ADR-002-maalearkitektur.md) | Målearkitektur for Office-automation: fase A og B, de tre tilstande, bro, layouttest og kompatibilitetsmatrix |
| [EVIDENSKILDER](docs/sales/EVIDENSKILDER.md) | Hvad der kræves af adgang, godkendelse og installation hos kommunen, og hvilke formuleringer der må bruges |

Begge ADR'er har status **Foreslået**.

## Arkitektur

**Hos kommunen (rådata bliver her)**

- **Måling:** sporer et fagsystems Word- og Excel-kald i et testmiljø. Bygger på en fork af COLEAT's `genproxy` og `proxies` (MPL 2.0) uden injektion i kommunens miljøer (ADR-002).
- **Inventar:** PowerShell via Intune – tilføjelser, ODBC, servere med Office-automation og procesoprettelse.
- **Skabelonscanner:** kører af kommunens IT mod egne shares; kun antal og typer af makroer, felter og indholdskontroller.
- **Layouttest:** LibreOffice mod de PDF'er, kommunens fagsystemer allerede danner.
- **Sammentælling:** lokalt i browseren; positivliste, fjernelse af små tal og godkendelse før manuel upload.

**Hos Eira (dette repo)**

- **Ingest** af godkendte rapportfiler med evidensniveau og tilstanden `called` / `measured_none` / `not_measured`.
- **Vidensbase og kompatibilitetsmatrix** pr. fagsystem, med probe-tests mod fastlåste LibreOffice-versioner.
- **Rapport** pr. fagsystem. Ingen samlet procent.

**LibreOffice-økosystemet**

- Huller i LibreOffice's VBA-lag sendes som rettelser upstream.
- Broen: `Writer.Application` for sen binding; egen COM-server kun hvor tidlig binding kræver det.

## Status

Dette repo indeholder i dag server-delen, som de nye komponenter bygges på:

- `apps/api`: NestJS-API med kommuner (tenants), medlemskaber, servicegodkendelse og revisionslog.
- `apps/bff`: portal-gateway med OIDC-login og signerede brugerheaders.
- `apps/admin`: administrationsflade for kommuner.
- `packages/bff-core`, `packages/service-auth`, `packages/observability`: delte biblioteker.
- `infra/`: deployment af API, BFF og admin.

Måling, inventar, skabelonscanner, sammentælling, ingest, vidensbase, probe-matrix og layouttest er endnu ikke bygget. Byggerækkefølgen står i ADR-002.

Den tidligere proxy-baserede fingerprint-model (Eira-hostet pass-through-proxy, procentscore, oversættelseslag og adaptere) er fjernet, fordi ADR-001 har fravalgt den. Den findes i git-historikken.

## Udvikling

Kræver Node.js 20+ og pnpm 9.15.4.

```bash
cp .env.example .env
pnpm install
pnpm build
pnpm test
```

Databasemigreringer ligger i `apps/api/drizzle` og køres i nummerorden. Se [infra/DEPLOY.md](infra/DEPLOY.md) for lokal opsætning og deployment.
