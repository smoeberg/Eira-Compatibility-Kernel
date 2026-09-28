# Fingerprint: kundens netværk til ECK SaaS

**Mål:** Kunden beholder rå API-trafik, adgangstokens og personhenførbare data i sit eget netværk. ECK SaaS modtager kun godkendte, aggregerede oplysninger om API-struktur og brug. Dette er målarkitektur, ikke en beskrivelse af den nuværende implementering.

## Kundens side: ECK Edge Collector

Kunden kører en lille, versioneret container eller VM i sin sikre netværkszone. Den kræver udgående HTTPS til ECK og den eksisterende API, men ingen indgående forbindelse fra ECK SaaS. Kunden vælger én af to integrationsformer:

1. **Pass-through proxy:** Kunden ændrer den konfigurerbare API-base-URL i udvalgte fagsystemer til collectorens interne adresse. Collector videresender kald og svar uændret til et på forhånd fastlåst upstream-origin. Bodies, tokens og persondata må kun gennemløbe hukommelsen til videresendelse, uden logging, disk, traces, crash dumps eller eksport. Denne form kræver kundens godkendelse, opdatering af endpointkonfiguration og test af TLS, OAuth audience, redirects og leverandørvilkår.
2. **Eksisterende gateway/instrumentering:** Hvis fagsystemets endpoint ikke kan ændres, modtager collector kun sikre metrics fra kundens egen API-gateway eller en instrumenteret klient. Krypteret TLS-trafik kan ikke kortlægges ved passiv observation uden adgang til et punkt, hvor trafikken allerede dekrypteres. Mangler et sådant punkt, må rapporten vise manglende dækning.

Collector har en lokalt godkendt, versioneret **route-registry** med kendte endpoints. Den afleder kun metode, godkendt rutemønster, tjenestekode, statusklasse, latenstidsinterval og antal. En ukendt sti eksporteres kun som `unknown_route_count` pr. tjeneste og metode; rå stier må ikke sendes som fallback. Kundens IT kan lokalt gennemgå og godkende nye, generiske rutemønstre.

**Almindelige netværksroutere er ikke kilden til API-ruter.** NetFlow/IPFIX eller firewall-flowlogs kan vise kilde, destination, port, tidspunkt og volumen, men giver normalt ikke HTTP-metode eller sti inde i HTTPS. De kan levere en særskilt oversigt over system-til-system-forbindelser efter lokal aggregering. API-struktur kræver en kontrolleret gateway, reverse proxy eller klientinstrumentering på et punkt, hvor kunden allerede behandler den dekrypterede trafik. TLS-inspektion alene for dette formål er ikke standarddesignet.

Collector tæller observationer i tidsvinduer (f.eks. én time) og sender batches udgående med en kundeunik klientidentitet over TLS. Køen lokalt skal være krypteret, begrænset og have kort levetid; ved eksportfejl må den ikke begynde at sende rå trafik. Collectorens diagnostiske logs må kun indeholde komponentstatus og antal, aldrig anmodningens indhold.

## Kontrakt for data til SaaS

Kun følgende felter er tilladt i fingerprint-batches; præcise navne fastlægges i et versioneret JSON Schema:

| Felt | Eksempel | Formål |
| --- | --- | --- |
| `schema_version`, `registry_version` | `1`, `2026-09` | Ens tolkning af data |
| `tenant_id`, `integration_id` | opaque interne UUID'er | Isolation og kilde på systemniveau; ingen bruger-id |
| `window_start` | hele timer i UTC | Sammentælling uden præcise kaldtidspunkter |
| `service_code`, `route_id` | `graph`, `users.read` | Godkendt struktur, ikke fuld URL |
| `method`, `status_class` | `GET`, `2xx` | Brugs- og fejlbillede |
| `latency_bucket_ms`, `count` | `100-500`, `37` | Volumen og performance |
| `unknown_route_count` | `4` | Dækning uden at eksponere ukendte stier |

**Afviste felter:** rå URL/sti/query, query-parameternavne og værdier, headers, cookies, authorization, request-/response-body, IP-adresser, bruger-/sags-/dokument-id'er, payload-hash, fritekst, præcise tidsstempler og vilkårlige ekstra felter. Aggregeringsnøgler må ikke indeholde personer. Små grupper samles i grovere tidsvinduer eller undertrykkes efter en dokumenteret tærskel; tærsklen valideres mod kundens faktiske data.

## Vores Kubernetes SaaS

1. **Ingestion Gateway** autentificerer kundens collector (kortlivede certifikater eller tilsvarende stærk maskinidentitet), sætter tenant-kontekst fra identiteten, håndhæver rate- og størrelsesgrænser og tillader kun et versioneret skema med `additionalProperties: false`. `tenant_id` i payload er kun et krydstjek, aldrig autoritativt.
2. **Privacy validator** afviser ukendte felter, ukendte `route_id`-værdier, fritekst, usædvanligt små grupper og ugyldige intervaller. Afviste payloads lagres ikke i logs eller dead-letter-kø. Sikkerhedstelemetri tæller afvisninger uden at bevare indholdet.
3. **Aggregation worker** beregner tenant-afgrænsede opsummeringer og rapportversioner. PostgreSQL indeholder kun de tilladte aggregater; adgang kontrolleres på brugerrolle og tenant ved hver forespørgsel. Krypteret backup og slettefrister er en del af driftskontrakten.
4. **Portal/BFF** viser rapporter til kundens autoriserede brugere. Rå trafik har aldrig en vej til portal, rapport, observability eller supportværktøjer.

## Rapporter

| Rapport | Indhold | Begrænsning |
| --- | --- | --- |
| API-inventar | Tjenester, godkendte ruter, metoder, volumener og perioder | Viser kun observeret trafik |
| Afhængigheder | Hvilke registrerede fagsystemer der kalder hvilke tjenester og route-familier | Viser ikke brugere eller individuelle sager |
| Kompatibilitet | Observeret rute sammenholdt med **verificeret** capability: implementeret/testet, delvist, ikke understøttet, ukendt | `native` må ikke komme fra en planlagt adapter; ingen grøn migrationsanbefaling uden test og tilstrækkelig dækning |
| Risici og prioritet | Ukendte ruter, fejlklasser, høj volumen, latenstid og nødvendige proof-of-concepts | Skelner måleusikkerhed fra teknisk inkompatibilitet |
| Datagrundlag | Integrationsform, observationsperiode, antal kald, dækningsgrad, datatab og registry-version | Oplyser eksplicit om systemer der ikke kunne observeres |

En PDF kan genereres fra samme versionerede rapportdata. Resultatet er et beslutningsgrundlag for videre test, ikke en attest for at et fagsystem kan migreres.

## Kontrol før pilot

- Test med syntetisk trafik, at bodies, tokens, person-id'er, fulde stier og query-strenge aldrig krydser kundegrænsen; test også fejl, debug-logs, kø, telemetry og crash dumps.
- To tenants skal være isoleret i ingestion, database, portal, backup og rapporter. Afprøv forkert klientcertifikat og falsk `tenant_id`.
- Verificer præcis hvilke fagsystemer der kan ændre API-endpoint og fortsætte normal auth/TLS. Den lokale collector må ikke blive et nyt single point of failure; mål latency, kø og fail-closed-adfærd.
- Dokumenter formål, roller, databehandleraftale, slettefrister og eventuelt behov for konsekvensanalyse med kunden før egentlig trafik. Metadata kan stadig være personoplysninger afhængigt af kontekst; en teknisk filtrering er ikke i sig selv et juridisk bevis for anonymitet.
