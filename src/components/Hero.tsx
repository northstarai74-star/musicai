import { songs } from '../data/songs';

interface HeroProps {
  onExplore: () => void;
  onPlayFeatured: () => void;
  onNavigate: (page: string) => void;
}

export default function Hero({ onExplore, onPlayFeatured, onNavigate }: HeroProps) {
  const artwork = songs.filter((s) => s.image).slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-pink-200 via-purple-200 to-blue-100 px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        {/* Copy */}
        <div className="text-center lg:text-left">
          <span className="inline-block rounded-full border border-pink-300 bg-white/60 px-3 py-1 text-xs font-medium uppercase tracking-widest text-purple-600">
            {songs.length} tracks · 3 languages
          </span>
          <h1 className="mt-5 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl">
            DesiSwagTunes
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base font-light text-purple-700 sm:text-lg lg:mx-0">
            Feel Every Beat • Every Language • Every Moment
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <button
              onClick={onPlayFeatured}
              className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-7 py-3 font-medium text-white transition hover:scale-105 hover:shadow-lg">
              ▶ Play Featured
            </button>
            <button
              onClick={onExplore}
              className="rounded-lg border-2 border-purple-500 bg-white px-7 py-3 font-medium text-purple-600 transition hover:bg-purple-50">
              Explore Now
            </button>
            <button
              onClick={() => onNavigate('library')}
              className="rounded-lg px-5 py-3 font-medium text-purple-700 transition hover:bg-white/60">
              Browse library →
            </button>
          </div>
        </div>

        {/* Artwork collage */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          {artwork.map((song, index) => (
            <div
              key={song.id}
              className={`overflow-hidden rounded-2xl border-2 border-pink-300 shadow-lg transition-transform duration-300 hover:scale-105 ${
                index % 2 === 0 ? 'lg:translate-y-4' : 'lg:-translate-y-4'
              }`}>
              <img
                src={song.image}
                alt={song.title}
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
