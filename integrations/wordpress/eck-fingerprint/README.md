# WordPress — kun marketing (eira-systems.eu)

**Ingen BFF. Ingen API-nøgle. Ingen admin.**

| Komponent | Hvor |
|-----------|------|
| Shortcode CTA | `public_html` WordPress |
| Admin + BFF | `eck.eira-systems.eu` — se [integrations/simply/proxy/](../../integrations/simply/proxy/) |

Admin: `https://eck.eira-systems.eu`

## Krav

- WordPress 6.0+
- PHP 8.1+
- **Ingen** ECK API-nøgle nødvendig på marketing-sitet (kun shortcode)

## Installation (marketing)

1. Kopiér mappen til `wp-content/plugins/` på **eira-systems.eu**
2. Aktivér plugin
3. Brug shortcode på salgssider — **ignorér** WP Admin → ECK (kun dev-fallback)

## Salg (offentlig side)

```
[eck_fingerprint_cta]
```

```
[eck_fingerprint_cta title="Fingerprint analyse" url="/kontakt/" price="25.000 kr."]
```

Link «Kunde-login» i menu: `https://eck.eira-systems.eu`

## Admin (produktion)

Brug **ikke** dette plugins WP-admin UI i produktion.

| Funktion | Hvor |
|----------|------|
| Opret tenant, start run, rapport | `eck.eira-systems.eu` |
| API | `api.eck.eira-systems.eu` |

PHP-admin i pluginet findes kun som tidlig dev-fallback og kan fjernes i v0.2.
