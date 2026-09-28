# Fingerprint uden installation i kundens netværk

**Beslutning:** Fase A bruger en Eira-hostet pass-through-proxy i Kubernetes. Kommunen installerer ikke en agent eller collector. For et fagsystem med konfigurerbar API-base-URL ændrer kommune-IT kun dette felt til `https://{tenant}.fp.eira-systems.eu`. ECK videresender kaldet til den aftalte oprindelige API og analyserer mønstre i trafikken. Der er ingen ændring af kommunens DNS og ingen generel TLS-inspektion. Dette er målarkitektur; den nuværende repo-kode er ikke klar til kundetrafik.

## Forløb

1. Kommune-IT opretter tenant og analyseperiode i portalen. ECK låser et upstream-origin til netop denne integration og udsteder proxy-URL.
2. Fagsystemet kalder ECK-proxyen over HTTPS. Rå anmodninger, tokens og eventuelle persondata **passerer ECK's server i hukommelsen**, fordi serveren er proxy. ECK videresender request og response til/fra den oprindelige API.
3. En privat observationskomponent udleder kun godkendte metadata: tidsvindue, tjenestekode, metode, godkendt rutemønster, statusklasse, latenstidsinterval og antal. Rå body, fuld URL, query, headers, cookies, bruger-/sags-/dokument-id'er, payload-hash og IP må ikke indgå i fingerprint-databasen, rapporter, køer, traces, access-/fejllogs eller backups.
4. Aggregater gemmes tenant-afgrænset; en rapportworker beregner inventar, dækning, gaps og anbefalinger. Rå trafik gemmes ikke til senere analyse. Ukendte paths tælles som `unknown_route_count`; de lagres ikke som tekst.

**Vigtig datagrænse:** Uden installation hos kunden kommer rå trafikken frem til ECK, før vi kan filtrere den. Kravet kan derfor være **'intet råt eller personhenførbart trafikindhold lagres hos os'**, ikke 'rå trafik når aldrig vores server'. Hvis sidstnævnte er et ufravigeligt krav, kræver det en eksisterende kundegateway, som eksporterer rensede metadata, eller en lokal komponent. Ingen af de muligheder er den valgte standardmetode.

En ændring af API-base-URL er mulig kun for systemer hvor endpoint kan konfigureres, og hvor TLS, OAuth token audience, redirects og leverandørvilkår fortsat fungerer. Et hardcoded API-endpoint kan ikke kortlægges ved denne metode uden en anden integration. Almindelige netværksrouteres flowlogs kan supplere med systemforbindelser og volumen, men viser normalt ikke HTTP-metoder og API-ruter i HTTPS.

## Kubernetes SaaS

| Komponent | Ansvar |
| --- | --- |
| Gateway med wildcard TLS | Ruter `*.fp.<domæne>` til fingerprint-proxy og `eck.<domæne>` til admin/BFF |
| Fingerprint-proxy | Tenant-host til fastlåst upstream-origin, streaming passthrough, grænser, timeout og ingen rå access logs |
| Strukturprocessor | Allowlist af godkendte ruter og aggregering; ingen rå trafik til DB eller kø |
| Intern API og worker | Tenant-autorisation, analyseperioder, rapportberegning og sletning |
| PostgreSQL/rapportlager | Kun aggregerede, afgrænsede data og separat nødvendige konto-/auditdata |

Proxyen må ikke følge absolute eller `//`-stier til en anden vært, sende tokens til redirects uden for upstream-origin eller kalde private metadata-/clusteradresser. Egress begrænses ved netværkskontrol og applikationsvalidering. Sundhed, logs, APM og WAF skal gennemgås: en app kan undlade at gemme rå data, mens en gateway eller fejllog stadig opbevarer dem.

## Data og rapporter

Et tilladt aggregat er fx: `tenant_id`, `integration_id`, timevindue, `GET`, route-id `users.read`, `2xx`, latenstidsinterval `100–500 ms`, `count=37`, registry-version. Tenant fastsættes fra autentificeret kontekst; indgående data valideres mod et lukket skema. Ukendte ruter sendes til lokal/manuel rutegodkendelse uden at eksponere rå stier i rapporten.

| Rapport | Indhold | Forbehold |
| --- | --- | --- |
| API-inventar | Tjenester, metoder, kendte ruter og volumen | Kun observerede og konfigurerbare integrationer |
| Afhængigheder | Hvilket fagsystem bruger hvilke API-familier | Ikke person- eller sagsniveau |
| Kompatibilitet | Verificeret implementeret/testet, delvist, gap, ukendt | Planlagte adaptere tæller ikke som `native` |
| Risici | Ukendte ruter, statusklasser, latenstid og driftsfejl | Ingen automatisk godkendelse af migration |
| Datagrundlag | Dækning, analyseperiode, datatab og registry-version | Ukendte/hardcoded endpoints oplyses særskilt |

PDF kan fremstilles fra de samme versionerede rapportdata. Rute/volumenkombinationer kan stadig være personhenførbare i små miljøer, og admin-login kræver egne persondata. Derfor kræver designet konkrete retention-regler, aftalegrundlag og vurdering af reidentifikation før kundepilot.

## Før første pilot

- Reparer de tomme pakke-manifests, opstartsmoduler, run-service og migrationer; få build og end-to-end test grøn.
- Test med syntetiske persondata og tokens, at ingen rå værdier findes i DB, logs, traces, kø, rapport, backups eller fejlscenarier.
- Test tenant-isolation, forkert Host, `//`/absolute URL, redirects, DNS-skift, body-størrelse, streaming, afbrudt upstream og rollback.
- Test én konkret kundes konfigurerbare API-base-URL og auth-forløb, før produktet beskrives som installationsfrit for denne integration.
