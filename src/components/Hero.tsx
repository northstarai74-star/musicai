import { Song } from '../types';

interface HeroProps {
  onExplore: () => void;
  onPlayFeatured: () => void;
}

export default function Hero({ onExplore, onPlayFeatured }: HeroProps) {
  return (
    <section className="relative bg-gradient-to-b from-pink-200 via-purple-200 to-blue-100 py-32 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          DesiSwagTunes
        </h1>
        <p className="text-lg md:text-xl text-purple-700 mb-12 max-w-2xl mx-auto font-light">
          Feel Every Beat • Every Language • Every Moment
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <button
            onClick={onExplore}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:shadow-lg font-medium rounded-lg transition transform hover:scale-105">
            Explore Now
          </button>
          <button
            onClick={onPlayFeatured}
            className="px-8 py-3 border-2 border-purple-500 bg-white text-purple-600 hover:bg-purple-50 font-medium rounded-lg transition">
            Play Featured
          </button>
        </div>
      </div>
    </section>
  );
}
