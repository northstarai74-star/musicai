import Hero from '../components/Hero';
import EditorialGrid from '../components/EditorialGrid';
import SectionHeading from '../components/SectionHeading';
import SongTile from '../components/SongTile';
import { Song } from '../types';
import { songs } from '../data/songs';

interface HomePageProps {
  onPlay: (song: Song) => void;
  favorites: Set<string>;
  onToggleFavorite: (songId: string) => void;
  onPageChange?: (page: string) => void;
}

export default function HomePage({ onPlay, favorites, onToggleFavorite, onPageChange }: HomePageProps) {
  const featuredSongs = songs.filter((s) => s.featured);
  const trendingSongs = songs.filter((s) => s.trending).slice(0, 5);
  const [leadTrending, ...restTrending] = trendingSongs;

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

      {/* Featured — the asymmetric lead spread */}
      <section
        id="featured-songs"
        className="bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            index="01 / Editors' picks"
            title="Featured Songs"
            subtitle="Handpicked tracks for you, led by the record we cannot stop playing."
            action={
              <button
                onClick={() => onPageChange?.('library')}
                className="shrink-0 rounded-full border-2 border-purple-500 px-5 py-2 text-sm font-medium text-purple-700 transition hover:bg-white/60">
                See all {songs.length} tracks →
              </button>
            }
          />
          <EditorialGrid
            songs={featuredSongs}
            onPlay={onPlay}
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            leadEyebrow="Editors' pick"
          />
        </div>
      </section>

      {/* Trending — a lead tile beside a ranked chart */}
      <section className="bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200 px-4 py-14 sm:px-6 md:py-20">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            index="02 / The chart"
            title="Trending Now"
            subtitle="What everyone is listening to this week."
          />

          <div className="grid gap-6 lg:grid-cols-5">
            {leadTrending && (
              <div className="grid auto-rows-[150px] grid-cols-2 sm:auto-rows-[170px] lg:col-span-2 lg:auto-rows-[185px]">
                <SongTile
                  song={leadTrending}
                  variant="lead"
                  eyebrow="No. 1 this week"
                  onPlay={onPlay}
                  isFavorite={favorites.has(leadTrending.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
            )}

            <ol className="divide-y divide-pink-400/50 border-y-2 border-pink-400/60 lg:col-span-3">
              {restTrending.map((song, index) => (
                <li key={song.id}>
                  <button
                    onClick={() => onPlay(song)}
                    className="group flex w-full items-center gap-4 py-4 text-left transition hover:bg-white/40 sm:gap-6 sm:px-3">
                    <span className="w-10 shrink-0 text-2xl font-black text-pink-500/80 sm:w-14 sm:text-4xl">
                      {(index + 2).toString().padStart(2, '0')}
                    </span>
                    <img
                      src={song.image}
                      alt=""
                      className="hidden h-14 w-14 shrink-0 rounded-lg border-2 border-pink-300 object-cover sm:block"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-purple-900 group-hover:text-purple-700">
                        {song.title}
                      </span>
                      <span className="block truncate text-sm text-purple-600">{song.artist}</span>
                    </span>
                    <span className="hidden shrink-0 rounded-full border border-purple-400 px-2 py-0.5 text-xs text-purple-700 md:inline">
                      {song.language}
                    </span>
                    <span className="shrink-0 text-sm font-medium text-purple-700">
                      {Math.floor(song.duration / 60)}:
                      {(song.duration % 60).toString().padStart(2, '0')}
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(song.id);
                      }}
                      className="shrink-0 text-lg transition hover:scale-125">
                      {favorites.has(song.id) ? '❤️' : '🤍'}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
