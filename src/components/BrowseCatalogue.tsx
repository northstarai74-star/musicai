import { songs } from '../data/songs';
import { artistPath, artistsOf, languagePath } from '../lib/routes';

/**
 * The crawlable half of the home page: real <a href> links to the catalogue
 * pages that `npm run seo:prerender` writes into public/.
 *
 * Keep this in sync with homeBody() in seo/lib/render.mjs — the pre-rendered
 * HTML has to offer visitors the same links it offers crawlers.
 */
export default function BrowseCatalogue() {
  const languages = [...new Set(songs.map((s) => s.language))];
  const artists = [...artistsOf(songs).entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8)
    .map(([name]) => name);

  const chip =
    'inline-block bg-white/60 border-2 border-purple-300 rounded-full px-4 py-1.5 text-sm text-purple-700 hover:text-purple-900 hover:bg-white transition';

  return (
    <section className="bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-light tracking-widest bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent mb-3 uppercase">
          Browse by Language
        </h2>
        <p className="text-purple-600 mb-6 font-light">Discover music in your favourite language</p>
        <ul className="flex flex-wrap gap-3 list-none p-0 mb-12">
          {languages.map((language) => (
            <li key={language}>
              <a href={languagePath(language)} className={chip}>
                {language} songs ({songs.filter((s) => s.language === language).length})
              </a>
            </li>
          ))}
        </ul>

        <h2 className="text-4xl md:text-5xl font-light tracking-widest bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent mb-3 uppercase">
          Browse by Artist
        </h2>
        <ul className="flex flex-wrap gap-3 list-none p-0 mb-12">
          {artists.map((artist) => (
            <li key={artist}>
              <a href={artistPath(artist)} className={chip}>
                {artist}
              </a>
            </li>
          ))}
        </ul>

        <h2 className="text-2xl font-semibold text-purple-800 mb-3">Everything in one place</h2>
        <p className="text-purple-700 max-w-3xl font-light">
          The{' '}
          <a href="/library" className="underline hover:text-purple-900">
            full library
          </a>{' '}
          lists all {songs.length} tracks with their credits, language and runtime. Track pages carry the same
          details plus related titles from the same artist, so you can follow a credit through the catalogue
          instead of searching for it again.
        </p>
      </div>
    </section>
  );
}
