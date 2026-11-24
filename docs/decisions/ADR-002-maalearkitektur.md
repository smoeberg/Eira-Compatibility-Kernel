# ADR-002 – Målearkitektur for Office-automation

**Status:** Foreslået.\
**Dato:** 24. november 2026.\
**Forhold til ADR-001:** Supplerer afsnittene "Tekniske begrænsninger" og "Evidens" i [ADR-001](ADR-001-office-centric-discovery.md). Præciserer ECK-OCD-005 for laboratoriemiljøer (se "Fase A"). ADR-001 er gældende ved uoverensstemmelser, indtil denne ADR er accepteret.

## Beslutning

1. Måling af, hvordan fagsystemer automatiserer Word og Excel, bygges på COM-proxyer genereret ud fra Office' typebiblioteker. Grundlaget er en fork af `genproxy` og `proxies` fra Collaboras COLEAT (MPL 2.0). `injecteddll` indgår ikke i noget, der leveres til en kommune.
2. Målingen indføres i to faser. Fase A bruger COLEAT, som det er, kun i Eiras isolerede laboratorium. Fase B erstatter injektionen med en COM-server registreret pr. bruger under en dedikeret testkonto.
3. Ethvert fund rapporteres i én af tre tilstande: **kaldt**, **målt, intet kaldt** eller **ikke målt ad denne vej**. Tilstanden er et selvstændigt felt og fjernes aldrig ved dataminimering.
4. Broen til LibreOffice behandles forskelligt efter bindingsform: sen binding bruger LibreOffice' eksisterende `Writer.Application`/`Calc.Application`; tidlig binding kræver en egen COM-server og er et åbent punkt.
5. Layouttest bruger de PDF'er, kommunens fagsystemer allerede danner, som facit. Word afvikles ikke i containere eller på servere.
6. Kompatibilitetsmatrixen bygges på eksekverbare probe-tests mod fastlåste LibreOffice-versioner. Kildekode bruges kun til at finde nye funktioner.
7. Kontraktudløb indgår i kommunens egen rapport, men samles ikke på tværs af kommuner i vidensbasen.

## Kontekst

### COLEAT

COLEAT (Collabora OLE Automation Translator, 2018–2020, MPL 2.0) kan omdirigere og spore et programs brug af Word og Excel. Kildekoden viser:

- Sporing virker også for VB6 med tidlig binding. `genproxy` genererer vtable-kompatible proxyer ud fra typebibliotekerne.
- Omdirigering og sporing sker ved DLL-injektion og IAT-patching af bl.a. `CoCreateInstance`, `CoCreateInstanceEx`, `LoadLibrary*` og `GetProcAddress`. Det er forbudt efter ECK-OCD-005.
- `CProxiedClassFactory` pakker en eksisterende `IClassFactory`. Der findes ingen selvstændig klassefabrik, som kan registreres.
- TODO.txt beskriver kendte huller: referencer på tværs af typebiblioteker (fx `CommandBars` fra MSO), interface-arv ud over `IDispatch`, og interfaces uden typeinformation, som ikke kan spores.
- README angiver, at den funktionalitet i Collabora Office, der svarer tilstrækkeligt til Word, er "fairly limited".

### LibreOffice' VBA-lag

LibreOffice implementerer en delmængde af Words objektmodel i `sw/source/ui/vba` (79 interfaces i `oovbaapi/ooo/vba/word`). OLE-serveren (`extensions/source/ole/servprov.cxx`) eksponerer den som `Writer.Application` og `Calc.Application`. Gennemgang af master pr. 24. november 2026 (commit `86090b9`):

| Kald | Status i kildekoden |
|---|---|
| `Documents.Open`/`Add`, `Document.Close`/`Save` | Implementeret |
| `Bookmarks`, `Range.Text`, `Variables`, `CustomDocumentProperties` | Implementeret |
| `ContentControls`, `Fields`, `Tables`, `FormFields`, `Find`/`Replacement` | Implementeret |
| `SaveAs` med `wdFormatPDF` | Ingen PDF-gren. `setFilterPropsFromFormat()` har ikke noget `wdFormatPDF`-tilfælde, så `default` vælger filteret "MS Word 97", mens filen gemmes under det navn, fagsystemet angav. Et PDF-kald giver en Word-fil med `.pdf`-endelse, uden fejl |
| `PrintOut` | Tom funktion (`//TODO`). Ingen virkning, ingen fejl |
| `MailMerge.OpenDataSource` | Tom funktion. `Execute` findes ikke |
| `SaveAs2`, `ExportAsFixedFormat` | Findes ikke |
| `Range.InsertAfter`, `InsertBefore`, `InsertFile`, `Delete`, `Collapse` | Findes ikke på `Range` |

Status i kildekoden er ikke bevis for kompatibilitet. Det gælder også i den anden retning: en funktion, der findes, kan være en tom stub.

## Målearkitektur

### Fase A: COLEAT som det er, kun i laboratoriet

Formål: få de første rigtige spor og fastlægge datamodellen, før der bruges tid på en indsamlingsmetode uden injektion.

- Kører kun på en isoleret Windows-VM, som Eira ejer, med et fagsystem i en testinstallation og syntetiske data.
- Kører aldrig i en kommunes miljø, på en kommunes maskine eller med en kommunes data.
- ECK-OCD-005 præciseres derfor: forbuddet mod hooking og injektion gælder alt, der køres i eller leveres til kommunens miljøer. Det gælder ikke Eiras isolerede laboratorium med syntetiske data.
- Fase A fastlægger **sporformatet**. Den kan ikke bruges som dækningsbevis: syntetiske data og ét testforløb viser, hvordan et spor ser ud, ikke hvilke kald kommunens sager udløser. Dækning kræver Fase B på et rigtigt fagsystem.
- Fase A forudsætter, at et fagsystem er stillet til rådighed for laboratoriet med testlicens, en fast version og et aftalt sagsforløb. Det er den post i planen med længst leveringstid, og den er ikke teknisk.

### Rækkefølgen for præciseringen

ADR-002 kan ikke selv ophæve et bindende krav i ADR-001, og ADR-001 er gældende ved uoverensstemmelser, indtil ADR-002 er accepteret. Som dokumenterne står, kan Fase A derfor ikke køres lovligt, før ADR-002 er accepteret — og ADR-002 kan ikke accepteres, før Fase A har givet et spor. Kredsen skal brydes.

Præciseringen vedtages derfor som en selvstændig rettelse af ECK-OCD-005 i ADR-001, med denne ordlyd:

> **ECK-OCD-005** | Hooking, injection og trafikopfangning er ikke tilladt i kommunens miljøer. I Eiras isolerede laboratorium, med syntetiske data og uden forbindelse til kommunens miljøer, må det anvendes til at fastlægge datamodellen.

Den rettelse kan vedtages med det samme og kræver ikke Fase A. Derefter accepteres ADR-002 på de øvrige kriterier.

### Fase B: COM-server pr. bruger

Formål: en indsamlingsmetode, som en kommune kan godkende.

- En COM-server registreres under `HKCU\Software\Classes` for Words og Excels CLSID'er og ProgID'er, kun i en dedikeret testkonto.
- Serveren implementerer de nødvendige interfaces i typebibliotekets vtable-rækkefølge (genereret af `genproxy`) og videresender til den rigtige Word.
- Den rigtige Word kan ikke hentes med `CoCreateInstance`, fordi registreringen peger på serveren selv. Den skal startes ad anden vej, fx `LocalServer32` fra HKLM og `winword.exe /automation` med opslag via Running Object Table.
- Serveren indlæses i fagsystemets proces. Det er almindelig COM og ikke injektion, men det skal stå i sikkerhedsbeskrivelsen: kode fra Eira kører i fagsystemets proces under testen. Formuleringen er "ingen IAT-patching, ingen `CreateRemoteThread`, ingen ændring af fagsystemet".
- Måleserveren og en eventuel bro må aldrig være registreret i samme profil samtidig.

### Kendte blinde vinkler

| Mekanisme | Ses af COM-målingen | Anden kilde |
|---|---|---|
| `CreateObject("Word.Application")`, sen binding | Ja | – |
| VB6 med tidlig binding | Ja, hvis interfacet har proxy | – |
| `ShellExecute`/kommandolinje (`winword.exe /m…`) | Nej | Procesoprettelse (4688/KQL) i inventaret |
| DDE | Nej | Procesoprettelse, kørselstest |
| Processer med administratorrettigheder | Nej. Elevated processer ignorerer COM-registrering pr. bruger | Skal afklares i spiken |
| Tjenester og SYSTEM-konti, fx konverteringsservere | Nej | Serverinventar, procesoprettelse |
| Interfaces uden typeinformation | Nej | Rapporteres som ikke målt |
| Excels `Range` (kun dispinterface) | Ja ved sen binding via `IDispatch`, hvis typeinformationen findes ved kørsel. Ingen genereret proxy, så tidlig binding kan ikke betjenes | Verificeres i spiken |
| 32/64-bit uoverensstemmelse mellem fagsystem og Office | Ja, men kun hvis serveren er bygget i klientens bitness. Er den ikke, indlæses den i en surrogate (`dllhost`), og ECK-MA-005 gælder ikke længere | Proxyerne skal bygges både x86 og x64. Afklares i spiken |
| Word startet via OLE/DDE fra et andet program | Nej | Procesoprettelse, kørselstest |

### Objektidentitet

Samme Word-objekt kan få flere proxyobjekter (fx ét fra en hændelse og ét fra en returværdi). Spor må derfor ikke bruges til at udlede, hvilke kald der hører til samme dokument, før dette er løst. TODO.txt nævner commit `4deff7ec`, som forsøger at løse det, men uden at være sikker.

Identiteten kan ikke baseres på dokumentets sti. Stien er omfattet af ECK-OCD-003 og må ikke forlade maskinen. Sammenkædningen skal derfor ske lokalt med et tilfældigt id pr. dokument, og id'et må aldrig indgå i udtrækket.

## Tre tilstande

| Tilstand | Betydning | Eksempel |
|---|---|---|
| `kaldt` | Kaldet er observeret under det testede forløb | `Bookmarks.Item` kaldt 14 gange |
| `målt_intet_kaldt` | Mekanismen blev målt, og kaldet forekom ikke | `PrintOut` ikke kaldt i de testede forløb |
| `ikke_målt` | Mekanismen kunne ikke måles ad denne vej | Fagsystemet starter Word via `ShellExecute` |

- Tilstanden er et selvstændigt felt. Fjernelse af små tal rammer kun antallet, aldrig tilstanden.
- `målt_intet_kaldt` gælder kun de testede forløb og skal altid stå sammen med en beskrivelse af forløbene.
- `ikke_målt` bliver aldrig automatisk til `gap` eller til fravær af afhængighed (ADR-001: fravær af observation er ikke dokumentation for fravær).
- I kode og i sporformatet hedder værdierne `called`, `measured_none` og `not_measured` (se "Konsekvenser for repoet"). De danske navne bruges kun i dokumentationen.

### Tilstand og evidensniveau

Tilstanden siger, om der blev målt. Evidensniveauet siger, hvor stærkt et fund er. De to må ikke blandes sammen, og et spor fra COM-målingen er ikke E3.

| Fund | Niveau |
|---|---|
| `called`, kaldende proces identificeret, gentaget i to gennemløb | E4 |
| `called`, kaldende proces identificeret, ét gennemløb | E2 |
| `measured_none` | Intet niveau. Det er ikke et fund; dækningen angives i stedet |
| `not_measured` | Intet niveau. Rapporteres som ukendt (ECK-OCD-010) |

E3 er forbeholdt tilføjelsens observation inde i Office. COM-målingen ser kaldet ved procesgrænsen: den ved, hvem der kaldte, men ikke hvad der skete bagefter. Den kan derfor aldrig løftes til E3, og det skal stå i rapporten ved siden af niveauet (ECK-OCD-009).

## Bro

| Bindingsform | Vej til LibreOffice | Status |
|---|---|---|
| Sen binding med konfigurerbart ProgID | Skift `Word.Application` til `Writer.Application` | Findes. Begrænset af VBA-lagets huller |
| Sen binding med fast ProgID | COM-server under Words ProgID, der videresender til `Writer.Application` | Skal bygges |
| Tidlig binding (VB6) | COM-server med Words CLSID og vtable-layout | Åbent punkt. LibreOffice' OLE-bro er kun `IDispatch`-baseret |

Huller i VBA-laget løses som rettelser i LibreOffice (`sw/source/ui/vba`, `sc/source/ui/vba`) og sendes upstream. Eira vedligeholder ikke en fork af LibreOffice.

## Layouttest

- Facit er de PDF'er, kommunens fagsystemer allerede danner i den normale arbejdsgang.
- Sammenligningen kører lokalt hos kommunen. Dokumenter og PDF'er forlader ikke kommunen (ECK-OCD-003).
- Før sammenligning normaliseres datoer, sidetal, felter og løbenumre. Skrifttypeerstatning registreres (fx Calibri til Carlito).
- Word afvikles ikke i containere eller som serverautomatisering.

## Kompatibilitetsmatrix

- Hver række har: kald, LibreOffice-version, probe-resultat, henvisning til kildefil og testdato.
- Probe-tests kalder funktionen og kontrollerer virkningen (fx at `SaveAs` med `wdFormatPDF` danner en gyldig PDF).
- Status er `verificeret`, `afvigelse`, `stub`, `mangler` eller `ikke_verificeret`.
- Probe-testene køres automatisk mod hver ny LibreOffice-udgivelse.

## Data

- Kontraktudløb og leverandørforhold står i kommunens egen rapport. De samles ikke på tværs af kommuner i vidensbasen.
- Vidensbasen indeholder kun strukturelle mønstre pr. fagsystem og version: kald, mekanisme og status.
- Rapportfiler, der næsten er identiske med en tidligere fra samme kommune, afvises for at hindre differensangreb på de fjernede små tal.
- Sammentællingssiden udgives som statisk kode uden netværkskald og med en restriktiv Content Security Policy, så kommunen kan efterprøve, at beregningen sker lokalt.

## Bindende krav

| ID | Krav |
|---|---|
| ECK-MA-001 | Kode med injektion eller IAT-patching køres kun i Eiras isolerede laboratorium med syntetiske data. |
| ECK-MA-002 | Hvert fund har en af de tre tilstande. Tilstanden fjernes aldrig ved dataminimering. |
| ECK-MA-003 | Et spor angiver fagsystemets version og bitness, Office-version og build, testkonto-type, om den kaldende proces var elevated, og de testede forløb. |
| ECK-MA-004 | Måleserver og bro registreres aldrig samtidig i samme profil. |
| ECK-MA-005 | Sikkerhedsbeskrivelsen siger eksplicit, at målekoden indlæses i fagsystemets proces. |
| ECK-MA-006 | Matrixstatus `verificeret` kræver et bestået probe-resultat. Kildekode alene giver højst `ikke_verificeret`. |
| ECK-MA-007 | Kontraktdata samles ikke på tværs af kommuner. |
| ECK-MA-008 | Layouttest kører lokalt hos kommunen og bruger kommunens egne PDF'er som facit. |

## Åbne punkter

- [ ] Kan en COM-server registreret pr. bruger betjene VB6 med tidlig binding uden injektion?
- [ ] Hvordan startes den rigtige Word pålideligt, når CLSID'et er overtaget, også på terminalservere?
- [ ] Hvordan håndteres fagsystemer, der kører med administratorrettigheder?
- [ ] Kan sen binding spore interfaces uden genererede proxyer, som TODO.txt antyder? Hvis ja, gælder begrænsningen kun VB6.
- [ ] Hvordan løses objektidentitet i sporet, og er `4deff7ec` tilstrækkeligt?
- [ ] Kan proxyerne bygges i både x86 og x64, og hvad sker der, når fagsystem og Office har forskellig bitness?
- [ ] Hvem stiller et fagsystem til rådighed for laboratoriet, og på hvilken aftale? Testlicens, version og et repræsentativt sagsforløb er en forudsætning for Fase A.
- [ ] Skal procesoprettelse komme fra KQL, 4688 eller begge?
- [ ] Hvornår er en måling færdig? Forslag: alle forløb i en aftalt liste er kørt, og to gennemløb giver samme sæt kald.
- [ ] Hvem ejer og finansierer vidensbasen og matrixen løbende?

## Acceptkriterier

ADR-002 kan accepteres, når:

- [ ] Fase A har givet et rigtigt spor fra mindst ét fagsystem i laboratoriet.
- [ ] Spiken for fase B har vist, om tidlig og sen binding kan måles uden injektion, eller beskrevet alternativet.
- [ ] Sporformatet er fastlagt, inklusive de tre tilstande og koblingen til evidensniveauerne.
- [ ] ECK-OCD-005 er rettet i ADR-001 med ordlyden under "Rækkefølgen for præciseringen". Dette kriterium kan opfyldes før Fase A og skal ikke vente på denne ADR.

## Konsekvenser for repoet

- `packages/fingerprint/src/score.ts`: `checkSupport` returnerer `"gap"`, når ingen rute matcher. Det skal ændres til `ikke_målt`/`ukendt`, før ingest tildeler evidensniveauer. `calculateCompatibilityScore` og den grønne, gule og røde anbefaling udgår, jf. ADR-001.
- Nye pakker: måling (Windows, C++, fork med MPL-noter bevaret, uden navnet COLEAT), inventar (PowerShell), skabelonscanner, probe-matrix og layouttest.
- `packages/fingerprint/src/score.ts`: tilstandsværdierne skal være `called`, `measured_none` og `not_measured`, så de ikke blandes sammen med de danske dokumentationsnavne i JSON-udtræk og API-svar.
- `SaveAs` med `wdFormatPDF` er den mest konsekvensrige afvigelse og skal være den første probe. Kaldet giver en Word-fil med `.pdf`-endelse, uden fejl, fordi `setFilterPropsFromFormat()` falder tilbage til filteret "MS Word 97". I dansk offentligt regi er PDF ofte et leverancekrav, så afvigelsen skal stå i salgsmaterialet som en kendt blokering med en foreslået løsning — konvertering efter lagring — og ikke kun som en række i matrixen.
- `docs/sales/EVIDENSKILDER.md` opdateres med de tre tilstande, de blinde vinkler og PDF-facit. Rækken for layouttest er rettet, så den ikke længere nævner Word i container.
