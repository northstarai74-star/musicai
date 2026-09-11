import { Song } from '../types';
import SongCard from './SongCard';

interface FeaturedSongsProps {
  songs: Song[];
  onPlay: (song: Song) => void;
  favorites: Set<string>;
  onToggleFavorite: (songId: string) => void;
}

export default function FeaturedSongs({
  songs,
  onPlay,
  favorites,
  onToggleFavorite,
}: FeaturedSongsProps) {
  return (
    <section className="py-16 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
            Featured Songs
          </h2>
          <p className="text-purple-600 text-base font-light">Handpicked tracks for you</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onPlay={onPlay}
              isFavorite={favorites.has(song.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
