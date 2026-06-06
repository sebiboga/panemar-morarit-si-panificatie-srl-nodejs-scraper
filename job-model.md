# job-model.md — Modelul de date pentru un job

Un job în platforma peviitor.ro respectă următoarea structură:

| Câmp | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| `url` | string | Da | Link unic către anunțul de job |
| `title` | string | Da | Titlul job-ului |
| `company` | string | Da | Numele companiei |
| `cif` | string | Da | CUI-ul companiei |
| `location` | array | Da | Locațiile job-ului |
| `country` | array | Da | Țara (implicit "România") |
| `date` | string | Da | Data la care a fost scrapuit |
| `status` | string | Da | Statusul job-ului ("scraped") |

## Exemplu

```json
{
  "url": "https://panemar.ro/angajari/#brutar",
  "title": "Brutar",
  "company": "PANEMAR MORARIT SI PANIFICATIE SRL",
  "cif": "4844886",
  "location": ["Cluj-Napoca"],
  "country": ["România"],
  "date": "2025-01-01T00:00:00.000Z",
  "status": "scraped"
}
```
