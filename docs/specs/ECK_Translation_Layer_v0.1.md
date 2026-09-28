# ECK Translation Layer v0.1

**Status:** Spec + scaffold  
**Relateret:** [ECK_MATURITY_AUDIT_v0.1.md](../ECK_MATURITY_AUDIT_v0.1.md), kernel LAG 2

---

## Flow

```
┌─────────────────┐     RequestMapper      ┌──────────────────┐
│ Platform API    │ ─────────────────────► │ Eira internal    │
│ (Graph-like)    │                        │ model            │
└─────────────────┘                        └────────┬─────────┘
        ▲                                           │
        │              ResponseMapper               ▼
        └────────────────────────────────  Backend adapter
```

---

## Intern model

Canonical types i `@eck/translation`:

- `EiraUser`, `EiraGroup`, `EiraGroupMember`
- `EiraDriveItem`
- `EiraCalendarEvent`
- `EiraEntity` — tagged union

JSON Schema per entity under `packages/translation/src/schema/` (starter med `user.v0.json`).

---

## Interfaces

```typescript
interface RequestMapper<TPlatform> {
  toInternal(platform: TPlatform, ctx: TranslationContext): EiraEntity | EiraEntity[];
}

interface ResponseMapper<TPlatform> {
  toPlatform(internal: EiraEntity | EiraEntity[], ctx: TranslationContext): TPlatform;
}

interface RouteMapper<TPlatform> {
  pattern: string;       // "/users/{id}" — samme syntax som capability matrix
  methods: string[];     // ["GET"] or ["*"]
  request?: RequestMapper<TPlatform>;
  response?: ResponseMapper<TPlatform>;
}
```

Registry: `InMemoryTranslationRegistry` — pattern match via `@eck/fingerprint` `patternToRegex`.

---

## Mapper-placering (plan)

```
packages/translation/
├── src/
│   ├── internal-model.ts
│   ├── mapper.ts
│   ├── registry.ts
│   ├── schema/
│   └── mappers/          # TODO V1
│       ├── graph/
│       │   ├── users.get.ts
│       │   └── drive-items.get.ts
│       └── errors/
│           └── graph-error.ts
```

---

## Complexity hotspots (forventet)

| Område | Risiko | Mitigering |
|--------|--------|------------|
| Pagination (`@odata.nextLink`) | Høj | Normaliser til cursor i internal model |
| Delta sync | Høj | Udskudt — ikke V1 |
| Fil-lås | Medium | Compatibility Layer før translation |
| Fejlformater | Medium | Central `GraphErrorMapper` |
| Id-mapping (platform id ↔ backend id) | Høj | `externalId` + tenant-scoped id-map tabel |

---

## Acceptkriterium V1

- [ ] ≥ 80% af matrix `native` routes har request+response mapper
- [ ] Contract test: golden files Graph JSON ↔ internal model
- [ ] Schema validation på internal model ved adapter-grænse
