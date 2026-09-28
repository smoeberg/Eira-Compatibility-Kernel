# ECK som Kubernetes-baseret SaaS

**Beslutning:** ECK leveres som multitenant SaaS på Kubernetes. Fingerprint i fase A bruger en [Eira-hostet pass-through-proxy uden installation hos kunden](FINGERPRINT_DATA_FLOW.md). Kommune-IT ændrer kun API-base-URL i de fagsystemer, der tillader det. Eksisterende Compose- og Simply/Hetzner-vejledninger beskriver tidligere forslag eller udvikling, ikke en produktionsklar Kubernetes-udrulning.

## Produkt og datagrænse

- **Fase A:** Fagsystem → ECK's tenant-specifikke HTTPS-proxy → oprindelig API. Rå trafik passerer ECK i hukommelsen, men kun tilladte strukturaggregater må gemmes og rapporteres. Ingen lokal ECK-agent, DNS-ændring eller generel TLS-inspektion hos kunden.
- **Fase B:** Oversættelse via kanonisk model og konkrete adaptere er et særskilt leverancemål. En planlagt adapter må ikke regnes som testet kompatibilitet i fase A.
- Hvis kunden kræver, at rå trafik aldrig når ECK, er en hosted pass-through-proxy ikke den rigtige metode. Det kræver eksport af rensede metadata fra en eksisterende kundegateway eller en lokal komponent.

## Logisk topologi

| Del | Kubernetes-arbejdsbyrde | Adgang |
| --- | --- | --- |
| HTTPS-gateway | Gateway API-controller med wildcard TLS | `eck.<domæne>` til portal, `*.fp.<domæne>` til proxy |
| Portal | Admin SPA og BFF som separate Deployments | OIDC og tenant-roller; BFF til intern API |
| Fingerprint-dataplan | Dedikeret proxy Deployment og Service | Offentlig tenant-host, låst upstream-origin, rensning før lagring |
| Kontrolplan | Intern API Deployment | Kun ClusterIP og eksplicit tilladte interne kald |
| Asynkront arbejde | Worker Deployment og kø | Rapporter, periodestop og sletning |
| Data | PostgreSQL og krypteret rapportlager | Tenant-afgrænset, privat adgang, backup/restore |

Clusteret skal have en Gateway API-implementering, DNS/TLS-automatisering, en CNI der håndhæver NetworkPolicy, og overvågning. Vælg konkret leverandør og EU-region ved implementering. Kubernetes leverer ikke applikationens tenant-isolation, privacy-filtre eller upstream-sikkerhed automatisk.

## Sikkerhed og drift

1. Brugerens OIDC-identitet bindes serverside til tenant-roller. Hver API-forespørgsel kontrollerer handling og tenant. `tenantId` eller `runId` fra klienten giver ikke adgang alene. Delte Kubernetes namespaces er ikke en tilstrækkelig tenant-sikkerhedsgrænse.
2. Fingerprint-proxyen accepterer kun det godkendte tenant-hostname og upstream-origin. Afvis absolute og `//`-URL'er, private metadata-/clusteradresser, redirects til nyt origin og DNS-skift til forbudte adresser. Brug kontrolleret egress og applikationsvalidering.
3. Default-deny netværkspolitik, præcise service-adgange, ressourcegrænser, streaming, timeouts og rate limits. Maskinidentiteter og secrets roteres; ingen produktionsnøgler i Git eller image. Sessioner og kø overlever pod-restart.
4. Ingen rå query-strenge, bodies, tokens, headers eller ID'er i fingerprint-DB, logs, traces, metrics, kø, rapporter eller backups. Gennemgå også gateway, WAF og fejlhåndtering. Definer retention, sletning og adgangsaudit.
5. Images versionlåses i CI. Staging og produktion har særskilte data. Database-migreringer køres eksplicit før rollout. Kundevendte workloads har readiness, kontrolleret rollback og testet backup/restore.

## Leverancer i rækkefølge

1. Reparer tomme manifests, moduler, services og migrationer; få `pnpm install`, build og tests grønne.
2. Luk proxyens destination/egress-risiko, tenant-adgangskontrol og dataminimering. Verificer ét fingerprint-run ende til ende med syntetisk trafik.
3. Adskil proxy fra intern API, implementer worker/kø, og opret Kubernetes-ressourcer samt staging-pipeline.
4. Kør sikkerheds-, belastnings- og restore-test. Først derefter kan fase A piloteres. Fase B valideres separat per adapter.

**Acceptkriterium:** En autoriseret kunde kan konfigurere ét fagsystems API-base-URL, gennemføre en syntetisk analyse via ECK-hostet HTTPS-proxy, få en rapport og få aggregater slettet efter aftalt periode. Rå indholdsværdier må ikke kunne findes i ECK's persistente systemer, og en anden tenant må ikke læse eller påvirke analysen.
