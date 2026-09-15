#!/usr/bin/env node
/**
 * Builds the keyword map: every catalogue entry and route expanded into head
 * terms and long-tails, grouped into clusters with a target URL, an intent and
 * a ready-to-paste title/description.
 *
 *   node seo/keywords.mjs
 *   node seo/keywords.mjs --json
 *   node seo/keywords.mjs --volumes semrush-export.csv   # merge real volume data
 *   node seo/keywords.mjs --out seo/reports/keyword-map.md
 *
 * Priority is a heuristic (catalogue signals + term shape), NOT search volume.
 * Feed a Semrush/GSC export through --volumes before making ranking bets: any
 * CSV with `keyword` plus `volume` and/or `difficulty`/`kd` columns works.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { artistPath, artistsOf, loadCatalog, loadConfig, ROOT, songPath } from './lib/site.mjs';

const intentOf = (kw) =>
  /\b(lyrics|meaning|who sang|best|vs)\b/i.test(kw) ? 'informational'
  : /\b(download|mp3|free|listen|play|stream|online)\b/i.test(kw) ? 'transactional'
  : 'navigational';

function clamp(text, max) {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/** 0-100 heuristic: catalogue prominence + how specific the phrase is. */
function priority(keyword, { trending = false, featured = false } = {}) {
  let score = 40;
  if (trending) score += 20;
  if (featured) score += 10;
  const words = keyword.split(/\s+/).length;
  if (words >= 5) score += 15;
  else if (words >= 3) score += 8;
  if (intentOf(keyword) === 'transactional') score += 10;
  return Math.min(100, score);
}

async function loadVolumes(file) {
  const raw = await readFile(path.resolve(ROOT, file), 'utf8');
  const [headerLine, ...rows] = raw.trim().split(/\r?\n/);
  const header = headerLine.split(/[,;\t]/).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const col = (...names) => header.findIndex((h) => names.includes(h));
  const kwIndex = col('keyword', 'query', 'keywords');
  const volIndex = col('volume', 'search volume', 'avg. monthly searches', 'impressions');
  const kdIndex = col('difficulty', 'kd', 'kd %', 'keyword difficulty');
  if (kwIndex < 0) throw new Error(`no keyword column in ${file} (found: ${header.join(', ')})`);

  const map = new Map();
  for (const row of rows) {
    const cells = row.split(/[,;\t](?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.trim().replace(/^"|"$/g, ''));
    const keyword = cells[kwIndex]?.toLowerCase();
    if (!keyword) continue;
    map.set(keyword, {
      volume: volIndex >= 0 ? Number(cells[volIndex].replace(/[^\d.]/g, '')) || 0 : null,
      difficulty: kdIndex >= 0 ? Number(cells[kdIndex].replace(/[^\d.]/g, '')) || 0 : null,
    });
  }
  return map;
}

export async function buildKeywordMap({ volumesFile } = {}) {
  const config = await loadConfig();
  const songs = await loadCatalog();
  const { intent, qualifier } = config.modifiers;
  const volumes = volumesFile ? await loadVolumes(volumesFile) : new Map();
  const clusters = [];

  // Route clusters — the pages that exist today.
  for (const route of config.routes) {
    clusters.push({
      cluster: `page:${route.page}`,
      target: route.path,
      pillar: route.primaryKeyword,
      keywords: [route.primaryKeyword, ...intent.slice(0, 4).map((m) => `${m} ${route.primaryKeyword}`)],
      title: clamp(`${route.primaryKeyword.replace(/\b\w/g, (c) => c.toUpperCase())} | ${config.site.name}`, 60),
      description: clamp(
        `${config.site.name} — ${route.primaryKeyword}. Stream Hindi, Punjabi and English hits with no interruptions.`,
        160,
      ),
      signals: {},
    });
  }

  // Song clusters — the long-tail engine.
  for (const song of songs) {
    const base = `${song.title} ${song.artist}`.toLowerCase();
    const keywords = [
      song.title.toLowerCase(),
      base,
      `${song.title.toLowerCase()} song`,
      ...intent.map((m) => `${m} ${song.title.toLowerCase()}`),
      ...qualifier.slice(0, 2).map((m) => `${song.title.toLowerCase()} ${m}`),
      `${song.title.toLowerCase()} ${song.language.toLowerCase()} song online`,
    ];
    clusters.push({
      cluster: `song:${song.title}`,
      target: songPath(song),
      pillar: `${song.title.toLowerCase()} song`,
      keywords,
      title: clamp(`${song.title} — ${song.artist} | Listen Free`, 60),
      description: clamp(
        `Stream "${song.title}" by ${song.artist} in HD. ${song.language} ${song.trending ? 'trending track' : 'track'} on ${config.site.name} — free, no download needed.`,
        160,
      ),
      signals: { trending: !!song.trending, featured: !!song.featured, language: song.language },
    });
  }

  // Artist clusters — the internal-linking hubs.
  for (const [artist, tracks] of artistsOf(songs)) {
    clusters.push({
      cluster: `artist:${artist}`,
      target: artistPath(artist),
      pillar: `${artist.toLowerCase()} songs`,
      keywords: [
        `${artist.toLowerCase()} songs`,
        `${artist.toLowerCase()} all songs`,
        `best of ${artist.toLowerCase()}`,
        `${artist.toLowerCase()} hit songs online`,
        `listen ${artist.toLowerCase()} songs free`,
      ],
      title: clamp(`${artist} Songs — Listen Free | ${config.site.name}`, 60),
      description: clamp(
        `All ${tracks.length} ${artist} track${tracks.length === 1 ? '' : 's'} on ${config.site.name}, including ${tracks
          .slice(0, 2)
          .map((t) => t.title)
          .join(' and ')}. Free streaming, no signup.`,
        160,
      ),
      signals: { tracks: tracks.length, trending: tracks.some((t) => t.trending) },
    });
  }

  // Language clusters — the category hubs worth building next.
  for (const language of [...new Set(songs.map((s) => s.language))]) {
    const tracks = songs.filter((s) => s.language === language);
    clusters.push({
      cluster: `language:${language}`,
      target: `/language/${language.toLowerCase()}`,
      pillar: `${language.toLowerCase()} songs online`,
      keywords: [
        `${language.toLowerCase()} songs online`,
        `new ${language.toLowerCase()} songs`,
        `top ${language.toLowerCase()} songs 2026`,
        `${language.toLowerCase()} songs free streaming`,
        `best ${language.toLowerCase()} playlist`,
      ],
      title: clamp(`${language} Songs Online — Free Streaming | ${config.site.name}`, 60),
      description: clamp(
        `${tracks.length} ${language} tracks streaming free on ${config.site.name}. Fresh releases, trending hits and playlists — no ads, no download.`,
        160,
      ),
      signals: { tracks: tracks.length },
    });
  }

  for (const cluster of clusters) {
    cluster.keywords = [...new Set(cluster.keywords.map((k) => k.trim()))].map((keyword) => {
      const data = volumes.get(keyword.toLowerCase()) ?? {};
      return {
        keyword,
        intent: intentOf(keyword),
        priority: priority(keyword, cluster.signals),
        volume: data.volume ?? null,
        difficulty: data.difficulty ?? null,
      };
    });
    cluster.priority = Math.round(
      cluster.keywords.reduce((sum, k) => sum + k.priority, 0) / cluster.keywords.length,
    );
  }

  clusters.sort((a, b) => b.priority - a.priority);
  return { config, clusters, hasVolumes: volumes.size > 0, keywordCount: clusters.reduce((n, c) => n + c.keywords.length, 0) };
}

function renderMarkdown({ config, clusters, hasVolumes, keywordCount }) {
  const lines = [
    `# Keyword map — ${config.site.name}`,
    '',
    `_${clusters.length} clusters · ${keywordCount} keywords · ${
      hasVolumes ? 'volume data merged from export' : 'priority is heuristic — merge a Semrush/GSC export with `--volumes` before betting budget on it'
    }_`,
    '',
    '| Cluster | Target URL | Priority | Keywords |',
    '| --- | --- | --- | --- |',
    ...clusters.map((c) => `| ${c.cluster} | \`${c.target}\` | ${c.priority} | ${c.keywords.length} |`),
    '',
    '## Briefs',
    '',
  ];

  for (const cluster of clusters) {
    lines.push(
      `### ${cluster.cluster} → \`${cluster.target}\``,
      '',
      `- **Pillar keyword:** ${cluster.pillar}`,
      `- **Title (${cluster.title.length}):** ${cluster.title}`,
      `- **Description (${cluster.description.length}):** ${cluster.description}`,
      '',
      `| Keyword | Intent | Priority |${hasVolumes ? ' Volume | KD |' : ''}`,
      `| --- | --- | --- |${hasVolumes ? ' --- | --- |' : ''}`,
      ...cluster.keywords.map(
        (k) =>
          `| ${k.keyword} | ${k.intent} | ${k.priority} |${hasVolumes ? ` ${k.volume ?? '—'} | ${k.difficulty ?? '—'} |` : ''}`,
      ),
      '',
    );
  }
  return lines.join('\n');
}

async function main(argv) {
  const volIndex = argv.indexOf('--volumes');
  const outIndex = argv.indexOf('--out');
  const map = await buildKeywordMap({ volumesFile: volIndex >= 0 ? argv[volIndex + 1] : null });

  if (argv.includes('--json')) {
    console.log(JSON.stringify({ clusters: map.clusters }, null, 2));
    return;
  }

  const markdown = renderMarkdown(map);
  console.log(markdown);

  if (outIndex >= 0) {
    const out = path.resolve(ROOT, argv[outIndex + 1]);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, markdown);
    console.error(`\nKeyword map written to ${path.relative(ROOT, out)}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`seo:keywords failed — ${err.message}`);
    process.exitCode = 1;
  });
}
