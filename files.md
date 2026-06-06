# files.md — Fișierele din acest repository

## Fișiere obligatorii (template)

| Fișier | Obligatoriu | Descriere |
|--------|-------------|-----------|
| `README.md` | Da | Prezentare generală |
| `AGENTS.md` | Da | Instrucțiuni pentru AI agents |
| `BRANCH.md` | Da | Regula branch-ului default |
| `PUBLIC.md` | Da | Regula vizibilității publice |
| `TOPICS.md` | Da | Regula topic-urilor GitHub |
| `ISSUES.md` | Da | Regula pentru GitHub Issues |
| `SECURITY.md` | Da | Politica de securitate |
| `ROBOTS.md` | Da | Reguli pentru roboți |
| `CONTRIBUTING.md` | Da | Cum să contribui |
| `files.md` | Da | Acest fișier |
| `instructions.md` | Da | Instrucțiuni detaliate |
| `job-model.md` | Da | Modelul de date pentru un job |
| `company-model.md` | Da | Modelul de date pentru o companie |
| `UPDATE-REPO-ABOUT.md` | Da | Cum se actualizează descrierea |
| `docs/README.md` | Da | Documentație pagină GitHub Pages |

## Cod sursă

| Fișier | Rol |
|--------|-----|
| `index.js` | Entry point |
| `company.js` | Validare companie via ANAF |
| `solr.js` | Interacțiune cu SOLR |
| `src/anaf.js` | Interogare API ANAF |
| `validate-jobs.js` | Script validare job-uri |

## Teste

| Fișier | Tip |
|--------|-----|
| `tests/unit/company.test.js` | Test unitar |
| `tests/unit/index.test.js` | Test unitar |
| `tests/unit/solr.test.js` | Test unitar |
| `tests/unit/demoanaf.test.js` | Test unitar |
| `tests/unit/public.test.js` | Test vizibilitate |
| `tests/unit/topics.test.js` | Test topic-uri |
| `tests/integration/workflow.test.js` | Test integrare |
| `tests/e2e/scraper.test.js` | Test end-to-end |
