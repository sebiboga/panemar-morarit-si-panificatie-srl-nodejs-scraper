# company-model.md — Modelul de date pentru o companie

O companie în SOLR company core respectă următoarea structură:

| Câmp | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| `id` | string | Da | CUI-ul companiei |
| `company` | string | Da | Numele legal al companiei |
| `brand` | string | Nu | Numele de brand |
| `group` | string | Nu | Grupul din care face parte |
| `status` | string | Nu | Status ANAF |
| `location` | array | Nu | Adresa completă |
| `website` | array | Nu | Site-uri web |
| `career` | array | Nu | Link-uri către cariere |
| `lastScraped` | string | Nu | Data ultimei scrape |
| `scraperFile` | string | Nu | Link către workflow-ul de scrape |

## Exemplu

```json
{
  "id": "4844886",
  "company": "PANEMAR MORARIT SI PANIFICATIE SRL",
  "brand": "PANEMAR",
  "status": "activ",
  "location": ["str. Tarnavelor, nr. 28, Municipiul Cluj-Napoca, Cluj"],
  "website": ["https://panemar.ro"],
  "career": ["https://panemar.ro/angajari/"],
  "lastScraped": "2025-01-01",
  "scraperFile": "https://raw.githubusercontent.com/sebiboga/panemar-morarit-si-panificatie-srl-nodejs-scraper/main/.github/workflows/scrape.yml"
}
```
