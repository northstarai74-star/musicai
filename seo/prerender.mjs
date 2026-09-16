#!/usr/bin/env node
/**
 * Static pre-render — the fix for the "SPA ships an empty #root" blocker.
 *
 *   node seo/prerender.mjs             # write index.html body + public/**\/index.html
 *   node seo/prerender.mjs --dry-run   # list what would be written
 *   node seo/prerender.mjs --check     # exit 1 if the output on disk is stale (CI)
 *
 * Two things happen here:
 *
 * 1. index.html gets the home page body injected into #root between managed
 *    markers. React still owns the page at runtime — it replaces the markup on
 *    mount — so the injected copy deliberately mirrors what the app renders.
 *
 * 2. Catalogue pages (/library, /song/*, /artist/*, /language/*) are written as
 *    standalone HTML under public/, which Vite copies verbatim into dist/. They
 *    carry no app bundle: a crawler and a visitor both get the same static page
 *    with real links back into the app.
 *
 * Only catalogue-derived pages are generated. /search, /likes and /premium are
 * app state, not content, and stay out until there is real routing.
 */
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { artistsOf, loadCatalog, loadConfig, ROOT } from './lib/site.mjs';
import { artistPage, homeBody, languagePage, libraryPage, renderDocument, songPage } from './lib/render.mjs';

const START = '<!-- seo:prerender:start -->';
const END = '<!-- seo:prerender:end -->';

/** Directories under public/ that this script owns end to end. */
export const MANAGED_DIRS = ['library', 'song', 'artist', 'language'];

/** Page models for every route the catalogue can fill. */
export async function buildPages() {
  const config = await loadConfig();
  const songs = await loadCatalog();
  const languages = [...new Set(songs.map((s) => s.language))];

  const pages = [libraryPage({ songs, config })];
  for (const song of songs) pages.push(songPage({ song, songs, config }));
  for (const [artist, tracks] of artistsOf(songs)) pages.push(artistPage({ artist, tracks, songs, config }));
  for (const language of languages) {
    pages.push(languagePage({ language, tracks: songs.filter((s) => s.language === language), songs, config }));
  }

  for (const page of pages) {
    page.file = path.posix.join('public', page.path.replace(/^\//, ''), 'index.html');
    page.html = renderDocument({ config, ...page });
  }

  return { config, songs, pages, home: homeBody({ songs, config }) };
}

/** index.html with the home body inside #root, idempotently. */
export function injectHome(html, body) {
  const block = `${START}\n${body}\n      ${END}`;
  if (html.includes(START)) {
    return html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
  }
  return html.replace(
    /<div\b([^>]*)id=(["'])root\2([^>]*)>([\s\S]*?)<\/div>/i,
    (_m, before, q, after) => `<div${before}id=${q}root${q}${after}>\n      ${block}\n    </div>`,
  );
}

async function writeAll({ pages, home }) {
  const indexFile = path.join(ROOT, 'index.html');
  const current = await readFile(indexFile, 'utf8');
  const next = injectHome(current, home);
  if (next === current && !current.includes(START)) {
    throw new Error('index.html has no <div id="root"> to inject into');
  }
  await writeFile(indexFile, next);

  for (const dir of MANAGED_DIRS) {
    await rm(path.join(ROOT, 'public', dir), { recursive: true, force: true });
  }
  for (const page of pages) {
    const file = path.join(ROOT, page.file);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, page.html);
  }
}

/** True when every generated file on disk matches what we would write now. */
export async function checkFresh({ pages, home }) {
  const stale = [];
  const index = await readFile(path.join(ROOT, 'index.html'), 'utf8').catch(() => '');
  if (!index.includes(START) || injectHome(index, home) !== index) stale.push('index.html');

  for (const page of pages) {
    const disk = await readFile(path.join(ROOT, page.file), 'utf8').catch(() => null);
    if (disk !== page.html) stale.push(page.file);
  }

  const expected = new Set(pages.map((p) => p.file));
  for (const dir of MANAGED_DIRS) {
    for (const file of await walk(path.join(ROOT, 'public', dir))) {
      const rel = path.relative(ROOT, file).split(path.sep).join('/');
      if (!expected.has(rel)) stale.push(`${rel} (orphan)`);
    }
  }
  return stale;
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function main(argv) {
  const built = await buildPages();
  const { pages } = built;

  if (argv.includes('--dry-run')) {
    console.log(`index.html  (home body, ${built.home.length} bytes)`);
    for (const page of pages) console.log(`${page.file.padEnd(58)} ${page.path}`);
    console.log(`\n${pages.length + 1} page(s) would be written`);
    return;
  }

  if (argv.includes('--check')) {
    const stale = await checkFresh(built);
    if (stale.length) {
      console.error(`pre-rendered output is stale — run \`npm run seo:prerender\`:\n  ${stale.join('\n  ')}`);
      process.exitCode = 1;
      return;
    }
    console.log(`pre-render up to date (${pages.length + 1} pages)`);
    return;
  }

  await writeAll(built);
  const byKind = pages.reduce((acc, p) => {
    const kind = p.path.split('/')[1];
    acc[kind] = (acc[kind] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`index.html updated — home body injected into #root (${built.home.length} bytes)`);
  console.log(
    `public/ written — ${pages.length} static pages (${Object.entries(byKind)
      .map(([k, n]) => `${n} ${k}`)
      .join(', ')})`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`seo:prerender failed — ${err.message}`);
    process.exitCode = 1;
  });
}
