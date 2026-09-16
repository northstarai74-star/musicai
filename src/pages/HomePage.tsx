import Hero from '../components/Hero';
import BrowseCatalogue from '../components/BrowseCatalogue';
import FeaturedSongs from '../components/FeaturedSongs';
import LanguageCategories from '../components/LanguageCategories';
import TrendingNow from '../components/TrendingNow';
import { Song } from '../types';
import { songs } from '../data/songs';
import { songPath } from '../lib/routes';

interface HomePageProps {
  onPlay: (song: Song) => void;
  favorites: Set<string>;
  onToggleFavorite: (songId: string) => void;
  onPageChange?: (page: string) => void;
}

export default function HomePage({ onPlay, favorites, onToggleFavorite, onPageChange }: HomePageProps) {
  const featuredSongs = songs.filter(s => s.featured);
  const trendingSongs = songs.filter(s => s.trending).slice(0, 5);

  const handlePlayFeatured = () => {
    if (featuredSongs.length > 0) {
      onPlay(featuredSongs[0]);
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-pink-100 via-purple-100 to-blue-100">
      <Hero
        onExplore={() => {
          const element = document.getElementById('featured-songs');
          element?.scrollIntoView({ behavior: 'smooth' });
        }}
        onPlayFeatured={handlePlayFeatured}
        onNavigate={onPageChange || (() => {})}
      />

      {/* Featured Songs Section */}
      <div id="featured-songs" className="bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light tracking-widest bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent mb-3 uppercase">Featured Songs</h2>
          <p className="text-purple-600 mb-12 font-light">Handpicked tracks for you</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {featuredSongs.map((song) => (
              <div
                key={song.id}
                onClick={() => onPlay(song)}
                className="group flex flex-col rounded overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-pink-300 cursor-pointer">
                <div className="relative overflow-hidden h-40 bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300">
                  <img src={song.image} alt={song.title} className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(song);
                    }}
                    className="absolute bottom-3 right-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110">
                    ▶
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(song.id);
                    }}
                    className="absolute top-3 right-3 text-xl opacity-0 group-hover:opacity-100 transition-all">
                    {favorites.has(song.id) ? '❤️' : '🤍'}
                  </button>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-purple-900 text-sm truncate">{song.title}</h3>
                  <p className="text-xs text-purple-600 truncate mt-1">{song.artist}</p>
                  <div className="mt-auto pt-3 flex items-center justify-between text-xs">
                    <span className="text-purple-600 font-medium">{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>
                    <a
                      href={songPath(song)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-purple-700 underline hover:text-purple-900"
                      title={`${song.title} details`}>
                      Details
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Now Section */}
      <div className="bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light tracking-widest bg-gradient-to-r from-pink-700 to-indigo-700 bg-clip-text text-transparent mb-3 uppercase">Trending Now</h2>
          <p className="text-purple-600 mb-12 font-light">What everyone is listening to</p>

          <div className="space-y-3">
            {trendingSongs.map((song, index) => (
              <div
                key={song.id}
                onClick={() => onPlay(song)}
                className="flex items-center rounded bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 p-4 hover:shadow-lg transition-all cursor-pointer group border-2 border-pink-400">
                <span className="mr-4 font-black text-lg text-purple-700 w-8">#{index + 1}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 group-hover:text-purple-700">{song.title}</h4>
                  <p className="text-sm text-purple-600">
                    {song.artist} ·{' '}
                    <a
                      href={songPath(song)}
                      onClick={(e) => e.stopPropagation()}
                      className="underline hover:text-purple-900">
                      Details
                    </a>
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <span className="text-sm text-purple-700 font-medium">{Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(song.id);
                    }}
                    className="text-lg opacity-0 group-hover:opacity-100 transition-all">
                    {favorites.has(song.id) ? '❤️' : '🤍'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BrowseCatalogue />
    </div>
  );
}
