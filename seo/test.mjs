#!/usr/bin/env node
/**
 * Test suite for the SEO toolkit — `npm run seo:test`.
 * node:test + node:assert only, no install required.
 */
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { promisify } from 'node:util';

import { audit } from './audit.mjs';
import { buildKeywordMap } from './keywords.mjs';
import { runChecks, RULES } from './lib/checks.mjs';
import * as H from './lib/html.mjs';
import { artistsOf, formatDuration, loadCatalog, loadConfig, loadDocument, ROOT, slug, songPath } from './lib/site.mjs';
import { buildSchema } from './schema.mjs';
import { buildSitemap } from './sitemap.mjs';

const execFileAsync = promisify(execFile);
const cli = (script, args = []) =>
  execFileAsync(process.execPath, [path.join(ROOT, 'seo', script), ...args], { cwd: ROOT })
    .then((r) => ({ ...r, code: 0 }))
    .catch((e) => ({ stdout: e.stdout ?? '', stderr: e.stderr ?? e.message, code: e.code ?? 1 }));

const tmpdirs = [];
async function tmp() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'seo-test-'));
  tmpdirs.push(dir);
  return dir;
}
after(async () => {
  for (const dir of tmpdirs) await rm(dir, { recursive: true, force: true });
});

const PERFECT_PAGE = `<!doctype html>
<html lang="en-IN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Stream Hindi and Punjabi Songs Free Online Today</title>
    <meta name="description" content="Stream Bollywood, Punjabi and English hits free. Trending tracks, artist collections and language playlists with no download and no signup required.">
    <link rel="canonical" href="https://desiswagtunes.com/">
    <link rel="icon" href="/favicon.svg">
    <meta property="og:title" content="Stream Hindi and Punjabi Songs Free">
    <meta property="og:description" content="Free music streaming.">
    <meta property="og:image" content="https://desiswagtunes.com/og.png">
    <meta property="og:url" content="https://desiswagtunes.com/">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"DesiSwagTunes"}</script>
  </head>
  <body>
    <h1>Stream Hindi and Punjabi songs free</h1>
    <h2>Trending now</h2>
    <p>${'word '.repeat(300)}</p>
    <img src="/images/song-1.avif" alt="Tera Ban Jaunga album cover" loading="lazy" width="300" height="300">
    <a href="/search">Search</a><a href="/library">Library</a><a href="/likes">Likes</a>
    <a href="/premium">Premium</a><a href="/">Home</a>
  </body>
</html>`;

const ASSETS_OK = {
  'robots.txt': { path: 'public/robots.txt', body: 'User-agent: *\nAllow: /\nSitemap: https://desiswagtunes.com/sitemap.xml' },
  'sitemap.xml': { path: 'public/sitemap.xml', body: '<urlset><url><loc>https://desiswagtunes.com/</loc></url></urlset>' },
};

const config = await loadConfig();
const check = (html, id, assets = ASSETS_OK) =>
  runChecks({ html, config, assets }).checks.find((c) => c.id === id);

describe('html parsing', () => {
  it('reads meta by name and by property', () => {
    assert.equal(H.meta(PERFECT_PAGE, 'description').slice(0, 6), 'Stream');
    assert.equal(H.meta(PERFECT_PAGE, 'og:type'), 'website');
    assert.equal(H.meta(PERFECT_PAGE, 'nope'), null);
  });

  it('reads rel links, including multi-value rel', () => {
    assert.equal(H.link(PERFECT_PAGE, 'canonical'), 'https://desiswagtunes.com/');
    assert.equal(H.link('<link rel="shortcut icon" href="/f.ico">', 'icon'), '/f.ico');
  });

  it('extracts headings in document order', () => {
    assert.deepEqual(
      H.headings('<h1>A</h1><h3>B</h3><h2>C</h2>').map((h) => h.level),
      [1, 3, 2],
    );
  });

  it('excludes script and style text from the word count', () => {
    const html = '<body><script>var a = "lots of words in here";</script><style>.a{color:red}</style><p>one two three</p></body>';
    assert.equal(H.wordCount(html), 3);
  });

  it('parses JSON-LD and reports malformed blocks instead of throwing', () => {
    assert.equal(H.jsonLd(PERFECT_PAGE)[0]['@type'], 'WebSite');
    const bad = H.jsonLd('<script type="application/ld+json">{ nope }</script>');
    assert.ok(bad[0].error, 'malformed block should carry an error');
  });

  it('detects an empty SPA mount point', () => {
    assert.equal(H.hasEmptyRoot('<div id="root"></div>'), true);
    assert.equal(H.hasEmptyRoot('<div id="root"><h1>Hi</h1></div>'), false);
    assert.equal(H.hasEmptyRoot('<div id="app"></div>'), false, 'no #root means nothing to judge');
  });

  it('classifies anchors as internal or external against the origin', () => {
    const html = '<a href="/search">a</a><a href="https://desiswagtunes.com/x">b</a><a href="https://spotify.com">c</a><a href="#top">d</a><a href="mailto:x@y.z">e</a>';
    const links = H.anchors(html, 'https://desiswagtunes.com');
    assert.equal(links.length, 3, 'fragment and mailto links are not navigation');
    assert.deepEqual(links.map((l) => l.internal), [true, true, false]);
  });

  it('handles single-quoted and unquoted attributes', () => {
    assert.equal(H.attrs("src='/a.png' alt=hello loading='lazy'").alt, 'hello');
  });
});

describe('audit rules', () => {
  it('scores a well-formed page highly', () => {
    const result = runChecks({ html: PERFECT_PAGE, config, assets: ASSETS_OK });
    assert.ok(result.score >= 95, `expected >=95, got ${result.score}`);
    assert.equal(result.counts.fail, 0);
  });

  it('every rule declares an id, title and known severity', () => {
    const ids = new Set();
    for (const rule of RULES) {
      assert.ok(rule.id && rule.title, 'rule missing id/title');
      assert.ok(['critical', 'high', 'medium', 'low'].includes(rule.severity), `bad severity on ${rule.id}`);
      assert.ok(!ids.has(rule.id), `duplicate rule id ${rule.id}`);
      ids.add(rule.id);
    }
  });

  it('fails a noindex page', () => {
    const html = PERFECT_PAGE.replace('<meta charset="UTF-8">', '<meta name="robots" content="noindex, nofollow">');
    assert.equal(check(html, 'indexable').status, 'fail');
  });

  it('fails an unrendered SPA shell', () => {
    const result = check('<html><body><div id="root"></div></body></html>', 'crawlable-content');
    assert.equal(result.status, 'fail');
    assert.match(result.fix, /pre-render|SSR/i);
  });

  it('warns on an out-of-range title and fails on a missing one', () => {
    assert.equal(check(PERFECT_PAGE.replace(/<title>[^<]*<\/title>/, '<title>Home</title>'), 'title').status, 'warn');
    assert.equal(check(PERFECT_PAGE.replace(/<title>[^<]*<\/title>/, ''), 'title').status, 'fail');
  });

  it('warns on multiple H1s', () => {
    const result = check(PERFECT_PAGE.replace('<h2>Trending now</h2>', '<h1>Trending now</h1>'), 'h1');
    assert.equal(result.status, 'warn');
    assert.match(result.detail, /2 H1s/);
  });

  it('flags skipped heading levels', () => {
    assert.equal(check('<h1>A</h1><h4>B</h4>', 'heading-order').status, 'warn');
    assert.equal(check('<h1>A</h1><h2>B</h2><h3>C</h3>', 'heading-order').status, 'pass');
  });

  it('escalates alt-text failures with the share of images affected', () => {
    const one = '<img src="a.png" alt="described">';
    const bare = '<img src="b.png">';
    assert.equal(check(one + bare + one + one, 'image-alt').status, 'warn', '25% missing is a warning');
    assert.equal(check(bare + bare + one, 'image-alt').status, 'fail', 'most images missing is a failure');
    assert.equal(check('<p>no images</p>', 'image-alt').status, 'skip');
  });

  it('treats an empty alt string as missing', () => {
    assert.equal(check('<img src="a.png" alt="">', 'image-alt').status, 'fail');
  });

  it('fails invalid JSON-LD even though a block is present', () => {
    const html = PERFECT_PAGE.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '<script type="application/ld+json">{ broken }</script>');
    assert.equal(check(html, 'structured-data').status, 'fail');
  });

  it('fails a page with no crawlable internal links', () => {
    const html = PERFECT_PAGE.replace(/<a [\s\S]*?<\/a>/g, '<button>Search</button>');
    const result = check(html, 'internal-links');
    assert.equal(result.status, 'fail');
    assert.match(result.fix, /click handlers/i);
  });

  it('fails robots.txt that disallows the whole site', () => {
    const assets = { ...ASSETS_OK, 'robots.txt': { path: 'public/robots.txt', body: 'User-agent: *\nDisallow: /\nSitemap: https://x/sitemap.xml' } };
    assert.equal(check(PERFECT_PAGE, 'robots-txt', assets).status, 'fail');
  });

  it('warns when robots.txt omits the sitemap directive', () => {
    const assets = { ...ASSETS_OK, 'robots.txt': { path: 'public/robots.txt', body: 'User-agent: *\nAllow: /' } };
    assert.equal(check(PERFECT_PAGE, 'robots-txt', assets).status, 'warn');
  });

  it('fails an empty sitemap and reports URL count for a good one', () => {
    const empty = { ...ASSETS_OK, 'sitemap.xml': { path: 'public/sitemap.xml', body: '<urlset></urlset>' } };
    assert.equal(check(PERFECT_PAGE, 'sitemap', empty).status, 'fail');
    assert.match(check(PERFECT_PAGE, 'sitemap').detail, /1 URLs/);
  });

  it('reports missing assets rather than throwing', () => {
    const none = { 'robots.txt': null, 'sitemap.xml': null };
    assert.equal(check(PERFECT_PAGE, 'robots-txt', none).status, 'fail');
    assert.equal(check(PERFECT_PAGE, 'sitemap', none).status, 'fail');
  });

  it('survives a rule that throws', () => {
    const broken = { id: 'boom', title: 'Boom', severity: 'low', run: () => { throw new Error('kaboom'); } };
    RULES.push(broken);
    try {
      const result = runChecks({ html: PERFECT_PAGE, config, assets: ASSETS_OK });
      const boom = result.checks.find((c) => c.id === 'boom');
      assert.equal(boom.status, 'skip');
      assert.match(boom.detail, /kaboom/);
    } finally {
      RULES.pop();
    }
  });

  it('weights severity: a critical failure costs more than a low one', () => {
    const noFavicon = runChecks({ html: PERFECT_PAGE.replace(/<link rel="icon"[^>]*>/, ''), config, assets: ASSETS_OK });
    const noTitle = runChecks({ html: PERFECT_PAGE.replace(/<title>[^<]*<\/title>/, ''), config, assets: ASSETS_OK });
    assert.ok(noTitle.score < noFavicon.score, 'title (critical) must outweigh favicon (low)');
  });

  it('skipped rules do not drag the score down', () => {
    const noImages = PERFECT_PAGE.replace(/<img[^>]*>/g, '');
    assert.ok(runChecks({ html: noImages, config, assets: ASSETS_OK }).score >= 95);
  });
});

describe('site helpers', () => {
  it('slugifies without stray or repeated dashes', () => {
    assert.equal(slug('Punjabi MC - Mundian To Bach Ke'), 'punjabi-mc-mundian-to-bach-ke');
    assert.equal(slug('Kesariya (Brahmāstra)'), 'kesariya-brahmastra', 'diacritics fold to ASCII');
    assert.equal(slug('  spaced  out  '), 'spaced-out');
  });

  it('parses the catalogue including booleans and numbers', async () => {
    const songs = await loadCatalog();
    assert.equal(songs.length, 10);
    const tumHiHo = songs.find((s) => s.title === 'Tum Hi Ho');
    assert.equal(tumHiHo.duration, 242);
    assert.equal(tumHiHo.trending, true);
    assert.equal(tumHiHo.language, 'Hindi');
    for (const song of songs) assert.ok(song.id && song.title && song.artist, `incomplete song ${song.title}`);
  });

  it('splits collaboration credits into individual artists', async () => {
    const artists = artistsOf(await loadCatalog());
    assert.ok(artists.has('Arijit Singh'));
    assert.ok(artists.has('Tulsi Kumar'), '"A & B" credits must split');
    assert.equal(artists.get('Arijit Singh').length, 3);
  });

  it('builds ISO 8601 durations', () => {
    assert.equal(formatDuration(213), 'PT3M33S');
    assert.equal(formatDuration(242), 'PT4M02S');
    assert.equal(formatDuration(undefined), 'PT0M00S');
  });

  it('loads a document from a file and from a directory', async () => {
    const fromFile = await loadDocument('index.html');
    const fromDir = await loadDocument('.');
    assert.equal(fromFile.html, fromDir.html, 'a directory resolves to its index.html');
    assert.equal(fromFile.kind, 'file');
  });
});

describe('sitemap and robots', () => {
  it('lists only live routes by default', async () => {
    const { xml, entries } = await buildSitemap();
    assert.equal(entries.length, config.routes.length);
    assert.ok(!xml.includes('/song/'), 'catalogue URLs must stay opt-in');
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  it('adds song and artist URLs with --include-catalog', async () => {
    const songs = await loadCatalog();
    const { entries } = await buildSitemap({ includeCatalog: true });
    assert.equal(entries.length, config.routes.length + songs.length + artistsOf(songs).size);
    assert.ok(entries.some((e) => e.loc.endsWith(songPath(songs[0]))));
  });

  it('emits absolute, deduplicated, well-formed URLs', async () => {
    const { entries } = await buildSitemap({ includeCatalog: true });
    const locs = entries.map((e) => e.loc);
    assert.equal(new Set(locs).size, locs.length, 'duplicate <loc> entries');
    for (const loc of locs) {
      assert.doesNotThrow(() => new URL(loc), `invalid URL ${loc}`);
      assert.ok(!/\s|&(?!amp;)/.test(loc), `unescaped character in ${loc}`);
    }
  });

  it('points robots.txt at the sitemap and allows crawling', async () => {
    const { robots } = await buildSitemap();
    assert.match(robots, /Sitemap: https:\/\/[^\s]+\/sitemap\.xml/);
    assert.ok(!/^\s*Disallow:\s*\/\s*$/m.test(robots), 'must not disallow the whole site');
  });
});

describe('structured data', () => {
  it('produces a valid, serialisable @graph', async () => {
    const { graph, songCount } = await buildSchema();
    assert.equal(graph['@context'], 'https://schema.org');
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(graph)));
    const types = graph['@graph'].map((n) => n['@type']);
    assert.ok(types.includes('WebSite') && types.includes('Organization') && types.includes('ItemList'));
    assert.equal(types.filter((t) => t === 'MusicRecording').length, songCount);
  });

  it('gives every recording a resolvable URL, artist and ISO duration', async () => {
    const { graph } = await buildSchema();
    for (const node of graph['@graph'].filter((n) => n['@type'] === 'MusicRecording')) {
      assert.doesNotThrow(() => new URL(node.url));
      assert.match(node.duration, /^PT\d+M\d{2}S$/);
      assert.ok(node.byArtist.length > 0 && node.byArtist.every((a) => a.name));
    }
  });

  it('wires the SearchAction to the real search route', async () => {
    const { graph } = await buildSchema();
    const website = graph['@graph'].find((n) => n['@type'] === 'WebSite');
    assert.match(website.potentialAction.target.urlTemplate, /\/search\?q=\{search_term_string\}/);
  });

  it('injects idempotently — repeat runs leave one block', async () => {
    const before = await readFile(path.join(ROOT, 'index.html'), 'utf8');
    await cli('schema.mjs', ['--inject']);
    await cli('schema.mjs', ['--inject']);
    const after = await readFile(path.join(ROOT, 'index.html'), 'utf8');
    assert.equal((after.match(/seo:schema:start/g) || []).length, 1);
    assert.equal(before, after, 'a no-op re-run must not change the file');
  });
});

describe('keyword map', () => {
  it('covers routes, songs, artists and languages', async () => {
    const { clusters } = await buildKeywordMap();
    for (const prefix of ['page:', 'song:', 'artist:', 'language:']) {
      assert.ok(clusters.some((c) => c.cluster.startsWith(prefix)), `no ${prefix} cluster`);
    }
  });

  it('keeps generated titles and descriptions inside the configured limits', async () => {
    const { clusters } = await buildKeywordMap();
    const [, maxTitle] = config.targets.titleLength;
    const [minDesc, maxDesc] = config.targets.descriptionLength;
    for (const c of clusters) {
      assert.ok(c.title.length <= maxTitle, `title too long (${c.title.length}): ${c.title}`);
      assert.ok(c.description.length <= maxDesc, `description too long (${c.description.length}): ${c.description}`);
      assert.ok(c.description.length >= minDesc, `description too short (${c.description.length}): ${c.description}`);
    }
  });

  it('deduplicates keywords and classifies intent', async () => {
    const { clusters } = await buildKeywordMap();
    for (const c of clusters) {
      const words = c.keywords.map((k) => k.keyword);
      assert.equal(new Set(words).size, words.length, `duplicate keyword in ${c.cluster}`);
      for (const k of c.keywords) {
        assert.ok(['informational', 'transactional', 'navigational'].includes(k.intent));
        assert.ok(k.priority >= 0 && k.priority <= 100);
      }
    }
  });

  it('sorts clusters by priority, trending tracks first', async () => {
    const { clusters } = await buildKeywordMap();
    const priorities = clusters.map((c) => c.priority);
    assert.deepEqual(priorities, [...priorities].sort((a, b) => b - a));
  });

  it('merges volume data from a CSV export', async () => {
    const dir = await tmp();
    const csv = path.join(dir, 'export.csv');
    await writeFile(csv, 'Keyword,Volume,Difficulty\n"tum hi ho",165000,42\n"kesariya",90500,38\n');
    const { clusters, hasVolumes } = await buildKeywordMap({ volumesFile: csv });
    assert.equal(hasVolumes, true);
    const hit = clusters.flatMap((c) => c.keywords).find((k) => k.keyword === 'tum hi ho');
    assert.equal(hit.volume, 165000);
    assert.equal(hit.difficulty, 42);
  });

  it('rejects a CSV with no keyword column, naming the columns it found', async () => {
    const dir = await tmp();
    const csv = path.join(dir, 'bad.csv');
    await writeFile(csv, 'term,searches\nfoo,100\n');
    await assert.rejects(() => buildKeywordMap({ volumesFile: csv }), /no keyword column.*term/s);
  });
});

describe('command line', () => {
  it('audits the positional target instead of the default', async () => {
    const dir = await tmp();
    const file = path.join(dir, 'page.html');
    await writeFile(file, PERFECT_PAGE);
    const { stdout } = await cli('audit.mjs', [file]);
    assert.match(stdout, /page\.html/);
    assert.ok(!/Crawlable HTML content.*fail/i.test(stdout));
  });

  it('writes a report with --out and still audits the target', async () => {
    const dir = await tmp();
    const out = path.join(dir, 'report.md');
    const { stdout } = await cli('audit.mjs', ['index.html', '--out', out]);
    const written = await readFile(out, 'utf8');
    assert.match(written, /# SEO audit/);
    assert.match(stdout, /index\.html/);
    assert.ok(!written.includes('report.md'), '--out value must not be audited as a target');
  });

  it('exits non-zero on critical or high failures and zero on a clean page', async () => {
    const dir = await tmp();
    const bad = path.join(dir, 'bad.html');
    await writeFile(bad, '<html><body><div id="root"></div></body></html>');
    assert.equal((await cli('audit.mjs', [bad])).code, 1, 'blockers must fail CI');

    const good = path.join(dir, 'good.html');
    await writeFile(good, PERFECT_PAGE);
    assert.equal((await cli('audit.mjs', [good])).code, 0);
  });

  it('emits parseable JSON with --json', async () => {
    const { stdout } = await cli('audit.mjs', ['index.html', '--json']);
    const parsed = JSON.parse(stdout);
    assert.equal(parsed.reports.length, 1);
    assert.equal(parsed.reports[0].checks.length, RULES.length);
  });

  it('reports a missing target as an error, not a crash', async () => {
    const { code, stderr } = await cli('audit.mjs', ['does-not-exist.html']);
    assert.equal(code, 2);
    assert.match(stderr, /seo:audit failed/);
  });

  it('--dry-run prints the sitemap without touching public/', async () => {
    const before = await readFile(path.join(ROOT, 'public/sitemap.xml'), 'utf8').catch(() => null);
    const { stdout } = await cli('sitemap.mjs', ['--dry-run']);
    assert.match(stdout, /<urlset/);
    assert.match(stdout, /User-agent/);
    assert.equal(await readFile(path.join(ROOT, 'public/sitemap.xml'), 'utf8').catch(() => null), before);
  });

  it('routes run.mjs subcommands', async () => {
    assert.match((await cli('run.mjs', ['sitemap', '--dry-run'])).stdout, /<urlset/);
    assert.match((await cli('run.mjs', ['keywords'])).stdout, /# Keyword map/);
    assert.match((await cli('run.mjs', ['schema'])).stdout, /"@context": "https:\/\/schema\.org"/);
  });
});

describe('audit of the real index.html', () => {
  it('runs end to end and reports a score', async () => {
    const { reports } = await audit(['index.html']);
    assert.equal(reports.length, 1);
    assert.ok(reports[0].score > 0 && reports[0].score <= 100);
    assert.equal(reports[0].checks.length, RULES.length);
  });

  it('still names the unrendered SPA as the top blocker', async () => {
    const { reports } = await audit(['index.html']);
    const blocker = reports[0].checks.find((c) => c.id === 'crawlable-content');
    assert.equal(blocker.status, 'fail', 'if this passes, the SPA got pre-rendered — update the agent playbook');
  });
});

describe('agent definition', () => {
  const KNOWN_TOOLS = new Set([
    'Read', 'Write', 'Edit', 'MultiEdit', 'Bash', 'Glob', 'Grep',
    'WebFetch', 'WebSearch', 'Task', 'TodoWrite', 'NotebookEdit',
  ]);

  const frontmatter = (raw) => {
    const m = /^---\n([\s\S]*?)\n---/.exec(raw);
    assert.ok(m, 'file must open with YAML frontmatter');
    return Object.fromEntries(
      m[1]
        .split('\n')
        .filter((line) => /^\w[\w-]*:/.test(line))
        .map((line) => {
          const i = line.indexOf(':');
          return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
        }),
    );
  };

  it('declares a name matching its filename and a description that can trigger it', async () => {
    const raw = await readFile(path.join(ROOT, '.claude/agents/seo.md'), 'utf8');
    const fm = frontmatter(raw);
    assert.equal(fm.name, 'seo');
    assert.ok(fm.description.length > 40, 'description is what routes work to the agent');
    for (const term of ['audit', 'keyword', 'schema', 'sitemap']) {
      assert.match(fm.description.toLowerCase(), new RegExp(term), `description should mention ${term}`);
    }
  });

  it('requests only real tools, including the ones its playbook needs', async () => {
    const raw = await readFile(path.join(ROOT, '.claude/agents/seo.md'), 'utf8');
    const tools = frontmatter(raw).tools.split(',').map((t) => t.trim());
    for (const tool of tools) assert.ok(KNOWN_TOOLS.has(tool), `unknown tool "${tool}"`);
    for (const needed of ['Bash', 'Read', 'Edit']) {
      assert.ok(tools.includes(needed), `agent cannot run its own workflow without ${needed}`);
    }
  });

  it('only references npm scripts that exist', async () => {
    const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
    const docs = await Promise.all(
      ['.claude/agents/seo.md', '.claude/commands/seo.md', 'seo/README.md'].map((f) =>
        readFile(path.join(ROOT, f), 'utf8'),
      ),
    );
    for (const doc of docs) {
      for (const [, script] of doc.matchAll(/npm run (seo(?::[a-z]+)?)\b/g)) {
        assert.ok(pkg.scripts[script], `documented script "npm run ${script}" is not in package.json`);
      }
    }
  });

  it('every seo npm script runs a file that exists and parses', async () => {
    const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
    for (const [name, command] of Object.entries(pkg.scripts)) {
      if (!name.startsWith('seo')) continue;
      const [script] = command.match(/seo\/[\w./]+\.mjs/) ?? [];
      assert.ok(script, `"${name}" does not run a script under seo/`);
      await stat(path.join(ROOT, script));
      // --check parses without executing. Spawning these scripts here would
      // recurse into this very file through the seo:test entry.
      await execFileAsync(process.execPath, ['--check', path.join(ROOT, script)]);
    }
  });

  it('references only files that exist', async () => {
    const raw = await readFile(path.join(ROOT, '.claude/agents/seo.md'), 'utf8');
    for (const [, ref] of raw.matchAll(/`((?:seo|src|public|\.claude)\/[\w./-]+)`/g)) {
      await stat(path.join(ROOT, ref)); // throws if the referenced path drifted
    }
  });
});
