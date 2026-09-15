---
description: Run the SEO workflow — audit, fix, re-audit
argument-hint: [audit|keywords|sitemap|schema|all|<url>]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

Run SEO work on this repo using the toolkit in `seo/` (see `seo/README.md` and
the `seo` agent definition in `.claude/agents/seo.md` for the playbook).

Request: $ARGUMENTS

If no argument is given, run `npm run seo` for a full pass, then work the
printed priority queue top-down: fix the highest-severity finding, re-run
`npm run seo:audit`, and report the score before and after. If the argument
looks like a URL, audit that URL instead with `npm run seo:audit -- <url>`.
