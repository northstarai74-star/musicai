import EditorialGrid from '../components/EditorialGrid';
import SectionHeading from '../components/SectionHeading';
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
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          index={`${songs.length} tracks · ${languages.length} languages`}
          title="Your Library"
          subtitle="Browse the full collection, sorted by language."
        />

        {languages.map((language, index) => {
          const languageSongs = songs.filter((s) => s.language === language);
          return (
            <section key={language} className="mb-14 last:mb-0">
              <SectionHeading
                index={`${(index + 1).toString().padStart(2, '0')} / ${languageSongs.length} tracks`}
                title={`${language} Songs`}
              />
              <EditorialGrid
                songs={languageSongs}
                onPlay={onPlay}
                favorites={favorites}
                onToggleFavorite={onToggleFavorite}
                leadEyebrow={`${language} · top pick`}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
