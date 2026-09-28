# DEPRECATED — PHP BFF

> **Status:** Deprecated fra juli 2026. Brug [`apps/bff`](../../../apps/bff) (NestJS) i stedet.

---

## Hvorfor deprecated?

| PHP på Simply | NestJS BFF på Hetzner |
|---------------|----------------------|
| To runtimes (PHP + TS) | Én TypeScript-stack |
| Duplikeret signatur/OIDC-kode | Delt `@eck/bff-core` med API |
| Manuelt deploy til webhotel | Samme CI/CD som API |
| Shared hosting constraints | Fuld kontrol (session, proxy, logs) |

PHP-koden **fjernes ikke endnu** — den kan bruges som nødfallback indtil NestJS BFF er deployet.

---

## Migration

1. Deploy `apps/bff` på Hetzner — se [infra/DEPLOY_BFF.md](../../../infra/DEPLOY_BFF.md)
2. Peg `eck.eira-systems.eu` DNS til Hetzner (ikke Simply)
3. Opdatér Entra redirect URI (samme URL — ingen ændring hvis host uændret)
4. Fjern `/proxy` fra Simply
5. Slet denne mappe når pilot er verificeret

---

## Reference

Oprindelig spec: [ECK_BFF_Identity_v0.1.md](../../../docs/specs/ECK_BFF_Identity_v0.1.md)
