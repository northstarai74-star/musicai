import EditorialGrid from '../components/EditorialGrid';
import SectionHeading from '../components/SectionHeading';
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
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          index={`${filteredSongs.length} result${filteredSongs.length !== 1 ? 's' : ''}`}
          title="Search Results"
          subtitle={`Matching "${query}"`}
        />

        {filteredSongs.length > 0 ? (
          <EditorialGrid
            songs={filteredSongs}
            onPlay={onPlay}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            leadEyebrow="Best match"
          />
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-pink-400 py-20 text-center">
            <p className="text-lg text-purple-600">No songs found matching "{query}"</p>
            <p className="mt-2 text-sm text-purple-500">
              Try searching for a different artist or song name
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
