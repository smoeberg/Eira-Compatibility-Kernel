# ECK — Core Architecture v0.1

**Status:** Normativ designretning  
**Dato:** 3. juli 2026  
**Relateret:** [ECK_Canonical_Model_v0.1.md](ECK_Canonical_Model_v0.1.md), [ECK_Adapter_Plugins_v0.1.md](ECK_Adapter_Plugins_v0.1.md)

---

## Det største tekniske risikoområde: kompleksitet

Den største risiko er **ikke** teknologivalg (NestJS, Nextcloud, LDAP).  
Det er **kombinatorisk eksplosion**:

```
N platforme  ×  M backends  ×  edge cases  =  udviklingshelvede
```

Microsoft, Google, Exchange, SharePoint, Nextcloud, LDAP, Samba, …  
Hvis denne kompleksitet spredes i API, admin, BFF og database, bliver ECK umulig at vedligeholde.

### Løsning: tre isolationslag

Al platform- og backend-specifik kompleksitet **skal** bo i præcis tre steder:

| Lag | Pakke | Ansvar |
|-----|-------|--------|
| **1. Canonical Model** | `@eck/translation` | Én fælles datamodel — ingen platform/backend-felter |
| **2. Capability Engine** | `@eck/capability` | native / emulate / coexist / reject — routing uden business-logik |
| **3. Adapter plugins** | `@eck/adapters` | Backend-specifik IO — implementerer interfaces, rører ikke kernen |

**Alt andet** (API, BFF, admin) opererer kun på canonical types + engine-beslutninger.

```
                    ┌─────────────────────────────────┐
  Microsoft Graph ──┤                                 │
  Google Workspace ─┤   Platform mappers (inbound)    │
                    └──────────────┬──────────────────┘
                                   ▼
                    ┌─────────────────────────────────┐
                    │      CANONICAL MODEL (hub)      │
                    │  User · File · Calendar · Mail  │
                    │  Identity · Permission          │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────┴──────────────────┐
                    │      Capability Engine          │
                    │  native | emulate | coexist     │
                    └──────────────┬──────────────────┘
                                   ▼
                    ┌─────────────────────────────────┐
                    │   Adapter plugins (outbound)    │
                    │  IStorage · IIdentity · …       │
                    └──────────────┬──────────────────┘
           Nextcloud · ownCloud · S3 · LDAP · CalDAV · …
```

### Forbudt (spredning af kompleksitet)

- Graph-felter i `apps/api` controllers
- Nextcloud WebDAV paths i fingerprint score
- LDAP DN-logik i admin SPA
- Platform-specifik fejlhåndtering uden for translation layer

---

## Canonical Model — systemets centrum

Hele ECK bygges omkring **én fælles model**. Se [ECK_Canonical_Model_v0.1.md](ECK_Canonical_Model_v0.1.md).

| Entity | Formål |
|--------|--------|
| `CanonicalUser` | Directory-bruger (profil) |
| `CanonicalIdentity` | Auth-principal (login, OIDC/LDAP-kilde) |
| `CanonicalFile` | Filer og mapper (storage-neutral) |
| `CanonicalCalendarEvent` | Kalender |
| `CanonicalMailMessage` | Mail |
| `CanonicalPermission` | ACL / roller |

Ny backend = ny adapter plugin. **Canonical types ændres kun ved nye domæner** (fx kontakter), ikke per integration.

---

## Adapter plugins

Backends implementerer domæne-interfaces — se [ECK_Adapter_Plugins_v0.1.md](ECK_Adapter_Plugins_v0.1.md):

```
IStorageAdapter    → NextcloudAdapter, OwnCloudAdapter, S3Adapter
IIdentityAdapter   → LdapAdapter, …
ICalendarAdapter   → CaldavAdapter, OpenXchangeAdapter, …
IMailAdapter       → OpenXchangeAdapter, …
IChatAdapter       → MatrixAdapter (V2)
IDocumentAdapter   → CollaboraAdapter (WOPI)
```

Registry (`AdapterPluginRegistry`) loader plugins ved startup — kernen kender kun interfaces.

---

## Security (prioriteret)

Se [ECK_Security_Roadmap_v0.1.md](ECK_Security_Roadmap_v0.1.md).

| Prioritet | Kontrol | Status |
|-----------|---------|--------|
| P0 | RBAC enforcement | Planlagt |
| P0 | Audit på alle admin-mutationer | Delvist (`@Audit()`) |
| P0 | Rate limiting | Planlagt |
| P1 | Secret rotation | Helpers findes |
| P2 | mTLS mellem interne services | På sigt |

Auth-startpunkt (OIDC, Entra, Keycloak, API keys) er på plads — **authorization og throttling** er næste.

---

## Vedligeholdelsesregel

> Tilføj platform? → Platform mapper.  
> Tilføj backend? → Adapter plugin.  
> Ændr routing? → Capability matrix + engine.  
> **Rør aldrig kernen for en ny kombination.**

Dette er den eneste måde ECK kan skalere til mange platforme uden at eksplodere.
