# ECK — Deploy Simply (marketing zone only) v0.3

> **v0.5:** Admin + BFF flyttes til Hetzner (`apps/bff`). Simply hoster **kun WordPress** på `eira-systems.eu`.  
> Se [WEBSITE_CMS_INTEGRATION_v0.5.md](../docs/WEBSITE_CMS_INTEGRATION_v0.5.md). PHP BFF: [DEPRECATED](../integrations/simply/proxy/DEPRECATED.md).

---

## Domæner (Simply)

| Host | Mappe |
|------|-------|
| `eira-systems.eu` | `public_html/` (WordPress) |

`eck.eira-systems.eu` peger nu til **Hetzner** — ikke Simply.

---

## WordPress

- Plugin: `integrations/wordpress/eck-fingerprint` — shortcode
- Menu: «Kunde-login» → `https://eck.eira-systems.eu`

---

## Deprecated (fjernes efter migration)

- React admin på Simply
- PHP BFF i `integrations/simply/proxy/`

Se [DEPLOY_BFF.md](DEPLOY_BFF.md) for ny portal-deploy.
