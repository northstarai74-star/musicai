import { songs } from '../data/songs';

interface HeroProps {
  onExplore: () => void;
  onPlayFeatured: () => void;
  onNavigate: (page: string) => void;
}

export default function Hero({ onExplore, onPlayFeatured, onNavigate }: HeroProps) {
  const [cover, ...strip] = songs.filter((s) => s.image).slice(0, 4);

  return (
    <section className="bg-gradient-to-b from-pink-200 via-purple-200 to-blue-100 px-4 pb-14 pt-10 sm:px-6 md:pb-20 md:pt-14">
      <div className="mx-auto max-w-7xl">
        {/* Masthead rule */}
        <div className="flex items-center justify-between border-b-2 border-purple-500/50 pb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-purple-600">
          <span>Issue 01</span>
          <span className="hidden sm:inline">Hindi · Punjabi · English</span>
          <span>{songs.length} tracks</span>
        </div>

        <div className="grid gap-8 py-8 md:py-12 lg:grid-cols-12 lg:gap-10">
          {/* Headline column */}
          <div className="lg:col-span-5">
            <h1 className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-5xl font-black uppercase leading-[0.88] tracking-tighter text-transparent sm:text-6xl lg:text-7xl">
              DesiSwag
              <br />
              Tunes
            </h1>
            <p className="mt-6 border-l-4 border-pink-400 pl-4 text-base font-light leading-relaxed text-purple-700 sm:text-lg">
              Feel every beat • every language • every moment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
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

          {/* Cover image */}
          {cover && (
            <figure className="overflow-hidden rounded-2xl border-2 border-pink-300 shadow-xl lg:col-span-7">
              <img
                src={cover.image}
                alt={cover.title}
                className="h-64 w-full object-cover sm:h-80 lg:h-[420px]"
              />
            </figure>
          )}
        </div>

        {/* Contact strip along the bottom of the masthead */}
        <div className="grid grid-cols-3 gap-4 border-t-2 border-purple-500/50 pt-5">
          {strip.map((song, index) => (
            <button
              key={song.id}
              onClick={onExplore}
              className="group flex items-center gap-3 text-left">
              <img
                src={song.image}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg border-2 border-pink-300 object-cover transition group-hover:scale-105 sm:h-14 sm:w-14"
              />
              <span className="min-w-0">
                <span className="block text-[10px] font-black tracking-[0.25em] text-pink-500">
                  0{index + 2}
                </span>
                <span className="block truncate text-sm font-semibold text-purple-900">
                  {song.title}
                </span>
                <span className="hidden truncate text-xs text-purple-600 sm:block">
                  {song.artist}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
