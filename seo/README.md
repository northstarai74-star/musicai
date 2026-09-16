# SEO toolkit

Dependency-free SEO tooling for DesiSwagTunes. Everything runs on Node 18+ with
no `npm install` — the scripts use built-ins only, so they work in a cold
container or CI job.

The `seo` agent (`.claude/agents/seo.md`) drives these; `/seo` runs the
workflow. You can also run them by hand.

## Commands

```bash
npm run seo                       # full pass: prerender → sitemap → schema → keywords → audit
npm run seo:prerender             # write the static pages (index.html body + public/**)
npm run seo:prerender -- --dry-run
npm run seo:prerender -- --check  # exit 1 when the committed pages are stale (CI)
npm run seo:audit                 # audit index.html (or dist/index.html when built)
npm run seo:audit -- --all        # index.html + every pre-rendered page
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
- run: npm run seo:prerender -- --check   # catalogue changed but pages were not regenerated
- run: npm run build
- run: npm run seo:audit -- --all
```

## Files

| Path | Role |
| --- | --- |
| `seo.config.json` | Origin, routes, length targets, keyword modifiers, competitors — the only file you edit by hand |
| `audit.mjs` | Runs the rule set against a URL or local file, renders the report |
| `prerender.mjs` | Static pre-render: home body into `index.html`, catalogue pages into `public/` |
| `lib/render.mjs` | The HTML and JSON-LD for those pages — pure functions of the catalogue |
| `keywords.mjs` | Keyword clusters, intent, priority, ready-to-paste title/description |
| `sitemap.mjs` | `public/sitemap.xml` + `public/robots.txt` |
| `schema.mjs` | schema.org JSON-LD (`WebSite`, `Organization`, `ItemList`, `MusicRecording`) |
| `run.mjs` | Orchestrator behind `npm run seo` |
| `lib/html.mjs` | Regex HTML inspection (titles, meta, headings, images, JSON-LD) |
| `lib/site.mjs` | Config loader, `src/data/songs.ts` parser, URL slugs, document fetch |
| `lib/checks.mjs` | The 20 audit rules and the scoring model |
| `reports/` | Dated audit and keyword-map output (git-ignored) |

## Generated files — do not hand-edit

`public/sitemap.xml`, `public/robots.txt`, `public/library/`, `public/song/`,
`public/artist/`, `public/language/`, and both marker blocks in `index.html`
(`seo:schema:*` for the JSON-LD, `seo:prerender:*` for the home body) are
overwritten on every run. Change `seo.config.json` or `src/data/songs.ts` and
re-run instead.

## How the pre-render works

The app is still a client-rendered SPA, so `npm run seo:prerender` does two
separate things:

1. **`index.html`** gets the home page body injected into `#root`. React
   replaces it on mount, so the injected markup deliberately mirrors what the
   app renders — `BrowseCatalogue.tsx` and `Footer.tsx` exist so that visitors
   get the same links crawlers do. Content that only the crawler can see is
   cloaking; keep the two in sync.
2. **`public/<route>/index.html`** are standalone pages for the catalogue
   (`/library`, `/song/*`, `/artist/*`, `/language/*`). Vite copies `public/`
   into `dist/` untouched. They carry no app bundle — if they loaded the SPA,
   React would mount the home page over the song you asked for — so they are
   plain HTML with their own inline CSS and a `/?song=<id>` link into the
   player.

Only catalogue-derived routes are generated. `/search`, `/likes` and `/premium`
are app state with no router behind them, so they stay out of both the
pre-render and the sitemap until real routing lands. `sitemap.mjs` enforces
that: a URL is listed only if it resolves to a page on disk.

This is a stopgap, not SSR. The permanent fix is a router plus
`hydrateRoot()`, at which point the page models in `lib/render.mjs` can be
replaced by the React components themselves.

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

`run` receives `{ html, config, assets, route }` (`route` is the URL path the
target represents, or `null`) and returns
`{ status: 'pass' | 'warn' | 'fail' | 'skip', detail, fix }`. Rules must not
throw — return `skip` when a check does not apply. Every audit picks it up from
then on.
