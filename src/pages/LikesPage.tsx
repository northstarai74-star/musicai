import EditorialGrid from '../components/EditorialGrid';
import SectionHeading from '../components/SectionHeading';
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
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          index={`${favoriteSongs.length} saved`}
          title="My Favorites"
          subtitle="Everything you have hearted, in one spread."
        />

        {favoriteSongs.length > 0 ? (
          <EditorialGrid
            songs={favoriteSongs}
            onPlay={onPlay}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            leadEyebrow="Most recently loved"
          />
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-pink-400 py-20 text-center">
            <p className="mb-2 text-2xl text-purple-600">No favorites yet</p>
            <p className="text-purple-500">
              Start adding songs to your favorites by clicking the heart icon
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
