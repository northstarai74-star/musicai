/**
 * The audit rule set. Every rule returns { status, detail, fix? } where status
 * is 'pass' | 'warn' | 'fail' | 'skip', and rules never throw: a rule that
 * cannot evaluate returns 'skip' so one bad page can't sink a crawl.
 */
import * as H from './html.mjs';

const WEIGHT = { critical: 5, high: 3, medium: 2, low: 1 };

const RULES = [
  {
    id: 'indexable',
    title: 'Page is indexable',
    severity: 'critical',
    run: ({ html }) => {
      const robots = (H.meta(html, 'robots') || '').toLowerCase();
      if (robots.includes('noindex')) {
        return { status: 'fail', detail: `meta robots = "${robots}"`, fix: 'Remove noindex before launch.' };
      }
      return { status: 'pass', detail: robots ? `meta robots = "${robots}"` : 'no blocking robots directive' };
    },
  },
  {
    id: 'crawlable-content',
    title: 'Crawlable HTML content',
    severity: 'critical',
    run: ({ html }) => {
      if (H.hasEmptyRoot(html)) {
        return {
          status: 'fail',
          detail: 'the #root mount point is empty — the served HTML has no copy, headings or links',
          fix: 'Pre-render or SSR the routes (vite-plugin-ssr / react-snap / a static pre-render step) so crawlers get real markup.',
        };
      }
      const words = H.wordCount(html);
      return words > 0
        ? { status: 'pass', detail: `${words} words in the served HTML` }
        : { status: 'fail', detail: 'no text content in the served HTML' };
    },
  },
  {
    id: 'title',
    title: 'Title tag',
    severity: 'critical',
    run: ({ html, config }) => {
      const title = H.firstText(html, 'title');
      if (!title) return { status: 'fail', detail: 'missing', fix: 'Add a unique <title> per route.' };
      const [min, max] = config.targets.titleLength;
      if (title.length < min || title.length > max) {
        return {
          status: 'warn',
          detail: `"${title}" (${title.length} chars, target ${min}-${max})`,
          fix: `Rewrite to ${min}-${max} characters, primary keyword first.`,
        };
      }
      return { status: 'pass', detail: `"${title}" (${title.length} chars)` };
    },
  },
  {
    id: 'description',
    title: 'Meta description',
    severity: 'high',
    run: ({ html, config }) => {
      const desc = H.meta(html, 'description');
      if (!desc) {
        return { status: 'fail', detail: 'missing', fix: 'Add a unique 70-160 character description per route.' };
      }
      const [min, max] = config.targets.descriptionLength;
      if (desc.length < min || desc.length > max) {
        return { status: 'warn', detail: `${desc.length} chars (target ${min}-${max})`, fix: 'Resize the description.' };
      }
      return { status: 'pass', detail: `${desc.length} chars` };
    },
  },
  {
    id: 'canonical',
    title: 'Canonical URL',
    severity: 'high',
    run: ({ html }) => {
      const href = H.link(html, 'canonical');
      if (!href) {
        return { status: 'fail', detail: 'missing', fix: 'Add <link rel="canonical"> with the absolute URL of the route.' };
      }
      if (!/^https?:\/\//i.test(href)) {
        return { status: 'warn', detail: `relative canonical "${href}"`, fix: 'Use an absolute URL.' };
      }
      return { status: 'pass', detail: href };
    },
  },
  {
    id: 'canonical-self',
    title: 'Canonical points at this route',
    severity: 'medium',
    run: ({ html, route }) => {
      if (!route) return { status: 'skip', detail: 'route unknown for this target' };
      const href = H.link(html, 'canonical');
      if (!href) return { status: 'skip', detail: 'no canonical to compare (see the canonical rule)' };
      const normalise = (p) => (p.length > 1 ? p.replace(/\/+$/, '') : p);
      let canonicalPath;
      try {
        canonicalPath = normalise(new URL(href, 'https://example.invalid').pathname);
      } catch {
        return { status: 'warn', detail: `unparseable canonical "${href}"`, fix: 'Use an absolute URL.' };
      }
      if (canonicalPath !== normalise(route)) {
        return {
          status: 'fail',
          detail: `page is ${route} but canonical says ${canonicalPath}`,
          fix: 'Every page needs a self-referencing canonical — a copied one hands its ranking to another URL.',
        };
      }
      return { status: 'pass', detail: `self-referencing (${canonicalPath})` };
    },
  },
  {
    id: 'playback-claims',
    title: 'Playback claims match the product',
    severity: 'low',
    run: ({ html }) => {
      const text = H.stripTags(html);
      // "no download needed" is a disclaimer, not a promise — don't flag it.
      const promises = [
        /(?<!\bno\s)\bdownloads?\b/i,
        /\bmp3\b/i,
        /\bfull song\b/i,
        /\boffline\b/i,
      ]
        .filter((re) => re.test(text))
        .map((re) => re.source);
      if (!promises.length) return { status: 'pass', detail: 'no download or offline-playback promises' };

      const hasAudio = /<audio\b/i.test(html) || H.jsonLd(html).some((b) =>
        JSON.stringify(b).includes('"audio"') || JSON.stringify(b).includes('AudioObject'),
      );
      if (hasAudio) return { status: 'pass', detail: 'playback claims backed by an audio source on the page' };
      return {
        status: 'warn',
        detail: `promises ${promises.join(', ')} but the page ships no audio source`,
        fix: 'Only promise downloads or offline playback where licensed audio actually exists — unmet promises are a trust and policy risk.',
      };
    },
  },
  {
    id: 'h1',
    title: 'Single descriptive H1',
    severity: 'high',
    run: ({ html }) => {
      const h1s = H.headings(html).filter((h) => h.level === 1);
      if (h1s.length === 0) return { status: 'fail', detail: 'no H1', fix: 'Add one H1 carrying the page keyword.' };
      if (h1s.length > 1) {
        return { status: 'warn', detail: `${h1s.length} H1s: ${h1s.map((h) => h.text).join(' | ')}`, fix: 'Keep one H1; demote the rest to H2.' };
      }
      return { status: 'pass', detail: `"${h1s[0].text}"` };
    },
  },
  {
    id: 'heading-order',
    title: 'Heading hierarchy',
    severity: 'low',
    run: ({ html }) => {
      const levels = H.headings(html);
      if (levels.length === 0) return { status: 'skip', detail: 'no headings found' };
      const skips = [];
      for (let i = 1; i < levels.length; i++) {
        if (levels[i].level - levels[i - 1].level > 1) skips.push(`H${levels[i - 1].level} -> H${levels[i].level}`);
      }
      return skips.length
        ? { status: 'warn', detail: `skipped levels: ${skips.join(', ')}`, fix: 'Step heading levels one at a time.' }
        : { status: 'pass', detail: `${levels.length} headings, no skipped levels` };
    },
  },
  {
    id: 'social-cards',
    title: 'Open Graph / Twitter cards',
    severity: 'medium',
    run: ({ html }) => {
      const required = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
      const missing = required.filter((key) => !H.meta(html, key));
      const twitter = H.meta(html, 'twitter:card');
      if (missing.length === required.length) {
        return { status: 'fail', detail: 'no Open Graph tags', fix: 'Add og:title, og:description, og:image, og:url, og:type and twitter:card.' };
      }
      if (missing.length || !twitter) {
        return {
          status: 'warn',
          detail: `missing ${[...missing, twitter ? null : 'twitter:card'].filter(Boolean).join(', ')}`,
          fix: 'Complete the social card set.',
        };
      }
      return { status: 'pass', detail: `complete (twitter:card = ${twitter})` };
    },
  },
  {
    id: 'structured-data',
    title: 'Structured data (JSON-LD)',
    severity: 'high',
    run: ({ html }) => {
      const blocks = H.jsonLd(html);
      if (!blocks.length) {
        return { status: 'fail', detail: 'no JSON-LD', fix: 'Run `npm run seo:schema` and inject the generated blocks.' };
      }
      const broken = blocks.filter((b) => b.error);
      if (broken.length) {
        return { status: 'fail', detail: `invalid JSON-LD: ${broken[0].error}`, fix: 'Fix the malformed JSON-LD block.' };
      }
      const types = blocks.flatMap((b) => (Array.isArray(b['@graph']) ? b['@graph'] : [b])).map((n) => n['@type']).filter(Boolean);
      return { status: 'pass', detail: `${blocks.length} block(s): ${types.join(', ')}` };
    },
  },
  {
    id: 'image-alt',
    title: 'Image alt coverage',
    severity: 'medium',
    run: ({ html }) => {
      const imgs = H.images(html);
      if (!imgs.length) return { status: 'skip', detail: 'no <img> tags in the served HTML' };
      const missing = imgs.filter((i) => i.alt === undefined || i.alt.trim() === '');
      if (!missing.length) return { status: 'pass', detail: `${imgs.length}/${imgs.length} images have alt text` };
      const ratio = missing.length / imgs.length;
      return {
        status: ratio > 0.25 ? 'fail' : 'warn',
        detail: `${missing.length}/${imgs.length} images missing alt (${missing.slice(0, 3).map((i) => i.src).join(', ')})`,
        fix: 'Describe the artwork: "<song> by <artist> album cover".',
      };
    },
  },
  {
    id: 'image-perf',
    title: 'Image loading hints',
    severity: 'low',
    run: ({ html }) => {
      const imgs = H.images(html);
      if (!imgs.length) return { status: 'skip', detail: 'no <img> tags' };
      const lazy = imgs.filter((i) => i.loading === 'lazy').length;
      const sized = imgs.filter((i) => i.width && i.height).length;
      if (lazy === 0 || sized === 0) {
        return {
          status: 'warn',
          detail: `${lazy}/${imgs.length} lazy-loaded, ${sized}/${imgs.length} with width+height`,
          fix: 'Add loading="lazy" below the fold and explicit width/height to stop layout shift (CLS).',
        };
      }
      return { status: 'pass', detail: `${lazy} lazy, ${sized} with intrinsic size` };
    },
  },
  {
    id: 'viewport',
    title: 'Mobile viewport',
    severity: 'high',
    run: ({ html }) => {
      const viewport = H.meta(html, 'viewport');
      return viewport
        ? { status: 'pass', detail: viewport }
        : { status: 'fail', detail: 'missing', fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.' };
    },
  },
  {
    id: 'lang',
    title: 'Declared language',
    severity: 'medium',
    run: ({ html, config }) => {
      const m = /<html\b([^>]*)>/i.exec(html);
      const lang = m ? H.attrs(m[1]).lang : null;
      if (!lang) return { status: 'fail', detail: 'no lang attribute', fix: `Set <html lang="${config.site.defaultLocale}">.` };
      return { status: 'pass', detail: `lang="${lang}"` };
    },
  },
  {
    id: 'internal-links',
    title: 'Internal linking',
    severity: 'medium',
    run: ({ html, config }) => {
      const internal = H.anchors(html, config.site.origin).filter((a) => a.internal);
      if (internal.length === 0) {
        return {
          status: 'fail',
          detail: 'no crawlable internal <a href> links',
          fix: 'Navigation built on click handlers is invisible to crawlers — render real <a href> links to every route.',
        };
      }
      if (internal.length < 5) return { status: 'warn', detail: `${internal.length} internal links`, fix: 'Link to the main hubs from every page.' };
      return { status: 'pass', detail: `${internal.length} internal links` };
    },
  },
  {
    id: 'content-depth',
    title: 'Content depth',
    severity: 'medium',
    run: ({ html, config }) => {
      const words = H.wordCount(html);
      const min = config.targets.minWordCount;
      if (words === 0) return { status: 'skip', detail: 'no rendered text to measure' };
      return words < min
        ? { status: 'warn', detail: `${words} words (target ${min}+)`, fix: 'Add descriptive copy: artist context, language, mood, FAQ.' }
        : { status: 'pass', detail: `${words} words` };
    },
  },
  {
    id: 'favicon',
    title: 'Favicon',
    severity: 'low',
    run: ({ html }) => {
      const href = H.link(html, 'icon');
      return href ? { status: 'pass', detail: href } : { status: 'warn', detail: 'missing', fix: 'Ship a branded favicon.' };
    },
  },
  {
    id: 'robots-txt',
    title: 'robots.txt',
    severity: 'high',
    run: ({ assets }) => {
      const file = assets['robots.txt'];
      if (!file) return { status: 'fail', detail: 'not found', fix: 'Run `npm run seo:sitemap` to generate it.' };
      if (!/sitemap:/i.test(file.body)) {
        return { status: 'warn', detail: `${file.path} has no Sitemap: directive`, fix: 'Point robots.txt at the sitemap URL.' };
      }
      if (/^\s*disallow:\s*\/\s*$/im.test(file.body)) {
        return { status: 'fail', detail: 'robots.txt disallows the whole site', fix: 'Remove `Disallow: /`.' };
      }
      return { status: 'pass', detail: `${file.path}, sitemap declared` };
    },
  },
  {
    id: 'sitemap',
    title: 'XML sitemap',
    severity: 'high',
    run: ({ assets }) => {
      const file = assets['sitemap.xml'];
      if (!file) return { status: 'fail', detail: 'not found', fix: 'Run `npm run seo:sitemap`.' };
      const urls = (file.body.match(/<loc>/g) || []).length;
      if (!urls) return { status: 'fail', detail: 'sitemap contains no <loc> entries', fix: 'Regenerate the sitemap.' };
      return { status: 'pass', detail: `${file.path}, ${urls} URLs` };
    },
  },
];

export function runChecks(context) {
  const checks = RULES.map((rule) => {
    let result;
    try {
      result = rule.run(context) ?? { status: 'skip', detail: 'no result' };
    } catch (err) {
      result = { status: 'skip', detail: `rule error: ${err.message}` };
    }
    return { id: rule.id, title: rule.title, severity: rule.severity, ...result };
  });

  let earned = 0;
  let possible = 0;
  for (const check of checks) {
    if (check.status === 'skip') continue;
    const weight = WEIGHT[check.severity];
    possible += weight;
    earned += check.status === 'pass' ? weight : check.status === 'warn' ? weight / 2 : 0;
  }

  return {
    checks,
    score: possible ? Math.round((earned / possible) * 100) : 0,
    counts: {
      pass: checks.filter((c) => c.status === 'pass').length,
      warn: checks.filter((c) => c.status === 'warn').length,
      fail: checks.filter((c) => c.status === 'fail').length,
      skip: checks.filter((c) => c.status === 'skip').length,
    },
  };
}

export { RULES, WEIGHT };
