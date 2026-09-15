# SEO toolkit

Dependency-free SEO tooling for DesiSwagTunes. Everything runs on Node 18+ with
no `npm install` — the scripts use built-ins only, so they work in a cold
container or CI job.

The `seo` agent (`.claude/agents/seo.md`) drives these; `/seo` runs the
workflow. You can also run them by hand.

## Commands

```bash
npm run seo                       # full pass: sitemap → schema → keywords → audit
npm run seo:audit                 # audit index.html (or dist/index.html when built)
npm run seo:audit -- dist/index.html
npm run seo:audit -- https://desiswagtunes.com
npm run seo:audit -- --json --out seo/reports/audit.md
npm run seo:keywords              # keyword map + content briefs
npm run seo:keywords -- --volumes semrush-export.csv
npm run seo:sitemap               # write public/sitemap.xml + public/robots.txt
npm run seo:sitemap -- --include-catalog --dry-run
npm run seo:schema -- --inject    # write JSON-LD into index.html
```

`npm run seo:audit` exits `1` when a critical or high-severity check fails, so
it can gate CI:

```yaml
- run: npm run build
- run: npm run seo:audit -- dist/index.html
```

## Files

| Path | Role |
| --- | --- |
| `seo.config.json` | Origin, routes, length targets, keyword modifiers, competitors — the only file you edit by hand |
| `audit.mjs` | Runs the rule set against a URL or local file, renders the report |
| `keywords.mjs` | Keyword clusters, intent, priority, ready-to-paste title/description |
| `sitemap.mjs` | `public/sitemap.xml` + `public/robots.txt` |
| `schema.mjs` | schema.org JSON-LD (`WebSite`, `Organization`, `ItemList`, `MusicRecording`) |
| `run.mjs` | Orchestrator behind `npm run seo` |
| `lib/html.mjs` | Regex HTML inspection (titles, meta, headings, images, JSON-LD) |
| `lib/site.mjs` | Config loader, `src/data/songs.ts` parser, URL slugs, document fetch |
| `lib/checks.mjs` | The 18 audit rules and the scoring model |
| `reports/` | Dated audit and keyword-map output (git-ignored) |

## Generated files — do not hand-edit

`public/sitemap.xml`, `public/robots.txt`, and the JSON-LD between the
`<!-- seo:schema:start -->` / `<!-- seo:schema:end -->` markers in `index.html`
are overwritten on every run. Change `seo.config.json` or `src/data/songs.ts`
and re-run instead.

## Scoring

Each rule carries a severity weight (critical 5, high 3, medium 2, low 1). A
pass earns full weight, a warn half, a fail none; skipped rules leave the total
alone. The score is the percentage earned — it measures the checks in
`lib/checks.mjs`, not your rankings.

Keyword **priority** is likewise a heuristic built from catalogue signals and
phrase shape. It is a sort order for work, not search volume. Export the real
numbers from Semrush or Search Console and merge them with
`--volumes <file.csv>` (any CSV with a `keyword` column plus `volume` and/or
`difficulty`) before committing budget to a cluster.

## Adding a check

Add an entry to the `RULES` array in `lib/checks.mjs`:

```js
{
  id: 'hreflang',
  title: 'hreflang for Hindi/Punjabi variants',
  severity: 'medium',
  run: ({ html, config }) => ({ status: 'pass', detail: '…' }),
}
```

`run` receives `{ html, config, assets }` and returns
`{ status: 'pass' | 'warn' | 'fail' | 'skip', detail, fix }`. Rules must not
throw — return `skip` when a check does not apply. Every audit picks it up from
then on.
