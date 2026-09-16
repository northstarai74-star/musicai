import { Song } from '../types';

/**
 * Canonical URL shapes for the catalogue.
 *
 * These must stay identical to `slug()` / `songPath()` / `artistPath()` in
 * seo/lib/site.mjs and seo/lib/render.mjs — the SEO toolkit pre-renders the
 * pages at those paths (see `npm run seo:prerender`), so a drift here produces
 * links that 404. seo/test.mjs guards the two implementations against drift.
 */
export function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function songPath(song: Song): string {
  return `/song/${slug(song.title)}-${slug(song.artist)}`;
}

export function artistPath(artist: string): string {
  return `/artist/${slug(artist)}`;
}

export function languagePath(language: string): string {
  return `/language/${slug(language)}`;
}

/** Splits the "A & B" / "A, B" credits the catalogue stores in one string. */
export function creditedArtists(song: Song): string[] {
  return song.artist
    .split(/\s*(?:&|,|feat\.|ft\.)\s*/i)
    .map((name) => name.trim())
    .filter(Boolean);
}

/** Unique artists mapped to the tracks they appear on. */
export function artistsOf(songs: Song[]): Map<string, Song[]> {
  const seen = new Map<string, Song[]>();
  for (const song of songs) {
    for (const name of creditedArtists(song)) {
      const tracks = seen.get(name);
      if (tracks) tracks.push(song);
      else seen.set(name, [song]);
    }
  }
  return seen;
}
