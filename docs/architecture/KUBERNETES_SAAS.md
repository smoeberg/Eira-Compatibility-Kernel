# ECK som Kubernetes-baseret SaaS

**Beslutning:** ECK leveres som en multitenant SaaS på Kubernetes. Denne beskrivelse er målbilledet; den nuværende kode og de eksisterende Compose-filer er ikke en produktionsklar Kubernetes-udrulning. Ældre vejledninger om Simply/Hetzner og enkeltserverdrift beskriver tidligere forslag.

## Produktgrænse

- **Fase A – Fingerprint:** Kommunens administrator opretter et tenant og en tidsafgrænset analyse. Kommunens fagsystem konfigureres til at bruge en tenant-specifik proxy-URL. Proxyen videresender trafikken til den aftalte oprindelige tjeneste og registrerer kun godkendte metadata. En worker afslutter analysen og genererer en rapport.
- **Fase B – Runtime:** Platform-API oversættes via en kanonisk model til konkret implementerede adaptere. Fase B er et separat leverancemål og må ikke tælle som understøttet i fase A's score, før det er verificeret.
- Kommunen ændrer normalt fagsystemets API-base-URL; det er stadig en teknisk ændring hos kunden. ECK administrerer sin egen wildcard-DNS og TLS. Løsningen må ikke love, at alle fagsystemer kan ændre endpoint.

## Logisk topologi

| Del | Kubernetes-arbejdsbyrde | Adgang |
| --- | --- | --- |
| Offentlig gateway | Gateway API-controller og HTTPS-listeners | `eck.<domæne>` til portal; `*.fp.<domæne>` til fingerprint |
| Portal | Admin SPA og BFF som separate Deployments | Kun BFF taler med intern API; OIDC-session for admin |
| Fingerprint-dataplan | Dedikeret proxy Deployment og Service | Kun tenant-hostnames; videresendelse til godkendt upstream |
| Kontrolplan | Intern API Deployment | ClusterIP; ingen offentlig API-host som standard |
| Asynkront arbejde | Worker Deployment med kø | Afslutning, rapport, sletning og genforsøg |
| Data | PostgreSQL og krypteret rapportlager | Privat netværk, backup og restore-test |

Clusteret skal have en Gateway API-implementering, DNS/TLS-automatisering, en CNI der håndhæver NetworkPolicy, og overvågning. Kubernetes leverer ikke disse komponenter eller deres sikkerhedsregler automatisk. Vælg konkret leverandør og EU-region ved implementering.

## Tenants og sikkerhed

1. OIDC-identitet knyttes på serversiden til eksplicitte tenant-roller. Hver API-forespørgsel kontrollerer både handling og tenant; et `tenantId` eller `runId` fra klienten giver aldrig adgang alene. Databaseforespørgsler afgrænses til tenant. Afprøv isolation mellem to tenants i integrationstest.
2. En delt applikations-namespace er acceptabel til første SaaS-version, hvis der er dokumenteret adgangskontrol og dataseparation. Namespace alene er ikke en tenant-sikkerhedsgrænse. Kunder med krav om stærkere isolation kan senere få separat database eller dedikeret installation.
3. Fingerprint-proxyen accepterer kun den aftalte tenant-host og et valideret, fastlåst upstream-origin. Afvis absolute og `//`-URL'er, private metadata-/clusteradresser, omdirigering til nyt origin og DNS-skift til forbudte adresser. Begræns egress via en kontrolleret proxy/firewall; almindelig NetworkPolicy kan ikke alene udtrykke en sikker FQDN-allowlist.
4. Brug default-deny ingress/egress og præcise tilladelser mellem gateway, BFF, API, worker og database. Signer/valider servicekald og bind bruger, roller, tenant, metode og sti til samme verifikation. Begræns requeststørrelse, samtidighed og tidsforbrug for proxyen.
5. Hemmeligheder leveres via en etableret secret manager/integration. Krypter Kubernetes Secrets i kontrolplanet, begræns RBAC, og læg aldrig produktionsnøgler i Git, images eller ConfigMaps. Sessioner og kø må ikke afhænge af én pods lokale hukommelse.
6. Definer dataminimering før kundetrafik: ingen query-strenge, bodies, bearer tokens eller vilkårlige headers i fingerprint-loggen. Brug allowlist over metadata. Fastlæg retention, automatisk sletning, audit, backup og restore som testbare krav.

## Drift og udrulning

- Versionslåste images bygges i CI og deployes med en versionsstyret Helm chart eller Kustomize-overlays. Miljøerne `dev`, `staging` og `prod` har særskilte credentials og data.
- Deployments har readiness/liveness, ressourcegrænser, mindst to replikaer for kundevendte komponenter og kontrolleret rollout/rollback. Skalering af proxy/API baseres på observeret belastning; workers på kølængde. Databasekapacitet og upstream-rategrænser skalerer ikke automatisk med pods.
- Database-migreringer køres som en eksplicit, idempotent release-opgave før nye pods modtager trafik. Rapporter og rådata har særskilte retention-regler. Audit, metrics og traces må ikke indeholde følsomme request-data.
- En staging-test skal dække onboarding, tenant-isolation, en fuld fingerprint-run, rapport, sletning, restart/rollback, upstream-fejl og restoration fra backup. Ingen produktion med kommunal trafik før disse tests er grønne.

## Leverancer i rækkefølge

1. Reparer tomme manifests, moduler, services og migrationer; få `pnpm install`, build og tests grønne. Et deploy-manifest kan ikke kompensere for en app, der ikke starter.
2. Luk proxyens destination/egress-risiko, tenant-adgangskontrol og dataminimering. Gør én fingerprint-run testbar ende til ende med syntetisk trafik.
3. Adskil fingerprint-proxy fra API, implementér worker/kø og sessionlager, og opret Kubernetes-ressourcer samt staging-pipeline.
4. Kør sikkerheds-, belastnings- og restore-test. Først derefter kan fase A piloteres som SaaS. Fase B kræver særskilt validering af hver adapter.

**Acceptkriterium for fase A:** En autoriseret kommune kan starte en analyse, sende syntetiske kald via sin HTTPS-proxy, hente en rapport, og få sine data slettet efter aftalt periode; en anden kommune kan hverken læse, ændre eller påvirke dens run. Systemet skal fortsætte gennem pod-restart og dokumentere backup/restore.
