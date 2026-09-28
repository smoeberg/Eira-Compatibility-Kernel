# LDAP Adapter

| | |
|---|---|
| **Maturity** | 0% — stub |
| **Target** | OpenLDAP / 389 DS / AD via LDAP |
| **V1 scope** | Users, groups, members — CRUD |
| **Blocks sales?** | Ja for fuld migrering; nej for fingerprint wedge |

## Planned surface

- `searchUsers`, `getUser`, `createUser`, `updateUser`, `deleteUser`
- `searchGroups`, `getGroup`, `createGroup`, `addMember`, `removeMember`

## Dependencies

- `@eck/translation` — `EiraUser`, `EiraGroup`
- `@eck/capability` — routes `identity` category → `ldap`

## Next step

Implement against testcontainer OpenLDAP + contract tests mod Graph `/users` shapes.
