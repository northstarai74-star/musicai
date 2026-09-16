#!/usr/bin/env node
/**
 * Technical SEO audit.
 *
 *   node seo/audit.mjs                     # audits index.html (or dist/ when built)
 *   node seo/audit.mjs --all               # index.html + every pre-rendered page
 *   node seo/audit.mjs dist/index.html
 *   node seo/audit.mjs https://example.com --json
 *   node seo/audit.mjs --out seo/reports/audit.md
 *
 * Exit code is 1 when a critical or high-severity check fails, so it can gate CI.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { runChecks } from './lib/checks.mjs';
import { loadConfig, loadDocument, ROOT } from './lib/site.mjs';

const ICON = { pass: '✅', warn: '⚠️ ', fail: '❌', skip: '➖' };

async function readAsset(base, name) {
  for (const dir of base) {
    const file = path.join(ROOT, dir, name);
    const body = await readFile(file, 'utf8').catch(() => null);
    if (body !== null) return { path: path.relative(ROOT, file), body };
  }
  return null;
}

async function fetchAsset(origin, name) {
  try {
    const { html } = await loadDocument(`${origin}/${name}`);
    if (/<!doctype html|<html/i.test(html)) return null; // SPA fallback page, not the asset
    return { path: `${origin}/${name}`, body: html };
  } catch {
    return null;
  }
}

async function collectAssets(target) {
  if (/^https?:\/\//i.test(target)) {
    const origin = new URL(target).origin;
    const [robots, sitemap] = await Promise.all([fetchAsset(origin, 'robots.txt'), fetchAsset(origin, 'sitemap.xml')]);
    return { 'robots.txt': robots, 'sitemap.xml': sitemap };
  }
  const dirs = ['dist', 'public', '.'];
  return {
    'robots.txt': await readAsset(dirs, 'robots.txt'),
    'sitemap.xml': await readAsset(dirs, 'sitemap.xml'),
  };
}

/**
 * The route a target represents, so rules can check the page against its own
 * URL. `index.html` is `/`; `public/song/x/index.html` is `/song/x`.
 */
export function routeOf(source, kind) {
  if (kind === 'url') {
    try {
      return new URL(source).pathname;
    } catch {
      return null;
    }
  }
  const parts = source.split('/').filter(Boolean);
  if (parts[parts.length - 1] !== 'index.html') return null; // a bare .html file has no route
  const trimmed = parts.slice(0, -1);
  if (trimmed[0] === 'public' || trimmed[0] === 'dist') trimmed.shift();
  return `/${trimmed.join('/')}`;
}

/** index.html plus every pre-rendered page under public/ (or dist/). */
export async function prerenderedTargets() {
  const targets = [];
  const built = await readFile(path.join(ROOT, 'dist/index.html'), 'utf8').catch(() => null);
  const base = built ? 'dist' : 'public';
  targets.push(built ? 'dist/index.html' : 'index.html');

  const walk = async (dir) => {
    for (const entry of await readdir(path.join(ROOT, dir), { withFileTypes: true }).catch(() => [])) {
      if (entry.isDirectory()) await walk(`${dir}/${entry.name}`);
      else if (entry.name === 'index.html') targets.push(`${dir}/${entry.name}`);
    }
  };
  for (const dir of ['library', 'song', 'artist', 'language']) await walk(`${base}/${dir}`);
  return targets;
}

function renderMarkdown(reports, config) {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const lines = [
    `# SEO audit — ${config.site.name}`,
    '',
    `_${now} UTC · ${reports.length} page(s) · target score ${config.targets.minScore}+_`,
    '',
    '| Page | Score | Pass | Warn | Fail |',
    '| --- | --- | --- | --- | --- |',
    ...reports.map((r) => `| \`${r.source}\` | **${r.score}/100** | ${r.counts.pass} | ${r.counts.warn} | ${r.counts.fail} |`),
    '',
  ];

  for (const report of reports) {
    lines.push(`## \`${report.source}\` — ${report.score}/100`, '');
    for (const group of ['fail', 'warn', 'pass', 'skip']) {
      const items = report.checks.filter((c) => c.status === group);
      if (!items.length) continue;
      for (const check of items) {
        lines.push(`- ${ICON[check.status]} **${check.title}** (${check.severity}) — ${check.detail}`);
        if (check.fix && check.status !== 'pass') lines.push(`  - _Fix:_ ${check.fix}`);
      }
    }
    lines.push('');
  }

  const blockers = reports
    .flatMap((r) => r.checks.map((c) => ({ ...c, source: r.source })))
    .filter((c) => c.status === 'fail' && (c.severity === 'critical' || c.severity === 'high'));

  lines.push('## Priority queue', '');
  if (!blockers.length) {
    lines.push('No critical or high-severity failures. Move on to content and off-page work.');
  } else {
    blockers.forEach((b, i) => lines.push(`${i + 1}. **${b.title}** — ${b.detail} (\`${b.source}\`)`));
  }
  lines.push('');
  return lines.join('\n');
}

export async function audit(targets, { assets } = {}) {
  const config = await loadConfig();
  const reports = [];
  for (const target of targets) {
    const doc = await loadDocument(target);
    const context = {
      html: doc.html,
      config,
      route: routeOf(doc.source, doc.kind),
      assets: assets ?? (await collectAssets(target)),
    };
    reports.push({ source: doc.source, kind: doc.kind, ...runChecks(context) });
  }
  return { config, reports };
}

async function defaultTargets() {
  const built = await readFile(path.join(ROOT, 'dist/index.html'), 'utf8').catch(() => null);
  return built ? ['dist/index.html'] : ['index.html'];
}

async function main(argv) {
  const asJson = argv.includes('--json');
  const outIndex = argv.indexOf('--out');
  const outFile = outIndex >= 0 ? argv[outIndex + 1] : null;
  const skip = outIndex >= 0 ? outIndex + 1 : -1; // --out consumes the next argv slot
  const targets = argv.filter((a, i) => !a.startsWith('--') && i !== skip);

  const resolved = targets.length
    ? targets
    : argv.includes('--all')
      ? await prerenderedTargets()
      : await defaultTargets();
  const { config, reports } = await audit(resolved);
  const markdown = renderMarkdown(reports, config);

  if (asJson) console.log(JSON.stringify({ generatedAt: new Date().toISOString(), reports }, null, 2));
  else console.log(markdown);

  if (outFile) {
    await mkdir(path.dirname(path.resolve(ROOT, outFile)), { recursive: true });
    await writeFile(path.resolve(ROOT, outFile), markdown);
    console.error(`\nReport written to ${outFile}`);
  }

  const blocking = reports.some((r) =>
    r.checks.some((c) => c.status === 'fail' && (c.severity === 'critical' || c.severity === 'high')),
  );
  process.exitCode = blocking ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`seo:audit failed — ${err.message}`);
    process.exitCode = 2;
  });
}
