# job_seeker_ro_spider — PANEMAR MORARIT Careers Romania Scraper

[![WebScraper PANEMAR to Peviitor](https://github.com/sebiboga/panemar-morarit-si-panificatie-srl-nodejs-scraper/actions/workflows/scrape.yml/badge.svg)](https://github.com/sebiboga/panemar-morarit-si-panificatie-srl-nodejs-scraper/actions/workflows/scrape.yml)
[![Automation Tests](https://github.com/sebiboga/panemar-morarit-si-panificatie-srl-nodejs-scraper/actions/workflows/test.yml/badge.svg)](https://github.com/sebiboga/panemar-morarit-si-panificatie-srl-nodejs-scraper/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/javascript-ESM-F7DF1E?logo=javascript&logoColor=black)](https://ecma-international.org/)
[![Node.js](https://img.shields.io/badge/node-24-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

**job_seeker_ro_spider** — un scraper pentru job-urile PANEMAR MORARIT SI PANIFICATIE SRL din România. Extrage anunțurile de pe [panemar.ro/angajari/](https://panemar.ro/angajari/) și le publică în [peviitor.ro](https://peviitor.ro) prin API-ul SOLR.

## Overview

Proiectul automatizează colectarea zilnică a job-urilor disponibile la PANEMAR MORARIT SI PANIFICATIE SRL, menținând board-ul peviitor.ro la zi cu cele mai recente oportunități de carieră.

## Features

- Extrage job-uri din formularul de angajări panemar.ro (Brutar, Patiser, Șofer, Muncitor necalificat)
- Validează compania via ANAF (CUI, status activ/inactiv, adresă completă)
- Stochează în SOLR (job core + company core)
- GitHub Actions: scrape zilnic + testare automată (unit, integration, e2e)
- Teste SOLR condiționale — auto-skip când `SOLR_AUTH` nu e setat

## Project Structure

```
├── index.js           # Main scraper entry point
├── company.js         # Company validation via ANAF + Peviitor + SOLR
├── demoanaf.js        # CLI wrapper for src/anaf.js
├── solr.js            # SOLR client (query, upsert, delete)
├── validate-jobs.js   # CLI for validating job URLs in SOLR
├── delete_request.json # SOLR delete query for this CIF
├── src/
│   └── anaf.js        # ANAF API client with retry logic
├── tests/
│   ├── unit/          # Unit tests (mocked ANAF/SOLR)
│   ├── integration/   # Integration tests (real APIs)
│   └── e2e/           # End-to-end pipeline tests
└── .github/workflows/
    ├── scrape.yml     # Scheduled daily scrape
    └── test.yml       # CI on push/PR
```

## Tech Stack

- **Runtime:** Node.js 24 (ESM)
- **HTTP:** `node-fetch` (v3)
- **Testing:** Jest 29
- **External APIs:**
  - ANAF — `demoanaf.ro/api` (validare firme)
  - SOLR — `solr.peviitor.ro` (indexare)
  - Peviitor — `api.peviitor.ro` (cross-validare)
- **CI/CD:** GitHub Actions

## Quick Start

```bash
# Clone
git clone https://github.com/sebiboga/panemar-morarit-si-panificatie-srl-nodejs-scraper.git
cd panemar-morarit-si-panificatie-srl-nodejs-scraper

# Install
npm install

# Run scraper
export SOLR_AUTH="your-solr-credentials"
node index.js

# Run tests
npm test
```

## Running Tests

```bash
# All tests
npm test

# Test suites
npm test -- --testPathPattern=unit        # unit
npm test -- --testPathPattern=integration # integration
npm test -- --testPathPattern=e2e         # e2e
```

Integration and e2e tests require `SOLR_AUTH` environment variable. Without it, they are skipped automatically.

## Validation

```bash
# Validate all jobs for this CIF in SOLR
node validate-jobs.js 4844886

# Check if URLs are still accessible
node validate-jobs.js --url https://panemar.ro/angajari/

# Validate from jobs.json
node validate-jobs.js --file jobs.json
```

## Scraper Logic

1. **Company validation:** Fetch company data from ANAF by CIF, verify active status
2. **Job extraction:** Parse `https://panemar.ro/angajari/` — extrage opțiunile din dropdown-ul CF7 (Brutar, Patiser, Șofer, Muncitor necalificat)
3. **SOLR upsert:** Map to job model and upsert to SOLR job core
4. **Company upsert:** Save/update company entry in SOLR company core

## Environment Variables

| Variable     | Description              | Default            |
|-------------|--------------------------|--------------------|
| `SOLR_AUTH` | SOLR credentials         | `your-solr-credentials`   |

## License

MIT — see [LICENSE](LICENSE)
