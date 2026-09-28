# Nextcloud — backend mapper (outbound)

**Retning:** **Canonical Model** → WebDAV / OCS

Same canonical `CanonicalDriveItem` serves Nextcloud, ownCloud, and any WebDAV backend —
only this mapper changes.

```
mappers/
├── drive-item.get.ts
├── drive-item.put.ts
└── drive-item.delete.ts
```

Se [ECK_Translation_Layer_v0.2.md](../../../../docs/specs/ECK_Translation_Layer_v0.2.md).
