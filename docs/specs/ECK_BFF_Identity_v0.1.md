# ECK BFF — Identity & dual-token v0.1

**Status:** v1 service token ✅ · v2 OIDC ✅ · **v0.5 NestJS BFF anbefalet** (PHP deprecated)  
**Dato:** 2. juli 2026  
**Relateret:** [apps/bff/README.md](../../apps/bff/README.md), [WEBSITE_CMS_INTEGRATION_v0.5.md](../WEBSITE_CMS_INTEGRATION_v0.5.md)

---

## Krav

BFF på Simply skal **aldrig**:

- Gemme eller validere brugernavn/adgangskode direkte (undgå Basic Auth som endeløsning)
- Eksponere `ADMIN_API_KEY` eller `SERVICE_TOKEN` til browser
- Lade browser kalde Hetzner API direkte

BFF skal:

1. Terminere **OIDC login** (Entra ID for kommune-IT, Keycloak som alternativ)
2. Validere **access token / ID token** server-side
3. Videresende **brugeridentitet** + **service token** til NestJS API

---

## Login-flow (v2 — OIDC Authorization Code + PKCE)

```
1. Bruger → eck.eira-systems.eu
2. React redirect → Entra / Keycloak (/authorize)
3. IdP → redirect til BFF /auth/callback med code
4. BFF: code → tokens (server-side, client_secret)
5. BFF: sæt HttpOnly session cookie (eller returnerer til SPA via secure channel)
6. SPA kalder /api/v1/* med session cookie
7. BFF: valider session → tilføj headers → Hetzner
```

**BFF håndterer aldrig password-felter** — kun OAuth2/OIDC redirects og token exchange.

---

## Headers BFF → NestJS API

| Header | v1 | v2 | Indhold |
|--------|----|----|---------|
| `Authorization` | `Bearer {SERVICE_TOKEN}` | Samme | BFF service identity |
| `X-Admin-Api-Key` | (legacy dev) | Fase ud | Erstattes af SERVICE_TOKEN |
| `X-User-Token` | — | JWT access token | Valideret bruger-token |
| `X-User-Sub` | — | `oid` / `sub` | Entra object id |
| `X-User-Email` | — | e-mail | Audit |
| `X-User-Roles` | — | `eck_operator`, `tenant_admin` | RBAC |
| `X-ECK-Timestamp` | — | Unix seconds | Anti-replay |
| `X-ECK-Signature` | — | `sha256={HMAC}` | Bund brugerheaders til BFF |
| `X-Request-Id` | — | UUID | Korrelation / audit |

API **afviser** kald uden gyldig `SERVICE_TOKEN`. v2: afvis også uden gyldig bruger-kontekst på beskyttede routes. **Signatur kræves** når `X-User-Sub` er sat (eller `ECK_REQUIRE_BFF_SIGNATURE=true`).

---

## Signerede brugerheaders (v2.1)

Forhindrer forfalskede `X-User-*` hvis API eksponeres (firewall-fejl).

**Canonical payload (ingen separatorer):**

```
{timestamp}{METHOD}{path}{body}{userSub}
```

**HMAC:** `SHA-256` med `ECK_BFF_SIGNING_SECRET` (eller dedikeret `signing_secret` i BFF).

**Headers:**

- `X-ECK-Timestamp` — Unix tid (max skew 300s default)
- `X-ECK-Signature` — `sha256={hex}`

Implementering: **`apps/bff`** (NestJS) + `@eck/bff-core`. PHP: deprecated reference.

---

## NestJS BFF (v0.5 — anbefalet)

| Route | App |
|-------|-----|
| `/auth/*` | `apps/bff` — OIDC PKCE, express-session |
| `/api/*` | `apps/bff` → proxy til `apps/api` |
| Signatur | `@eck/bff-core` — samme kode som API verificerer |

Deploy: [DEPLOY_BFF.md](../../infra/DEPLOY_BFF.md)

---

## Nøglerotation

Se [KEY_ROTATION_v0.1.md](../ops/KEY_ROTATION_v0.1.md).

API accepterer `ECK_SERVICE_TOKEN` + `ECK_SERVICE_TOKEN_PREVIOUS` (overlap). Signering: `ECK_BFF_SIGNING_SECRET` + `_PREVIOUS`.

---

## Audit

Admin-mutationer logges til `audit_log` (sub, tenant, action, IP, correlationId). Se [ECK_ENTERPRISE_READINESS_v0.1.md](../ECK_ENTERPRISE_READINESS_v0.1.md).

---

## NestJS API (guards)

| Guard | Tjek |
|-------|------|
| `ServiceTokenGuard` | `Authorization: Bearer` matcher `ECK_SERVICE_TOKEN` |
| `AdminAuthGuard` | Service token **eller** `X-Admin-Api-Key` (dev) |
| `UserContextGuard` | Kræver `X-User-Sub` når `ECK_REQUIRE_USER_CONTEXT=true` |
| `BffSignatureGuard` | Verificerer HMAC når service token + brugerheaders |

**Migration fra v1:**

- Behold `AdminApiKeyGuard` for lokal dev
- Prod: `ServiceTokenGuard` + IP whitelist på Hetzner

Env på Hetzner:

```env
ECK_SERVICE_TOKEN=           # deles kun med BFF
ECK_OIDC_ISSUER=             # Entra tenant / Keycloak realm
ECK_OIDC_AUDIENCE=           # API app registration
```

---

## IdP-valg

| | Entra ID | Keycloak |
|---|----------|----------|
| Kommune-IT | Naturligt (allerede Entra) | Self-hosted alternativ |
| B2G | ✅ Anbefalet | Hvis kunde kræver on-prem IdP |
| Spec | [ECK_Admin_Console](ECK_Admin_Console_v0.1.md) nævner Entra OIDC | EU-hosting muligt |

---

## v1 midlertidig (indtil OIDC)

| Mekanisme | OK som |
|-----------|--------|
| Simply directory password / Basic Auth | **Kort pilot** — ikke endelig |
| Service token BFF→API | ✅ v1 |
| API key i browser | ❌ Forbudt i prod |

---

## Cloudflare Worker (v3)

Samme kontrakt som PHP BFF:

- Valider OIDC JWT at edge
- Inject `Authorization: Bearer SERVICE_TOKEN`
- Forward `X-User-*` claims
- Ingen PHP, lavere latency

---

## Leverancer

| # | Output | Fase |
|---|--------|------|
| I1 | BFF adskilt fra WP | v0.5 ✅ NestJS `apps/bff` |
| I2 | `ECK_SERVICE_TOKEN` i API | v1 ✅ |
| I3 | Entra app registration + BFF callback | v2 ✅ |
| I4 | `UserContextGuard` + tenant ACL | v2 ✅ guard · ACL senere |
| I6 | Signerede brugerheaders (HMAC) | v2.1 ✅ |
| I7 | Token rotation + audit log | v2.1 ✅ |
| I5 | Cloudflare Worker POC | v3 |
