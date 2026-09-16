import { songs } from '../data/songs';
import { languagePath } from '../lib/routes';

/**
 * Footer navigation. Every link here is a real URL that the pre-render step
 * writes into public/ (`npm run seo:prerender`), so the markup a crawler reads
 * matches the navigation a visitor can actually click. Placeholder `href="#"`
 * links were removed: they are dead ends for both.
 */
export default function Footer() {
  const languages = [...new Set(songs.map((s) => s.language))];

  return (
    <footer className="bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 border-t-4 border-pink-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
              DesiSwagTunes
            </h3>
            <p className="text-purple-600 text-sm font-light">
              Your gateway to Desi music, Hindi, Punjabi &amp; English tracks.
            </p>
          </div>
          <div>
            <h4 className="text-purple-700 font-semibold mb-4">Browse</h4>
            <ul className="space-y-2 text-sm text-purple-600">
              <li>
                <a href="/" className="hover:text-purple-900 transition">
                  Home
                </a>
              </li>
              <li>
                <a href="/library" className="hover:text-purple-900 transition">
                  Full catalogue
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-purple-700 font-semibold mb-4">Languages</h4>
            <ul className="space-y-2 text-sm text-purple-600">
              {languages.map((language) => (
                <li key={language}>
                  <a href={languagePath(language)} className="hover:text-purple-900 transition">
                    {language} songs
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-pink-400 pt-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-purple-600 text-sm font-light">
            © 2024 DesiSwagTunes. All rights reserved. Feel Every Beat — track details and artwork are listed
            for discovery; playback opens in the app.
          </p>
          <a href="tel:+19843023964" className="text-purple-600 hover:text-purple-900 transition text-sm">
            +1 (984) 302-3964
          </a>
        </div>
      </div>
    </footer>
  );
}
