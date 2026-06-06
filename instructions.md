# instructions.md — Instrucțiuni de mentenanță

## Cum rulezi scraperul local

```bash
node --no-deprecation index.js
```

## Cum rulezi testele

```bash
npm test
```

## Cum rulezi un test anume

```bash
npm test -- --testPathPattern=unit
```

## Cum resetezi cache-ul

Șterge fișierele din `tmp/` pentru a forța re-validarea companiei:

```bash
Remove-Item -Recurse -Force tmp/
```

## Credentiale

SOLR_AUTH se citește din `process.env.SOLR_AUTH`. Local, setează în `.env.local`:

```
SOLR_AUTH (format: user:password)
```

## Debug

Toate logurile sunt în consola standard. Nu există logging persistent.
