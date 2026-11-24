# Evidenskildeoversigt

**Status:** Udkast. Hører til [ADR-001](../decisions/ADR-001-office-centric-discovery.md) og må ikke læses uden denne.

**Formål:** At besvare ét spørgsmål entydigt, både internt og i et tilbud: *Hvad skal der være adgang til, godkendt og installeret i kommunen, for at ECK kan levere en foranalyse?*

Dokumentet er skrevet i overensstemmelse med ADR-001. Hvis der er uoverensstemmelser mellem de to, er det ADR-001, der er gældende.

## Det korte svar

Den primære kilde er et **Office-tilføjelse i Word og Excel**, som skal være installeret på de maskiner, der observeres. Der er altså tale om en installation — men en tidsbegrænset tilføjelse, der rulles ud centralt og kan afinstalleres centralt (**ECK-OCD-006**).

De øvrige kilder kræver ingen installation hos kommunen. Ingen af dem kræver installation på samtlige enheder, og de dækker ikke alle enheder.

Betegnelsen "installationsfri" må ikke bruges om foranalysen som helhed. Den må kun bruges om de enkelte kilder, hvor det er tilfældet, og altid i sammenhæng med, hvad der i stedet kræves godkendt.

## Kilder

Kolonnen **Niveau** angiver evidensniveauet fra ADR-001. Niveauet er en egenskab ved den enkelte observation, ikke ved kilden: en KQL-kørsel kan give både E1 og E2.

| Kilde | Hvor det kører | Kræver | Niveau | Første leverance |
| --- | --- | --- | --- | --- |
| Office-tilføjelse i Word og Excel | På de observerede klienter | Central udrulning, tidsbegrænsning, netværksmappe til småfiler. Ingen ændring af fagsystemer (ECK-OCD-001) | E3 | Ja, efter teknisk spike |
| Inventarscanning (PowerShell) | På klienterne via den eksisterende Intune-agent | Intune. Intet installeres | E1 | Ja |
| Graph, Purview, M365-brugsrapporter, Entra-apps | Centralt via API | App-registrering med læserettigheder og administratorsamtykke | E0, E1 | Ja |
| Skabeloner, Access, .xlsm | Mod kommunens filservere og SharePoint-biblioteker | At **kommunen selv** kører værktøjet. Eira installerer intet på servere (ECK-OCD-013) | E1 | Ja |
| Office-automation på servere | En håndfuld ESDH- og konverteringsservere | Samme PowerShell, kørt af kommunens drift. Ingen installation | E1, E4 | Ja |
| Layouttest | Én maskine eller container | Word og LibreOffice headless på samme maskine | E4, E5 | Ja |
| Kørselstest med Procmon | 1–2 testmaskiner | Administratorrettigheder under testen. Procmon er én exe, men indlæser en driver under kørsel | E4 | Ja |
| Defender/KQL | Centralt i Defender-portalen | Defender for Endpoint P2/E5 for proceshændelser med kommandolinje og forældreproces. Se nedenfor | E2 | Nej, valgfri |
| Windows-procesaudit (4688) med Event Forwarding | Alle klienter via GPO | En politikændring. Ingen ny software, men det påvirker alle klienter | E2 | Nej, valgfri |

### Inventarscanningens dækning af tilføjelser

Office-tilføjelser registreres ofte per bruger (`HKCU\Software\Microsoft\Office\Word\Addins`). Et Intune-script, der kører som SYSTEM, ser derfor kun maskinregistreringen, medmindre der gøres yderligere. Der er to måder at løse dette på, og tilbuddet skal præcisere, hvilken der anvendes:

1. **"Run this script using the logged on credentials".** Enkel løsning, men dækker kun den bruger, der er logget på maskinen på kørselstidspunktet.
2. **SYSTEM-script, der gennemgår `HKEY_USERS` og indlæser `NTUSER.DAT`** for profiler, der ikke er aktive. Dette giver fuld dækning, men kræver mere kode og skal testes mod profiler uden indlæst hive.

Uden en af disse to metoder vil inventarscanningen systematisk underrapportere antallet af brugerdefinerede tilføjelser.

### Defender/KQL

KQL i Defender er ikke lokal proceskorrelation. Det er en central kilde, der kan vise, hvilken proces der startede Word eller Excel, og med hvilken kommandolinje.

Det er værdifuldt, fordi ADR-001's acceptkriterium *"Metoden til lokal proceskorrelation er valgt uden hooking"* er svært at opfylde lokalt: tilføjelsen kan ikke garantere identifikation af fagsystemet (ADR-001, tekniske begrænsninger). Proceslinje centralt besvarer præcis dette spørgsmål.

Kilden er valgfri og må ikke være en forudsætning for første leverance. Tre betingelser gælder, hvis den anvendes:

- **Licens.** Fuld Advanced Hunting med `DeviceProcessEvents`, kommandolinje og 30 dages historik kræver MDE P2 eller E5. Defender for Business giver en begrænset visning, og API-adgangen er yderligere begrænset. I tilbuddet skal der spørges ind til licensen fremfor at antage den.
- **Afleveringsvej.** KQL-resultatet eksporteres som fil og gennemgår samme sammentælling i browseren og samme manuelle godkendelse som alt andet (ECK-OCD-008, ECK-OCD-014). Der må ikke oprettes en separat datakanal til Eira.
- **Niveau.** En observeret proceslinje er stadig E2 i ADR-001's skala, fordi den ikke viser, hvad der sker inde i Office. Rapporten skal derfor altid angive kilden ved siden af niveauet, så E2 fra KQL ikke læses som E2 fra en lokal sandsynliggørelse.

Uden Defender er 4688 med kommandolinje den samme type data, men indsamlet lokalt via Windows Event Forwarding. Prisen er en GPO-ændring, der påvirker alle klienter.

## Stikprøve og dækning

Implementeringen og testkørslen skal kun køre på et udsnit. Inventarscriptet skal ikke: et script, der sendes ud via Intune, koster det samme i ressourcer på alle maskiner som på 30.

**Fast antal frem for procentsats:** mindst 25–30 maskiner pr. forvaltning, alle maskiner hvor et kendt fagsystem er installeret, og ingen stikprøver på ESDH- og konverteringsservere.

Sandsynligheden for at finde en afhængighed, der findes på andelen *p* af maskinerne, når man undersøger *n* maskiner ud af *N*, er hypergeometrisk. Ved *N* = 50:

| Udbredelse | n = 25 | n = 30 |
| --- | --- | --- |
| 10 % | 93 % | 96 % |
| 5 % | 72 % | 79 % |
| 2 maskiner ud af 50 | 76 % | 85 % |

Rapporten skal skrive det direkte: *"Afhængigheder på under ca. 10 % af maskinerne i en forvaltning kan være overset."*

Det er grundreglen — at fravær af observation ikke er dokumentation for fravær af en afhængighed — gjort målbar. Uden den sætning er dækningsaksen i ADR-001 blot en formalitet.

## Aflevering

Der er én afleveringsvej, og den er beskrevet i ADR-001: tilføjelsen placerer små strukturfiler i en netværksmappe, som kommunen opretter; en IT-medarbejder vælger mappen på Eiras hjemmeside; browseren summerer værdierne, fjerner små tal og kontrollerer felterne lokalt; medarbejderen godkender rapportfilen; først derefter uploades den via HTTPS.

Alle kilder i tabellen ovenfor skal indgå i denne vej. Ingen kilde må have sin egen forbindelse til Eira.

## Formuleringer

Må bruges:

- "Ingen installation på nogen af enhederne."
- "En tidsbegrænset Office-tilføjelse, der udrulles og afinstalleres centralt på de maskiner, der observeres."
- "Inventar, skabeloner og Graph-data indsamles uden installation."
- "Kræver en app-registrering med administratorgodkendelse."
- "Kræver en GPO-ændring." (når Defender ikke er tilgængeligt)

Må ikke bruges:

- "Installationsfri foranalyse." Tilføjelsen kræver installation.
- "Ingen ændringer i kommunen." Der er mindst én app-registrering, en netværksmappe og en godkendelse.
- "Dækker alle enheder."
- "Alle data bliver i kommunen." Struktur og aggregerede tal forlader kommunen efter godkendelse.
- Procenter eller samlet kompatibilitetsscore.

## Åbne punkter

- [ ] Skal Defender/KQL med som valgfri kilde i første leverance, eller skal det blot beskrives? (Forslag: beskrives, ikke implementeres — se ovenfor.)
- [ ] Er 4688/WEF et reelt alternativ for kommuner uden Defender, eller skal det udskydes af samme årsag?
- [ ] Hvilken af de to Intune-veje vælges som standard?
- [ ] Skal ADR-001's acceptkriterium om proceskorrelation pege på KQL eller 4688 som muligt svar?
