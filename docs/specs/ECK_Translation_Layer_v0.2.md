# ECK Translation Layer v0.2

**Status:** Canonical model + mapper interfaces  
**Relateret:** [ECK_MATURITY_AUDIT_v0.1.md](../ECK_MATURITY_AUDIT_v0.1.md), kernel LAG 2  
**Forrige:** [ECK_Translation_Layer_v0.1.md](ECK_Translation_Layer_v0.1.md)

---

## Kerneidé: Canonical Model som hub

Platform-API'er og backends må **aldrig** mappes direkte til hinanden.  
Al trafik går gennem én intern, kanonisk datamodel:

```
Microsoft Graph ──► Canonical Model ──► Nextcloud
Google Workspace ──►      ▲           ──► ownCloud
                         │           ──► Open-Xchange
                         │           ──► Google Workspace (backend)
                         │           ──► LDAP / CalDAV
                         │
              (samme model for alle)
```

**Regel:** Tilføj ny backend = ny `BackendMapper`. Tilføj ny platform = ny `PlatformMapper`. Canonical types ændres kun når der er et nyt domæne (fx kontakter), ikke for hver integration.

---

## Pakke-struktur

```
packages/translation/src/
├── canonical/              # Hub — platform/backend-neutral
│   ├── ids.ts              ExternalRef, PlatformId, BackendId
│   ├── identity.ts         CanonicalUser, CanonicalGroup, …
│   ├── files.ts            CanonicalDriveItem
│   ├── calendar.ts         CanonicalCalendarEvent
│   ├── commands.ts         CanonicalCommand (writes)
│   └── entity.ts           CanonicalEntity union
├── platform/               # Inbound — emuleret API → canonical
│   ├── mapper.ts
│   ├── registry.ts
│   └── microsoft-graph/
│       └── users.mapper.ts   (eksempel)
├── backend/                # Outbound — canonical → backend
│   ├── mapper.ts
│   └── nextcloud/            (plan)
├── pipeline.ts             # End-to-end interface
└── schema/canonical/       # JSON Schema per entity
```

---

## Canonical Model — domæner (V1)

| Domæne | Entities | Commands |
|--------|----------|----------|
| **Identity** | `CanonicalUser`, `CanonicalGroup`, `CanonicalGroupMembership` | create/update/delete user |
| **Files** | `CanonicalDriveItem` (file \| folder) | create/update/delete item |
| **Calendar** | `CanonicalCalendarEvent` | create/update/delete event |

### Identitet på tværs af systemer

Hver entity har:

- `id` — ECK-intern UUID (stabil på tværs af migration)
- `externalRefs[]` — `{ system, id, path? }` for Graph-id, LDAP DN, NC file id, osv.

```typescript
{
  id: "550e8400-…",
  externalRefs: [
    { system: "microsoft_graph", id: "AAD-object-id" },
    { system: "ldap", id: "uid=ada,ou=users,dc=kommune,dc=dk" },
    { system: "nextcloud", id: "42", path: "/ada/documents/report.pdf" }
  ],
  displayName: "Ada",
  enabled: true
}
```

Id-mapping-tabel i DB (plan) supplerer `externalRefs` for lookups ved høj volumen.

---

## Mapper-grænser

### Platform (inbound)

```typescript
interface PlatformInboundMapper<TPlatform> {
  platformId: PlatformId;   // "microsoft_graph"
  toCanonical(platform: TPlatform, ctx): CanonicalValue;
}

interface PlatformOutboundMapper<TPlatform> {
  platformId: PlatformId;
  toPlatform(canonical: CanonicalValue, ctx): TPlatform;
}
```

### Backend (outbound)

```typescript
interface BackendOutboundMapper {
  backendId: BackendId;     // "nextcloud"
  supports: CanonicalKind[] | CanonicalCommandOp[];
  toBackend(canonical: CanonicalValue, ctx): BackendPayload;
}

interface BackendInboundMapper {
  backendId: BackendId;
  fromBackend(backend: BackendPayload, ctx): CanonicalValue;
}
```

### Pipeline

```typescript
interface TranslationPipeline {
  platformToCanonical(platformId, platform, ctx): CanonicalValue;
  canonicalToBackend(backendId, canonical, ctx): unknown;
  backendToCanonical(backendId, backend, ctx): CanonicalValue;
  canonicalToPlatform(platformId, canonical, ctx): TPlatform;
}
```

Capability Engine vælger `backendId`; pipeline kører mappers.

---

## Backends (planlagt)

| Backend | Canonical domæner | Note |
|---------|-------------------|------|
| LDAP | identity | V1 |
| Nextcloud | files | V1 — WebDAV |
| ownCloud | files | Samme mapper-mønster som NC |
| CalDAV | calendar | V1 — kan sidde på NC |
| Open-Xchange | calendar + identity | Efter V1 |
| Google Workspace | identity + files + calendar | Platform **og** backend |

---

## Eksempel: GET /users/{id}

```
1. Fagsystem kalder Graph GET /users/{id}
2. PlatformInboundMapper → CanonicalUser
3. CapabilityEngine → backendId: "ldap"
4. BackendOutboundMapper → LDAP search by externalRef
5. BackendInboundMapper → CanonicalUser (beriget)
6. PlatformOutboundMapper → Graph JSON response
```

---

## Acceptkriterium V1

- [ ] Canonical JSON Schema for user, group, driveItem, calendarEvent
- [ ] Graph mappers for alle matrix-`native` identity/files/calendar routes
- [ ] Mindst én backend mapper per V1-backend (LDAP, NC, CalDAV)
- [ ] Contract test: golden Graph JSON ↔ canonical ↔ golden backend payload
- [ ] Ingen platform-imports i `backend/` og omvendt

---

## Deprecated aliases

`EiraUser`, `EiraEntity`, … re-exporteres fra `internal-model.ts` for bagudkompatibilitet.  
Nye filer skal bruge `Canonical*` navne.
