# ECK — Firewall rules (Hetzner)

**Hård regel:** Browser → BFF (`eck.*`) → API (`api.*`). **Ingen browser → API.**

---

## Zone model

| Zone | Hosts | Offentlig |
|------|-------|-----------|
| **Portal** | `eck.eira-systems.eu` | Ja — browser |
| **Data API** | `api.eck.eira-systems.eu` | **Nej** — kun S2S |
| **Fingerprint** | `*.fp.eira-systems.eu` | Ja — fagsystem |

---

## Hetzner Cloud Firewall — `api.eck`

| Direction | Port | Source | Action |
|-----------|------|--------|--------|
| Inbound | 443 | `10.0.0.0/8` (docker/private) | Allow |
| Inbound | 443 | BFF server private IP | Allow |
| Inbound | 443 | Ops/drift IP (VPN) | Allow |
| Inbound | 443 | `0.0.0.0/0` | **Deny** |
| Outbound | * | * | Allow |

> I Docker Compose på én host: API port 3000 bindes kun til `127.0.0.1` eller docker-net — Caddy/BFF når den internt.

---

## Hetzner Cloud Firewall — `eck` (portal)

| Direction | Port | Source | Action |
|-----------|------|--------|--------|
| Inbound | 443 | `0.0.0.0/0` | Allow |
| Inbound | 80 | `0.0.0.0/0` | Allow (redirect → HTTPS) |

---

## Hetzner Cloud Firewall — `*.fp`

| Direction | Port | Source | Action |
|-----------|------|--------|--------|
| Inbound | 443 | `0.0.0.0/0` | Allow (senere: kommune IP-ranges) |

---

## Caddy (applikationslag)

`api.eck` **må ikke** have public admin routes. Kun:

- `/health` (kan begrænses til intern)
- `/internal/*` (S2S)
- Fingerprint middleware på `*.fp`

Admin `/api/v1/*` accepteres kun med `X-ECK-Service-Id: bff`.

---

## Verifikation

Fra offentlig internet (skal fejle):

```bash
curl -s -o /dev/null -w "%{http_code}" https://api.eck.eira-systems.eu/api/v1/tenants
# Forventet: timeout / connection refused / 403
```

Fra BFF-host (skal virke med service token):

```bash
curl -s -H "Authorization: Bearer $ECK_SERVICE_TOKEN" \
     -H "X-ECK-Service-Id: bff" \
     http://127.0.0.1:3000/health
```

---

## IaC

Terraform-skabelon: roadmap i [ECK_PLATFORM_GOVERNANCE_v0.1.md](../docs/ECK_PLATFORM_GOVERNANCE_v0.1.md) P2.
