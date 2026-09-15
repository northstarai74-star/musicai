#!/usr/bin/env node
/**
 * Builds schema.org JSON-LD for the site and, with --inject, writes it into
 * index.html between managed markers so re-running is idempotent.
 *
 *   node seo/schema.mjs            # print the JSON-LD
 *   node seo/schema.mjs --inject   # write it into index.html
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { artistsOf, formatDuration, loadCatalog, loadConfig, ROOT, songPath } from './lib/site.mjs';

const START = '<!-- seo:schema:start -->';
const END = '<!-- seo:schema:end -->';

export async function buildSchema() {
  const config = await loadConfig();
  const songs = await loadCatalog();
  const { origin, name, tagline, defaultLocale } = config.site;

  const website = {
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    url: `${origin}/`,
    name,
    description: `${name} — ${tagline}. Stream Hindi, Punjabi and English songs online.`,
    inLanguage: defaultLocale,
    publisher: { '@id': `${origin}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${origin}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };

  const organization = {
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name,
    url: `${origin}/`,
    slogan: tagline,
    logo: { '@type': 'ImageObject', url: `${origin}/images/logo.png` },
  };

  const recordings = songs.map((song) => ({
    '@type': 'MusicRecording',
    '@id': `${origin}${songPath(song)}#recording`,
    name: song.title,
    url: `${origin}${songPath(song)}`,
    duration: formatDuration(song.duration),
    inLanguage: song.language,
    image: song.image ? `${origin}${song.image}` : undefined,
    byArtist: String(song.artist)
      .split(/\s*(?:&|,|feat\.|ft\.)\s*/i)
      .filter(Boolean)
      .map((artist) => ({ '@type': 'MusicGroup', name: artist.trim() })),
  }));

  const catalogue = {
    '@type': 'ItemList',
    '@id': `${origin}/#catalogue`,
    name: `Trending on ${name}`,
    numberOfItems: recordings.length,
    itemListElement: recordings.map((recording, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: recording.url,
      name: recording.name,
    })),
  };

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [website, organization, catalogue, ...recordings],
  };

  return { graph, artistCount: artistsOf(songs).size, songCount: songs.length };
}

function render(graph) {
  return `${START}\n    <script type="application/ld+json">\n${JSON.stringify(graph, null, 2)
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n')}\n    </script>\n    ${END}`;
}

async function main(argv) {
  const { graph, songCount, artistCount } = await buildSchema();

  if (!argv.includes('--inject')) {
    console.log(JSON.stringify(graph, null, 2));
    return;
  }

  const file = path.join(ROOT, 'index.html');
  const html = await readFile(file, 'utf8');
  const block = render(graph);
  const next = html.includes(START)
    ? html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block)
    : html.replace('</head>', `  ${block}\n  </head>`);

  await writeFile(file, next);
  console.log(`index.html updated — JSON-LD for ${songCount} recordings and ${artistCount} artists`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(`seo:schema failed — ${err.message}`);
    process.exitCode = 1;
  });
}
