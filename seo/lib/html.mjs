/**
 * Dependency-free HTML inspection helpers.
 * Regex-based on purpose: the toolkit has to run before `npm install`
 * and inside CI containers with no network.
 */

const VOID_TEXT_TAGS = /<(script|style|noscript|template|svg)[\s\S]*?<\/\1>/gi;

export function stripTags(html) {
  return html
    .replace(VOID_TEXT_TAGS, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(html) {
  const text = stripTags(html);
  return text ? text.split(/\s+/).length : 0;
}

/** All attributes of every `tag` element, as an array of plain objects. */
export function tags(html, tag) {
  const out = [];
  const re = new RegExp(`<${tag}\\b([^>]*)>`, 'gi');
  let m;
  while ((m = re.exec(html))) out.push(attrs(m[1]));
  return out;
}

export function attrs(raw) {
  const out = {};
  const re = /([a-zA-Z_:@.-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(raw))) {
    out[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5] ?? '';
  }
  return out;
}

/** Inner text of the first `tag` element, tags stripped. */
export function firstText(html, tag) {
  const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(html);
  return m ? stripTags(m[1]) : null;
}

/** <meta name="x"> / <meta property="x"> lookup. Returns the content or null. */
export function meta(html, key) {
  const hit = tags(html, 'meta').find(
    (a) => (a.name || a.property || a.itemprop || '').toLowerCase() === key.toLowerCase(),
  );
  return hit ? (hit.content ?? '') : null;
}

export function link(html, rel) {
  const hit = tags(html, 'link').find((a) => (a.rel || '').toLowerCase().split(/\s+/).includes(rel));
  return hit ? (hit.href ?? '') : null;
}

/** Headings in document order: [{ level, text }]. */
export function headings(html) {
  const out = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html))) out.push({ level: Number(m[1]), text: stripTags(m[2]) });
  return out;
}

export function images(html) {
  return tags(html, 'img').map((a) => ({
    src: a.src || a['data-src'] || '',
    alt: a.alt,
    loading: a.loading,
    width: a.width,
    height: a.height,
  }));
}

export function anchors(html, origin) {
  return tags(html, 'a')
    .map((a) => a.href)
    .filter(Boolean)
    .filter((href) => !/^(#|javascript:|mailto:|tel:)/i.test(href))
    .map((href) => ({ href, internal: isInternal(href, origin) }));
}

export function isInternal(href, origin) {
  if (/^https?:\/\//i.test(href)) return origin ? href.startsWith(origin) : false;
  return true;
}

/** Parsed JSON-LD blocks. Invalid blocks come back as { error }. */
export function jsonLd(html) {
  const out = [];
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      out.push(JSON.parse(m[1].trim()));
    } catch (err) {
      out.push({ error: err.message, raw: m[1].trim().slice(0, 120) });
    }
  }
  return out;
}

/** True when the SPA ships an empty mount point (nothing for a crawler to read). */
export function hasEmptyRoot(html) {
  const m = /<div\b[^>]*id=["']root["'][^>]*>([\s\S]*?)<\/div>/i.exec(html);
  return m ? stripTags(m[1]).length === 0 : false;
}
