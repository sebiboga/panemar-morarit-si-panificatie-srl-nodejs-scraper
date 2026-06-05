# job_seeker_ro_spider

**job_seeker_ro_spider** — scraper pentru job-urile PANEMAR MORARIT SI PANIFICATIE SRL din România.

Extrage anunțurile de pe [panemar.ro/angajari/](https://panemar.ro/angajari/) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

## Identificare

Toate request-urile HTTP folosesc User-Agent-ul:

```
job_seeker_ro_spider
```

## Ce face

1. **Validează compania** — interoghează API-ul public ANAF ([demoanaf.ro](https://demoanaf.ro)) după CIF-ul PANEMAR (4844886) și verifică:
   - Denumirea oficială: PANEMAR MORARIT SI PANIFICATIE SRL
   - Status: activ/inactiv/radiat
   - Adresa completă din registrul comerțului
2. **Scrape-uiește job-urile** — extrage opțiunile din dropdown-ul formularului CF7 de pe panemar.ro/angajari/ (Brutar, Patiser, Șofer, Muncitor necalificat)
3. **Stochează în SOLR** — upsert în `job` core și `company` core

## Structură proiect

```
├── index.js           # Orchestrator principal
├── company.js         # Validare companie (ANAF + Peviitor + SOLR)
├── demoanaf.js        # CLI wrapper pentru src/anaf.js
├── src/anaf.js        # Modul ANAF API (search + company details)
├── solr.js            # Operații SOLR (query, upsert, delete, company)
├── tests/
│   ├── unit/          # 17 teste unitare (API-uri mock-uite)
│   ├── integration/   # Teste de integrare (ANAF + SOLR live)
│   └── e2e/           # Teste end-to-end (pipelin complet)
└── .github/workflows/
    ├── scrape.yml     # Rulează zilnic la 6 AM UTC
    └── test.yml       # Teste automate la fiecare push/PR
```

## API-uri folosite

| API | URL | Autentificare |
|---|---|---|
| PANEMAR Careers | `https://panemar.ro/angajari/` | Public |
| ANAF (demoanaf) | `https://demoanaf.ro/api/...` | Public |
| Peviitor | `https://api.peviitor.ro/v1/company/` | Public |
| SOLR (job core) | `https://solr.peviitor.ro/solr/job` | `SOLR_AUTH` |
| SOLR (company core) | `https://solr.peviitor.ro/solr/company` | `SOLR_AUTH` |

## Testare

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
```

Testele SOLR folosesc `itIfSolr` — se auto-skip dacă `SOLR_AUTH` nu e setată.
