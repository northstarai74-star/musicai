/**
 * Dependency-free HTML rendering for the static pre-render step.
 *
 * Everything here is a pure function of the catalogue + seo.config.json, so the
 * markup can be regenerated at any time and never drifts from src/data/songs.ts.
 *
 * Rules the copy in this file follows:
 *  - Only facts that exist in the catalogue (title, artist, language, duration,
 *    trending/featured flags, artwork). No invented release years, labels,
 *    chart positions, lyrics or ratings.
 *  - No playback or download promises: the catalogue carries no `audioUrl`, so
 *    these pages describe the track and link into the app, they do not claim to
 *    play or serve an mp3.
 */
import { artistPath, artistsOf, formatDuration, slug, songPath } from './site.mjs';

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

/** mm:ss for humans. formatDuration() in site.mjs covers the ISO 8601 form. */
export function clock(seconds) {
  const s = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function languagePath(language) {
  return `/language/${slug(language)}`;
}

/** Splits the "A & B" / "A, B" credits the catalogue stores in one string. */
export function creditedArtists(song) {
  return String(song.artist)
    .split(/\s*(?:&|,|feat\.|ft\.)\s*/i)
    .map((name) => name.trim())
    .filter(Boolean);
}

/** Title that stays inside the configured length budget without ellipsis. */
export function fitTitle(candidates, [min, max]) {
  const inRange = candidates.find((t) => t.length >= min && t.length <= max);
  if (inRange) return inRange;
  const underMax = candidates.find((t) => t.length <= max);
  return underMax ?? `${candidates[0].slice(0, max - 1).trimEnd()}…`;
}

/** Description padded with a true sentence when it would fall under the floor. */
export function fitDescription(text, filler, [min, max]) {
  let out = text.trim();
  for (const extra of filler) {
    if (out.length >= min) break;
    if (`${out} ${extra}`.length <= max) out = `${out} ${extra}`;
  }
  return out.length <= max ? out : `${out.slice(0, max - 1).trimEnd()}…`;
}

export const STYLE = `
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#3b0764;
background:linear-gradient(180deg,#fce7f3,#f3e8ff,#dbeafe);line-height:1.6}
a{color:#7e22ce}
.wrap{max-width:960px;margin:0 auto;padding:0 20px}
.site-head{background:linear-gradient(90deg,#fbcfe8,#e9d5ff,#bfdbfe);padding:14px 0}
.site-head nav a{margin-right:16px;font-size:14px;text-decoration:none}
.brand{font-weight:800;font-size:20px;text-decoration:none;display:inline-block;margin-bottom:6px}
main{padding:24px 0 48px}
h1{font-size:2rem;line-height:1.2;margin:.4em 0}
h2{font-size:1.35rem;margin:1.6em 0 .4em}
h3{font-size:1.05rem;margin:.2em 0}
.cover{width:300px;height:300px;object-fit:cover;border-radius:12px;border:2px solid #f9a8d4;max-width:100%}
.facts{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;margin:0 0 16px;font-size:15px}
.facts dt{font-weight:700}
.facts dd{margin:0}
.cta{display:inline-block;background:linear-gradient(90deg,#ec4899,#a855f7);color:#fff;
padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0}
.cards{list-style:none;padding:0;margin:0;display:grid;gap:12px;
grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.cards li{background:rgba(255,255,255,.55);border:2px solid #f9a8d4;border-radius:10px;padding:10px;
display:flex;gap:10px;align-items:center}
.cards img{width:64px;height:64px;object-fit:cover;border-radius:6px;flex:none}
.cards a{text-decoration:none;font-weight:600}
.meta{font-size:13px;color:#6b21a8;margin:2px 0 0}
.chips{list-style:none;display:flex;flex-wrap:wrap;gap:10px;padding:0;margin:8px 0}
.chips a{background:rgba(255,255,255,.6);border:2px solid #d8b4fe;border-radius:999px;
padding:6px 14px;text-decoration:none;font-size:14px}
.crumbs{font-size:13px;margin:12px 0 0}
.faq dt{font-weight:700;margin-top:12px}
.faq dd{margin:0}
.site-foot{background:linear-gradient(90deg,#fbcfe8,#e9d5ff,#bfdbfe);border-top:4px solid #f472b6;
padding:24px 0;font-size:14px;margin-top:32px}
.site-foot ul{list-style:none;display:flex;flex-wrap:wrap;gap:16px;padding:0}
`.trim();

/** <img> with the attributes the audit (and Core Web Vitals) ask for. */
export function img({ src, alt, width, height, className, eager = false }) {
  return (
    `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"` +
    ` width="${width}" height="${height}" class="${className}"` +
    (eager ? ' loading="eager" fetchpriority="high"' : ' loading="lazy" decoding="async"') +
    '>'
  );
}

export function songCard(song) {
  const href = songPath(song);
  const art = song.image
    ? img({ src: song.image, alt: `${song.title} by ${song.artist} cover art`, width: 64, height: 64, className: '' })
    : '';
  return (
    `<li>${art}<div><a href="${href}">${escapeHtml(song.title)}</a>` +
    `<p class="meta">${escapeHtml(song.artist)} · ${escapeHtml(song.language)} · ${clock(song.duration)}</p></div></li>`
  );
}

export function chipList(items) {
  return `<ul class="chips">${items
    .map((i) => `<li><a href="${i.href}">${escapeHtml(i.label)}</a></li>`)
    .join('')}</ul>`;
}

export function breadcrumbs(trail) {
  const links = trail
    .map((c, i) => (i === trail.length - 1 ? escapeHtml(c.label) : `<a href="${c.href}">${escapeHtml(c.label)}</a>`))
    .join(' › ');
  return `<p class="crumbs">${links}</p>`;
}

export function breadcrumbSchema(trail, origin) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: `${origin}${c.href}`,
    })),
  };
}

export function siteHeader(config, languages) {
  const links = [
    { href: '/', label: 'Home' },
    { href: '/library', label: 'Library' },
    ...languages.map((l) => ({ href: languagePath(l), label: `${l} songs` })),
  ];
  return (
    '<header class="site-head"><div class="wrap">' +
    `<a class="brand" href="/">${escapeHtml(config.site.name)}</a>` +
    `<nav aria-label="Primary">${links
      .map((l) => `<a href="${l.href}">${escapeHtml(l.label)}</a>`)
      .join('')}</nav>` +
    '</div></header>'
  );
}

export function siteFooter(config, languages) {
  const links = [
    { href: '/', label: 'Home' },
    { href: '/library', label: 'Full catalogue' },
    ...languages.map((l) => ({ href: languagePath(l), label: `${l} songs` })),
  ];
  return (
    '<footer class="site-foot"><div class="wrap">' +
    `<ul>${links.map((l) => `<li><a href="${l.href}">${escapeHtml(l.label)}</a></li>`).join('')}</ul>` +
    `<p>${escapeHtml(config.site.name)} — ${escapeHtml(config.site.tagline)}. ` +
    'Track details and artwork are listed for discovery; playback opens in the app.</p>' +
    '</div></footer>'
  );
}

/**
 * Full standalone document. `body` is placed inside #root so a future router
 * can hydrate the same markup instead of throwing it away.
 */
export function renderDocument({ config, path: routePath, title, description, image, ogType = 'website', body, graph, hydrated = false }) {
  const { origin, name, twitter, defaultLocale } = config.site;
  const url = `${origin}${routePath}`;
  const ogImage = image ? (image.startsWith('http') ? image : `${origin}${image}`) : null;
  const head = [
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<meta name="theme-color" content="#f9a8d4">',
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    '<link rel="icon" type="image/svg+xml" href="/vite.svg">',
    `<meta property="og:type" content="${ogType}">`,
    `<meta property="og:site_name" content="${escapeHtml(name)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : null,
    `<meta property="og:locale" content="${defaultLocale.replace('-', '_')}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    twitter ? `<meta name="twitter:site" content="${escapeHtml(twitter)}">` : null,
    `<style>${STYLE}</style>`,
    `<script type="application/ld+json">${JSON.stringify(graph)}</script>`,
  ].filter(Boolean);

  return [
    '<!doctype html>',
    `<html lang="${defaultLocale}">`,
    '  <head>',
    ...head.map((line) => `    ${line}`),
    '  </head>',
    '  <body>',
    '    <!-- Generated by `npm run seo:prerender` from src/data/songs.ts. Do not edit by hand. -->',
    '    <div id="root">',
    body,
    '    </div>',
    hydrated ? '    <script type="module" src="/src/main.tsx"></script>' : null,
    '  </body>',
    '</html>',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/* ------------------------------------------------------------------ pages */

export function songPage({ song, songs, config }) {
  const { origin } = config.site;
  const artists = creditedArtists(song);
  const sameArtist = songs.filter(
    (s) => s.id !== song.id && creditedArtists(s).some((a) => artists.includes(a)),
  );
  const sameLanguage = songs.filter((s) => s.id !== song.id && s.language === song.language).slice(0, 6);
  const trail = [
    { href: '/', label: 'Home' },
    { href: languagePath(song.language), label: `${song.language} songs` },
    { href: songPath(song), label: song.title },
  ];
  const status = [song.trending ? 'Trending now' : null, song.featured ? 'Featured' : null]
    .filter(Boolean)
    .join(' · ') || 'In the catalogue';

  const body = [
    siteHeader(config, [...new Set(songs.map((s) => s.language))]),
    '<main class="wrap">',
    breadcrumbs(trail),
    `<h1>${escapeHtml(song.title)} — ${escapeHtml(song.artist)}</h1>`,
    song.image
      ? img({
          src: song.image,
          alt: `${song.title} by ${song.artist} cover art`,
          width: 300,
          height: 300,
          className: 'cover',
          eager: true,
        })
      : '',
    '<dl class="facts">',
    `<dt>Artist</dt><dd>${artists
      .map((a) => `<a href="${artistPath(a)}">${escapeHtml(a)}</a>`)
      .join(', ')}</dd>`,
    `<dt>Language</dt><dd><a href="${languagePath(song.language)}">${escapeHtml(song.language)}</a></dd>`,
    `<dt>Runtime</dt><dd>${clock(song.duration)}</dd>`,
    `<dt>Status</dt><dd>${escapeHtml(status)}</dd>`,
    '</dl>',
    `<a class="cta" href="/?song=${escapeHtml(song.id)}">Open ${escapeHtml(song.title)} in the ${escapeHtml(config.site.name)} player</a>`,
    `<h2>About ${escapeHtml(song.title)}</h2>`,
    `<p>${escapeHtml(song.title)} is a ${escapeHtml(song.language)} track credited to ${escapeHtml(
      artists.join(' and '),
    )}, running ${clock(song.duration)}. ` +
      `It sits in the ${escapeHtml(config.site.name)} catalogue alongside ${songs.length - 1} other tracks across ` +
      `${[...new Set(songs.map((s) => s.language))].join(', ')} music, and this page collects everything we hold on it: ` +
      'the credits, the runtime, the artwork and the rest of the catalogue it connects to.</p>',
    `<p>Use the link above to open the track in the player, or follow the ${escapeHtml(
      artists[0],
    )} page for the full list of their tracks here. ` +
      `If you are browsing by language rather than by artist, the ${escapeHtml(song.language)} hub lists every ` +
      `${escapeHtml(song.language)} title we carry, newest additions included.</p>`,
    sameArtist.length
      ? `<h2>More from ${escapeHtml(artists[0])}</h2><ul class="cards">${sameArtist.map(songCard).join('')}</ul>`
      : `<h2>More ${escapeHtml(song.language)} tracks</h2>`,
    sameLanguage.length
      ? `<h2>Other ${escapeHtml(song.language)} tracks in the catalogue</h2><ul class="cards">${sameLanguage
          .map(songCard)
          .join('')}</ul>`
      : '',
    '<h2>Track FAQ</h2>',
    '<dl class="faq">',
    `<dt>Who sings ${escapeHtml(song.title)}?</dt><dd>The catalogue credits ${escapeHtml(
      artists.join(' and '),
    )}.</dd>`,
    `<dt>How long is ${escapeHtml(song.title)}?</dt><dd>${clock(song.duration)} (${formatDuration(
      song.duration,
    )}).</dd>`,
    `<dt>What language is it in?</dt><dd>It is listed as ${escapeHtml(song.language)}.</dd>`,
    `<dt>What else is on this page?</dt><dd>The credits and runtime above, the artwork, ` +
      `${sameArtist.length} related track${sameArtist.length === 1 ? '' : 's'} from the same credits and ` +
      `${sameLanguage.length} more ${escapeHtml(song.language)} title${sameLanguage.length === 1 ? '' : 's'} ` +
      'from the catalogue. It is a details page, not a file store.</dd>',
    '</dl>',
    '</main>',
    siteFooter(config, [...new Set(songs.map((s) => s.language))]),
  ]
    .filter(Boolean)
    .map((chunk) => `      ${chunk}`)
    .join('\n');

  const recording = {
    '@type': 'MusicRecording',
    '@id': `${origin}${songPath(song)}#recording`,
    name: song.title,
    url: `${origin}${songPath(song)}`,
    duration: formatDuration(song.duration),
    inLanguage: song.language,
    ...(song.image ? { image: `${origin}${song.image}` } : {}),
    byArtist: artists.map((a) => ({ '@type': 'MusicGroup', name: a, url: `${origin}${artistPath(a)}` })),
  };

  return {
    path: songPath(song),
    cluster: `song:${song.title}`,
    title: fitTitle(
      [
        `${song.title} — ${song.artist} | ${config.site.name}`,
        `${song.title} by ${song.artist} — Song Details`,
        `${song.title} — ${artists[0]} | ${song.language} Song`,
        `${song.title} — ${artists[0]}`,
      ],
      config.targets.titleLength,
    ),
    description: fitDescription(
      `${song.title} by ${song.artist}: ${song.language} track, ${clock(song.duration)}. Credits, artwork and related songs on ${config.site.name}.`,
      [`More ${song.language} music and ${artists[0]} tracks in the same catalogue.`],
      config.targets.descriptionLength,
    ),
    image: song.image,
    ogType: 'music.song',
    body,
    graph: { '@context': 'https://schema.org', '@graph': [breadcrumbSchema(trail, origin), recording] },
  };
}

export function artistPage({ artist, tracks, songs, config }) {
  const { origin } = config.site;
  const languages = [...new Set(tracks.map((t) => t.language))];
  const collaborators = [
    ...new Set(tracks.flatMap((t) => creditedArtists(t)).filter((a) => a !== artist)),
  ];
  const trail = [
    { href: '/', label: 'Home' },
    { href: '/library', label: 'Library' },
    { href: artistPath(artist), label: artist },
  ];
  const count = `${tracks.length} track${tracks.length === 1 ? '' : 's'}`;
  const own = new Set(tracks.map((t) => t.id));
  const alsoLike = songs.filter((s) => !own.has(s.id) && languages.includes(s.language)).slice(0, 6);

  const body = [
    siteHeader(config, [...new Set(songs.map((s) => s.language))]),
    '<main class="wrap">',
    breadcrumbs(trail),
    `<h1>${escapeHtml(artist)} songs on ${escapeHtml(config.site.name)}</h1>`,
    `<p>${escapeHtml(artist)} appears on ${count} in the catalogue, across ${escapeHtml(
      languages.join(' and '),
    )} music. Every title below links to its own page with credits, runtime and artwork.</p>`,
    `<h2>All ${escapeHtml(artist)} tracks</h2>`,
    `<ul class="cards">${tracks.map(songCard).join('')}</ul>`,
    collaborators.length
      ? `<h2>Credited alongside</h2>${chipList(
          collaborators.map((c) => ({ href: artistPath(c), label: c })),
        )}`
      : '',
    `<h2>Browse ${escapeHtml(artist)} by language</h2>`,
    chipList(languages.map((l) => ({ href: languagePath(l), label: `${l} songs` }))),
    `<p>The ${escapeHtml(artist)} page is a catalogue index, not a biography: it lists what ` +
      `${escapeHtml(config.site.name)} actually carries — ${escapeHtml(
        tracks.map((t) => t.title).join(', '),
      )} — with the runtime and language recorded for each one, ${clock(
        tracks.reduce((total, t) => total + (Number(t.duration) || 0), 0),
      )} of music in total. ` +
      'Open any track to see its credits in full, or use the language links above to keep browsing.</p>',
    `<h2>${escapeHtml(artist)} FAQ</h2>`,
    '<dl class="faq">',
    `<dt>How many ${escapeHtml(artist)} songs are on ${escapeHtml(config.site.name)}?</dt><dd>${count}: ${escapeHtml(
      tracks.map((t) => t.title).join(', '),
    )}.</dd>`,
    `<dt>What language does ${escapeHtml(artist)} record in here?</dt><dd>${escapeHtml(
      languages.join(' and '),
    )}, based on how the catalogue tags each track.</dd>`,
    collaborators.length
      ? `<dt>Who does ${escapeHtml(artist)} appear with?</dt><dd>${escapeHtml(
          collaborators.join(', '),
        )} — each of them has a page of their own.</dd>`
      : `<dt>Are there collaborations?</dt><dd>Not in the catalogue: every ${escapeHtml(
          artist,
        )} track here is a solo credit.</dd>`,
    `<dt>Which track is longest?</dt><dd>${escapeHtml(
      [...tracks].sort((a, b) => (Number(b.duration) || 0) - (Number(a.duration) || 0))[0].title,
    )}, at ${clock(
      [...tracks].sort((a, b) => (Number(b.duration) || 0) - (Number(a.duration) || 0))[0].duration,
    )}.</dd>`,
    '</dl>',
    alsoLike.length
      ? `<h2>More ${escapeHtml(languages[0])} music in the catalogue</h2>` +
        `<p>Other ${escapeHtml(languages[0])} titles ${escapeHtml(artist)} is not credited on, for when you ` +
        'are browsing the language rather than the artist.</p>' +
        `<ul class="cards">${alsoLike.map(songCard).join('')}</ul>`
      : '',
    '</main>',
    siteFooter(config, [...new Set(songs.map((s) => s.language))]),
  ]
    .filter(Boolean)
    .map((chunk) => `      ${chunk}`)
    .join('\n');

  return {
    path: artistPath(artist),
    cluster: `artist:${artist}`,
    title: fitTitle(
      [
        `${artist} Songs — ${count} | ${config.site.name}`,
        `${artist} Songs on ${config.site.name}`,
        `${artist} — All ${count} in the Catalogue`,
        `${artist} Songs`,
      ],
      config.targets.titleLength,
    ),
    description: fitDescription(
      `Every ${artist} track on ${config.site.name}: ${tracks
        .slice(0, 3)
        .map((t) => t.title)
        .join(', ')}. Credits, runtimes and related ${languages[0]} music.`,
      ['Browse the catalogue by artist, language or trending tracks.'],
      config.targets.descriptionLength,
    ),
    image: tracks.find((t) => t.image)?.image ?? null,
    ogType: 'profile',
    body,
    graph: {
      '@context': 'https://schema.org',
      '@graph': [
        breadcrumbSchema(trail, origin),
        {
          '@type': 'MusicGroup',
          '@id': `${origin}${artistPath(artist)}#artist`,
          name: artist,
          url: `${origin}${artistPath(artist)}`,
        },
        {
          '@type': 'ItemList',
          name: `${artist} tracks on ${config.site.name}`,
          numberOfItems: tracks.length,
          itemListElement: tracks.map((t, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${origin}${songPath(t)}`,
            name: t.title,
          })),
        },
      ],
    },
  };
}

export function languagePage({ language, tracks, songs, config }) {
  const { origin } = config.site;
  const artists = [...new Set(tracks.flatMap((t) => creditedArtists(t)))];
  const trending = tracks.filter((t) => t.trending);
  const trail = [
    { href: '/', label: 'Home' },
    { href: languagePath(language), label: `${language} songs` },
  ];

  const body = [
    siteHeader(config, [...new Set(songs.map((s) => s.language))]),
    '<main class="wrap">',
    breadcrumbs(trail),
    `<h1>${escapeHtml(language)} songs on ${escapeHtml(config.site.name)}</h1>`,
    `<p>${tracks.length} ${escapeHtml(language)} track${tracks.length === 1 ? '' : 's'} in the catalogue` +
      `${trending.length ? `, ${trending.length} of them trending right now` : ''}. ` +
      'Each one has its own page with credits, runtime and artwork.</p>',
    `<h2>Every ${escapeHtml(language)} track</h2>`,
    `<ul class="cards">${tracks.map(songCard).join('')}</ul>`,
    trending.length
      ? `<h2>Trending ${escapeHtml(language)} tracks</h2>${chipList(
          trending.map((t) => ({ href: songPath(t), label: t.title })),
        )}`
      : '',
    `<h2>${escapeHtml(language)} artists in the catalogue</h2>`,
    chipList(artists.map((a) => ({ href: artistPath(a), label: a }))),
    '<h2>Browse another language</h2>',
    chipList(
      [...new Set(songs.map((s) => s.language))]
        .filter((l) => l !== language)
        .map((l) => ({ href: languagePath(l), label: `${l} songs` })),
    ),
    `<h2>${escapeHtml(language)} songs FAQ</h2>`,
    '<dl class="faq">',
    `<dt>How many ${escapeHtml(language)} songs are listed?</dt><dd>${tracks.length} right now, ` +
      `out of ${songs.length} tracks in the whole catalogue.</dd>`,
    `<dt>Which ${escapeHtml(language)} artists are credited?</dt><dd>${escapeHtml(artists.join(', '))}.</dd>`,
    `<dt>What is the longest track here?</dt><dd>${escapeHtml(
      [...tracks].sort((a, b) => (Number(b.duration) || 0) - (Number(a.duration) || 0))[0]?.title ?? '—',
    )}, at ${clock([...tracks].sort((a, b) => (Number(b.duration) || 0) - (Number(a.duration) || 0))[0]?.duration)}.</dd>`,
    `<dt>What does each entry include?</dt><dd>The credited artists, the language, the runtime and the ` +
      'artwork we hold for the track, plus links to everything else those artists appear on.</dd>',
    '</dl>',
    `<p>This hub is generated from the ${escapeHtml(config.site.name)} catalogue, so it only lists ` +
      `${escapeHtml(language)} titles we actually carry — currently ${escapeHtml(
        tracks.map((t) => t.title).join(', '),
      )}. ` +
      'As new tracks are added to the catalogue the page updates with them, and every entry links through to ' +
      'its own details page and its artists.</p>',
    '</main>',
    siteFooter(config, [...new Set(songs.map((s) => s.language))]),
  ]
    .filter(Boolean)
    .map((chunk) => `      ${chunk}`)
    .join('\n');

  return {
    path: languagePath(language),
    cluster: `language:${language}`,
    title: fitTitle(
      [
        `${language} Songs Online — ${tracks.length} Tracks | ${config.site.name}`,
        `${language} Songs on ${config.site.name} — Full List`,
        `${language} Songs — ${config.site.name}`,
      ],
      config.targets.titleLength,
    ),
    description: fitDescription(
      `All ${tracks.length} ${language} tracks in the ${config.site.name} catalogue, from ${artists
        .slice(0, 3)
        .join(', ')}. Credits, runtimes and artwork for each.`,
      ['Browse by artist or jump straight to the trending titles.'],
      config.targets.descriptionLength,
    ),
    image: tracks.find((t) => t.image)?.image ?? null,
    body,
    graph: {
      '@context': 'https://schema.org',
      '@graph': [
        breadcrumbSchema(trail, origin),
        {
          '@type': 'CollectionPage',
          '@id': `${origin}${languagePath(language)}#page`,
          name: `${language} songs on ${config.site.name}`,
          url: `${origin}${languagePath(language)}`,
          inLanguage: language,
        },
        {
          '@type': 'ItemList',
          name: `${language} tracks`,
          numberOfItems: tracks.length,
          itemListElement: tracks.map((t, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${origin}${songPath(t)}`,
            name: t.title,
          })),
        },
      ],
    },
  };
}

export function libraryPage({ songs, config }) {
  const { origin } = config.site;
  const languages = [...new Set(songs.map((s) => s.language))];
  const artists = [...artistsOf(songs).keys()];
  const trail = [
    { href: '/', label: 'Home' },
    { href: '/library', label: 'Library' },
  ];

  const body = [
    siteHeader(config, languages),
    '<main class="wrap">',
    breadcrumbs(trail),
    `<h1>The ${escapeHtml(config.site.name)} music library</h1>`,
    `<p>Every one of the ${songs.length} tracks in the catalogue, with ${artists.length} credited artists across ` +
      `${escapeHtml(languages.join(', '))}. Open a track for its credits, runtime and artwork, or use the ` +
      'language and artist hubs to browse.</p>',
    '<h2>All tracks</h2>',
    `<ul class="cards">${songs.map(songCard).join('')}</ul>`,
    '<h2>Browse by language</h2>',
    chipList(languages.map((l) => ({ href: languagePath(l), label: `${l} songs` }))),
    '<h2>Browse by artist</h2>',
    chipList(artists.map((a) => ({ href: artistPath(a), label: a }))),
    '<h2>How this library works</h2>',
    `<p>The library is generated straight from the ${escapeHtml(config.site.name)} catalogue, so what you see ` +
      'here is exactly what the app carries — no placeholder entries and no pages for tracks we do not hold. ' +
      'Track pages list the credited artists, the language and the runtime; artist pages collect every title a ' +
      'performer appears on, including collaborations; language hubs group the catalogue for browsing.</p>',
    '</main>',
    siteFooter(config, languages),
  ]
    .map((chunk) => `      ${chunk}`)
    .join('\n');

  return {
    path: '/library',
    cluster: 'page:library',
    title: fitTitle(
      [
        `Music Library — ${songs.length} Songs | ${config.site.name}`,
        `The ${config.site.name} Music Library`,
        'Music Library',
      ],
      config.targets.titleLength,
    ),
    description: fitDescription(
      `Browse all ${songs.length} tracks in the ${config.site.name} catalogue by artist or language: Hindi, Punjabi and English titles with credits and runtimes.`,
      ['Every track links to its own details page.'],
      config.targets.descriptionLength,
    ),
    image: songs.find((s) => s.image)?.image ?? null,
    body,
    graph: {
      '@context': 'https://schema.org',
      '@graph': [
        breadcrumbSchema(trail, origin),
        {
          '@type': 'CollectionPage',
          '@id': `${origin}/library#page`,
          name: `${config.site.name} music library`,
          url: `${origin}/library`,
        },
        {
          '@type': 'ItemList',
          name: 'Full catalogue',
          numberOfItems: songs.length,
          itemListElement: songs.map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${origin}${songPath(s)}`,
            name: s.title,
          })),
        },
      ],
    },
  };
}

/**
 * The home page body injected into index.html.
 *
 * This mirrors what the React app renders (Hero, Featured, Trending, the
 * BrowseCatalogue links and the Footer). React replaces it on mount, so the two
 * have to say the same thing — anything here that the app does not render would
 * be content shown only to crawlers.
 */
export function homeBody({ songs, config }) {
  const languages = [...new Set(songs.map((s) => s.language))];
  const featured = songs.filter((s) => s.featured);
  const trending = songs.filter((s) => s.trending).slice(0, 5);
  const artists = [...artistsOf(songs).entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8)
    .map(([name]) => name);

  return [
    // Scoped to #root, so React drops it together with the rest of this block
    // when it mounts. Without it the pre-rendered copy flashes unstyled.
    `<style>${STYLE}</style>`,
    siteHeader(config, languages),
    '<main class="wrap">',
    `<h1>${escapeHtml(config.site.name)}</h1>`,
    `<p>${escapeHtml(config.site.tagline)} • Every Language • Every Moment</p>`,
    `<p>${escapeHtml(config.site.name)} is a music catalogue for Hindi, Punjabi and English listeners: ` +
      `${songs.length} tracks, ${artistsOf(songs).size} credited artists and a page for every one of them. ` +
      'Start with the featured picks, see what is trending, or browse by language and artist below.</p>',
    '<h2>Featured Songs</h2>',
    '<p>Handpicked tracks for you</p>',
    `<ul class="cards">${featured.map(songCard).join('')}</ul>`,
    '<h2>Trending Now</h2>',
    '<p>What everyone is listening to</p>',
    `<ul class="cards">${trending.map(songCard).join('')}</ul>`,
    '<h2>Browse by Language</h2>',
    '<p>Discover music in your favourite language</p>',
    chipList(
      languages.map((l) => ({
        href: languagePath(l),
        label: `${l} songs (${songs.filter((s) => s.language === l).length})`,
      })),
    ),
    '<h2>Browse by Artist</h2>',
    chipList(artists.map((a) => ({ href: artistPath(a), label: a }))),
    '<h2>Everything in one place</h2>',
    `<p>The <a href="/library">full library</a> lists all ${songs.length} tracks with their credits, language ` +
      'and runtime. Track pages carry the same details plus related titles from the same artist, so you can ' +
      'follow a credit through the catalogue instead of searching for it again.</p>',
    '</main>',
    siteFooter(config, languages),
  ]
    .map((chunk) => `      ${chunk}`)
    .join('\n');
}
