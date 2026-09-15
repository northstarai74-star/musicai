/**
 * Project context for the SEO toolkit: config, the song catalogue, and a
 * document loader that accepts either a URL or a path on disk.
 */
import { execFile } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export async function loadConfig() {
  const raw = await readFile(path.join(ROOT, 'seo/seo.config.json'), 'utf8');
  const config = JSON.parse(raw);
  config.site.origin = config.site.origin.replace(/\/$/, '');
  return config;
}

/**
 * Reads src/data/songs.ts without a TypeScript runtime. The file is a plain
 * object-literal array, so each `{ ... }` block parses field by field.
 */
export async function loadCatalog() {
  const raw = await readFile(path.join(ROOT, 'src/data/songs.ts'), 'utf8');
  const body = raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1);
  const songs = [];
  for (const block of body.match(/\{[^{}]*\}/g) ?? []) {
    const song = {};
    for (const [, key, single, double, bare] of block.matchAll(
      /(\w+)\s*:\s*(?:'([^']*)'|"([^"]*)"|([^,\n}]+))/g,
    )) {
      const value = single ?? double ?? bare?.trim();
      song[key] = value === 'true' ? true : value === 'false' ? false : /^\d+$/.test(value) ? Number(value) : value;
    }
    if (song.id && song.title) songs.push(song);
  }
  return songs;
}

export function slug(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function songPath(song) {
  return `/song/${slug(song.title)}-${slug(song.artist)}`;
}

export function artistPath(artist) {
  return `/artist/${slug(artist)}`;
}

/** Unique artists, splitting the "A & B" / "A, B" credits in the catalogue. */
export function artistsOf(songs) {
  const seen = new Map();
  for (const song of songs) {
    for (const name of String(song.artist).split(/\s*(?:&|,|feat\.|ft\.)\s*/i)) {
      const clean = name.trim();
      if (!clean) continue;
      if (!seen.has(clean)) seen.set(clean, []);
      seen.get(clean).push(song);
    }
  }
  return seen;
}

export function formatDuration(seconds) {
  const s = Number(seconds) || 0;
  return `PT${Math.floor(s / 60)}M${String(s % 60).padStart(2, '0')}S`;
}

/**
 * Loads one document. Remote URLs go through curl so the sandbox's HTTPS proxy
 * and CA bundle apply; global fetch is the fallback when curl is unavailable.
 */
export async function loadDocument(target) {
  if (/^https?:\/\//i.test(target)) {
    try {
      const { stdout } = await execFileAsync(
        'curl',
        ['-sSL', '--max-time', '30', '-A', 'Mozilla/5.0 (compatible; SEOAgent/1.0)', target],
        { maxBuffer: 20 * 1024 * 1024 },
      );
      return { source: target, kind: 'url', html: stdout };
    } catch {
      const res = await fetch(target, { headers: { 'user-agent': 'SEOAgent/1.0' } });
      if (!res.ok) throw new Error(`${target} returned HTTP ${res.status}`);
      return { source: target, kind: 'url', html: await res.text() };
    }
  }

  let file = path.resolve(ROOT, target);
  if ((await stat(file).catch(() => null))?.isDirectory()) file = path.join(file, 'index.html');
  return { source: path.relative(ROOT, file), kind: 'file', html: await readFile(file, 'utf8') };
}
