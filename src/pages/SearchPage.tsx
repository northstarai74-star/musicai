import SongCard from '../components/SongCard';
import { Song } from '../types';
import { songs } from '../data/songs';

interface SearchPageProps {
  query: string;
  onPlay: (song: Song) => void;
  favorites: Set<string>;
  onToggleFavorite: (songId: string) => void;
}

export default function SearchPage({
  query,
  onPlay,
  favorites,
  onToggleFavorite,
}: SearchPageProps) {
  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(query.toLowerCase()) ||
      song.artist.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-full bg-gradient-to-b from-pink-100 via-purple-100 to-blue-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 lg:mb-12">
          <h1 className="mb-3 text-3xl font-black sm:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">
              Search Results
            </span>
          </h1>
          <p className="text-purple-600 text-xl">
            Found {filteredSongs.length} result{filteredSongs.length !== 1 ? 's' : ''} for "{query}"
          </p>
        </div>

        {filteredSongs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onPlay={onPlay}
                isFavorite={favorites.has(song.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-purple-600 text-lg">No songs found matching "{query}"</p>
            <p className="text-purple-500 text-sm mt-2">Try searching for a different artist or song name</p>
          </div>
        )}
      </div>
    </div>
  );
}
