# ECK Canonical Model v0.1

**Status:** Normativ — `@eck/translation/src/canonical/`  
**Relateret:** [ECK_Translation_Layer_v0.2.md](ECK_Translation_Layer_v0.2.md), [ECK_Core_Architecture_v0.1.md](ECK_Core_Architecture_v0.1.md)

---

## Formål

Én **platform- og backend-neutral** datamodel som hub.  
Alle adaptere og platform-mappers oversætter **til og fra** denne model — aldrig direkte til hinanden.

---

## Entiteter

### CanonicalUser

Directory-bruger — profil, mail, enabled.  
Graph `user`, LDAP `inetOrgPerson`, Google `User` → her.

### CanonicalIdentity

Auth-principal — adskilt fra User.  
Login-navn, principalType (`user` | `service` | `application`), authSources (`ldap`, `oidc`, …).  
Entra OIDC, LDAP bind, service accounts → her.

### CanonicalFile

Filer og mapper — `kind: "file" | "folder"`.  
Graph driveItem, Nextcloud WebDAV, S3 object → samme type.

### CanonicalCalendarEvent

Kalenderbegivenhed — start/end, organizer, location.

### CanonicalMailMessage / CanonicalMailbox

Mail — V1+ / Open-Xchange.  
Exchange, Graph mail, OX → canonical mail (planlagt).

### CanonicalPermission

ACL — subject (user/group/identity) + resource + role (`owner`, `write`, `read`, …).  
Graph permissions, NC shares, LDAP group membership for adgang → her.

### CanonicalGroup / CanonicalGroupMembership

Grupper og medlemskab — identity-domænet.

---

## Identitet på tværs af systemer

```typescript
interface CanonicalEntityBase {
  id: CanonicalId;              // ECK-intern UUID — stabil gennem migration
  externalRefs: ExternalRef[];    // { system, id, path? }
  createdAt?: IsoDateTime;
  modifiedAt?: IsoDateTime;
}
```

Eksempel — samme bruger set fra tre systemer:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "externalRefs": [
    { "system": "microsoft_graph", "id": "aad-object-id" },
    { "system": "ldap", "id": "uid=ada,ou=users,dc=kommune,dc=dk" },
    { "system": "nextcloud", "id": "42" }
  ],
  "displayName": "Ada Kommune",
  "enabled": true
}
```

---

## Commands (writes)

Mutationer udtrykkes som `CanonicalCommand` — uafhængig af Graph PATCH vs LDAP modrdn:

- `identity.user.create` / `update` / `delete`
- `identity.principal.create`
- `files.item.create` / `update` / `delete`
- `calendar.event.*`
- `mail.message.*`
- `permission.grant` / `revoke`

---

## JSON Schema

`packages/translation/src/schema/canonical/` — én schema fil per entity (V1 mål).

---

## Regler

1. **Ingen platform-felter** (`@odata`, `driveId`, LDAP DN) i canonical types — kun i mappers.
2. **Ingen backend-felter** (WebDAV etag format, S3 bucket key) i canonical types.
3. **Ny entity** kræver arkitektur-review — undgå domæne-lækage.
4. **Permission** bruges til RBAC og fil-shares — ikke dupliker adgang i User.

---

## TypeScript

```typescript
import {
  CanonicalUser,
  CanonicalFile,
  CanonicalCalendarEvent,
  CanonicalMailMessage,
  CanonicalIdentity,
  CanonicalPermission,
  CanonicalEntity,
  CanonicalValue,
} from "@eck/translation";
```

Deprecated aliases: `EiraUser`, `EiraDriveItem` → brug `Canonical*`.
