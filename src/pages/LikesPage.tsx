import SongCard from '../components/SongCard';
import { Song } from '../types';
import { songs } from '../data/songs';

interface LikesPageProps {
  favorites: Set<string>;
  onPlay: (song: Song) => void;
  onToggleFavorite: (songId: string) => void;
}

export default function LikesPage({ favorites, onPlay, onToggleFavorite }: LikesPageProps) {
  const favoriteSongs = songs.filter((song) => favorites.has(song.id));

  return (
    <div className="min-h-full bg-gradient-to-b from-pink-100 via-purple-100 to-blue-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 lg:mb-12">
          <h1 className="mb-3 text-3xl font-black sm:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-400 text-transparent bg-clip-text">
              My Favorites
            </span>
          </h1>
          <p className="text-purple-600 text-xl">
            {favoriteSongs.length} song{favoriteSongs.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>

        {favoriteSongs.length > 0 ? (
          <>
            <div className="mb-8 p-6 bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl border border-pink-300">
              <p className="text-purple-700">
                Your favorite songs are ready to enjoy! Click any song to start playing.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {favoriteSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onPlay={onPlay}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-purple-600 text-2xl mb-2">No favorites yet</p>
            <p className="text-purple-500">Start adding songs to your favorites by clicking the heart icon</p>
          </div>
        )}
      </div>
    </div>
  );
}
