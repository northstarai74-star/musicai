import SongCard from '../components/SongCard';
import { Song } from '../types';
import { songs } from '../data/songs';

interface LibraryPageProps {
  onPlay: (song: Song) => void;
  favorites: Set<string>;
  onToggleFavorite: (songId: string) => void;
}

export default function LibraryPage({
  onPlay,
  favorites,
  onToggleFavorite,
}: LibraryPageProps) {
  const languages = ['Hindi', 'Punjabi', 'English'];

  return (
    <div className="min-h-full bg-gradient-to-b from-pink-100 via-purple-100 to-blue-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 lg:mb-12">
          <h1 className="mb-3 text-3xl font-black sm:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 text-transparent bg-clip-text">
              Your Library
            </span>
          </h1>
          <p className="text-purple-600 text-xl">Browse all {songs.length} songs in our collection</p>
        </div>

        {languages.map((language) => {
          const languageSongs = songs.filter((s) => s.language === language);
          return (
            <div key={language} className="mb-16">
              <div className="mb-8">
                <h2 className="text-3xl font-black mb-2">
                  <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">
                    {language} Songs
                  </span>
                </h2>
                <p className="text-purple-600">{languageSongs.length} tracks available</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {languageSongs.map((song) => (
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
          );
        })}
      </div>
    </div>
  );
}
