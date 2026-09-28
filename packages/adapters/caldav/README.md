# CalDAV Adapter

| | |
|---|---|
| **Maturity** | 0% — stub |
| **Target** | Sabre/Nextcloud CalDAV |
| **V1 scope** | Events CRUD |
| **Blocks sales?** | Delvist — mange kunder kræver kalender i V1 |

## Planned surface

- `listEvents`, `getEvent`, `createEvent`, `updateEvent`, `deleteEvent`

## Dependencies

- `@eck/translation` — `EiraCalendarEvent`
- iCal ↔ internal model mappers (ikke implementeret)

## Next step

CalDAV PROPFIND/REPORT smoke test + mapper for `/me/events`.
