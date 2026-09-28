# Guidet setup og reversibel fingerprint-analyse

**Status:** Målkrav for fase A; ikke en implementeret funktion. Gælder ét fagsystem/integration ad gangen. Ingen agent installeres hos kunden. Se [dataflowet](FINGERPRINT_DATA_FLOW.md) for proxy og privacy-grænse.

## Grundregel

Kommune-IT ændrer en konfigurerbar API-base-URL til ECK's tenant-specifikke HTTPS-proxy. En vellykket proxy-healthcheck beviser kun, at ECK svarer; den beviser hverken, at fagsystemet har ændret sin konfiguration, eller at original-API'et virker. En vellykket fagsystemtransaktion gennem proxyen skal verificeres særskilt med syntetiske data og et upstream-svar.

Det er **observationsperioden**, der udløber automatisk. Proxyens passthrough må ikke slukkes ved udløb, så længe kunden stadig peger på den. Efter udløb videresender proxyen uden fingerprint-lagring, indtil kunden har rullet ændringen tilbage eller en aftalt nødprocedure er gennemført.

## Tilstande pr. integration

| Tilstand | Indgang | Hvad systemet gør | Næste tilstand |
| --- | --- | --- | --- |
| `draft` | Eira/kunde vælger fagsystem og miljø | Tjekker dokumenteret ændring af base-URL, TLS/auth og ansvarlig kontakt | `ready` eller `unsupported` |
| `ready` | Upstream-origin låst, godkendt testplan og rollback-værdi registreret | Genererer kopierbar proxy-URL; ingen trafik forventes endnu | `awaiting_traffic` |
| `awaiting_traffic` | Kunde har gemt ny base-URL i fagsystemet | Viser proxy-health separat fra trafikindikator; venter på forventet transaktion | `trial` eller `rollback_pending` |
| `trial` | Fagsystemkald set **og** upstream-svar kontrolleret | Kort tidsafgrænset prøvekørsel med syntetiske data; viser fejl/volumen/dækning | `active` efter eksplicit godkendelse eller `rollback_pending` |
| `active` | Kunden godkender prøvekørsel og starttid | Tidsafgrænset fingerprint-lagring; passthrough fortsætter | `passthrough_only` ved udløb/stop, eller `incident` |
| `passthrough_only` | Analyse stoppet eller udløbet | Videresender stadig til upstream, men gemmer ikke fingerprint; viser påmindelse om rollback | `rollback_pending` |
| `rollback_pending` | Kunden får oprindelig base-URL og rollback-trin | Observerer om proxytrafik ophører; kunden verificerer en transaktion direkte mod upstream | `closed` eller `incident` |
| `closed` | Kunden bekræfter genoprettet base-URL og en vellykket direkte test | Arkiverer status/rapport efter retention-politik, fjerner proxy-route efter aftalt frist | — |
| `incident` | Fejlrate/latency grænse, forkert upstream eller manuel alarm | Stopper fingerprint, fastholder sikker passthrough hvis mulig, alarmerer ansvarlige og fremhæver kundens rollback | `rollback_pending` |
| `unsupported` | Endpoint hardcoded, auth/TLS uforenelig eller vilkår blokerer | Blokerer setup for denne metode; ingen proxy-route aktiveres | — |

Alle ændringer gemmer tid, integration, aktør, årsag og forrige/næste tilstand i auditloggen. Kun autoriseret tenant-admin kan starte/stoppe; Eira support har en særskilt, kontrolleret nødrolle. Overgange skal være idempotente og tåle pod-restart. `trial` og `active` må aldrig oprettes direkte fra en klient uden servervaliderede forudsætninger.

## Setup-skærm

1. Vælg konkret fagsystem og `test`/`production`. Ukendt eller udokumenteret fagsystem blokeres, indtil IT har godkendt en guide; generiske screenshots må ikke udgive sig for at være leverandørspecifikke.
2. Vis hvilken rolle hos kunden der ændrer API-feltet, præcis proxy-URL, låst oprindelig URL, ændringsvindue, supportkontakt og kundens rollback-ansvarlige.
3. Registrér den gamle base-URL som adgangsbegrænset konfiguration, så den kan kopieres ved rollback. Afvis URL'er med credentials i query/userinfo. Vis ikke denne værdi i generelle logs eller e-mails.
4. Guid kunden gennem en kendt syntetisk transaktion i fagsystemet. Marker særskilt: (a) proxyens egen health, (b) gyldigt kald modtaget på tenant-host, (c) upstream svarede, (d) kunden så forventet resultat.
5. Start først den betalte observationsperiode efter en vellykket trial og en eksplicit godkendelse.

## Signalregler og deres begrænsning

| Signal | Betydning og handling |
| --- | --- |
| Ingen kald efter konfigurationsændring | Mulig manglende ændring, inaktivt fagsystem eller forkert miljø. Vis **ukendt**, ikke automatisk fejl; bed kunden udføre testtransaktion. |
| Kald mod ukendt tenant-host | Returnér generisk fejl og tæl hændelsen uden rå path/token. ECK kan normalt ikke vide hvilken kunde der skrev forkert slug; support kræver kundens oplyste URL/tidspunkt. |
| Første gyldige kald | Viser at proxyen fik trafik; ikke at hele integrationen er dækket. Kræv test af upstream-svar og resultat. |
| Lavere volumen end forventet | Vis kun procent når kunden har en troværdig ekstern baseline for **samme** system og periode. Uden baseline vises observeret volumen og dækning som `ukendt`. |
| Kald både direkte og via proxy | Kan kun påvises hvis kunden stiller en særskilt, godkendt upstream-/gateway-måling til rådighed. ECK-proxyen kan ikke se direkte kald alene. |
| Trafik efter analysens udløb | Videresend fortsat uden fingerprint-lagring, vis `rollback_pending` og advar kontaktpersonen. Ingen automatisk netværksafbrydelse. |
| Ingen trafik efter rollback | Indikation, ikke bevis. Kunden skal bekræfte sin indstilling og teste at direkte kald virker. |

Tærskler for inaktivitet, fejlrate og latenstid vælges pr. integration ud fra syntetisk test og aftalt trafikmønster; ingen global `X minutter = rød`-regel. Fravær af trafik om natten kan være normalt. Statusmeddelelser sendes kun til udtrykkeligt konfigurerede modtagere og uden rå API-oplysninger.

## Nødstop og testkrav

Nødstop betyder **stop observation og hjælp til rollback**, ikke at slå proxyen fra mens fagsystemet stadig afhænger af den. En midlertidig passthrough uden lagring kan holde driften i gang, hvis upstream er tilgængelig. Ved proxyfejl må der ikke påstås automatisk failover, som ikke er implementeret og testet; kunden bruger den dokumenterede gamle URL. Test på staging skal dække syntetisk succes, ukendt tenant, forkert upstream, udløb, stop, pod-restart, manglende baseline, fortsat trafik efter udløb og rollback-bekræftelse.
