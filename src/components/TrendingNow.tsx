import { Song } from '../types';

interface TrendingNowProps {
  songs: Song[];
  onPlay: (song: Song) => void;
  favorites: Set<string>;
  onToggleFavorite: (songId: string) => void;
}

export default function TrendingNow({
  songs,
  onPlay,
  favorites,
  onToggleFavorite,
}: TrendingNowProps) {
  return (
    <section className="py-16 bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight bg-gradient-to-r from-pink-700 to-indigo-700 bg-clip-text text-transparent">
            Trending Now
          </h2>
          <p className="text-purple-600 text-base font-light">What everyone is listening to</p>
        </div>

        <div className="space-y-3">
          {songs.map((song, index) => (
            <div
              key={song.id}
              onClick={() => onPlay(song)}
              className="flex items-center gap-3 rounded bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 p-4 hover:shadow-lg transition-all transform hover:translate-x-2 cursor-pointer group border-2 border-pink-400 shadow-md hover:shadow-xl">
              <span className="font-black text-lg text-purple-700 w-6 text-center">
                #{index + 1}
              </span>
              <img
                src={song.image}
                alt={song.title}
                className="w-12 h-12 rounded object-cover border border-pink-400"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-purple-900 group-hover:text-purple-700 transition-all truncate">
                  {song.title}
                </h4>
                <p className="text-sm text-purple-600 truncate">{song.artist}</p>
              </div>
              <div className="flex items-center gap-4 ml-4">
                <span className="text-sm text-purple-700 font-mono">
                  {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(song.id);
                  }}
                  className="text-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  title={favorites.has(song.id) ? 'Remove from favorites' : 'Add to favorites'}>
                  {favorites.has(song.id) ? '❤️' : '🤍'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(song);
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 shadow-md"
                  title="Play song">
                  ▶
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
