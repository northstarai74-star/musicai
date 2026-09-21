import { Song } from '../types';

type PageType = 'home' | 'search' | 'likes' | 'library' | 'premium';

interface NavbarProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePause: () => void;
  onOpenSearch: () => void;
  favorites: Set<string>;
  onNavigateToLikes: () => void;
  onPageChange: (page: PageType) => void;
  onToggleSidebar: () => void;
}

export default function Navbar({
  currentSong,
  isPlaying,
  onTogglePause,
  onOpenSearch,
  favorites,
  onNavigateToLikes,
  onPageChange,
  onToggleSidebar,
}: NavbarProps) {
  return (
    <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-pink-300/70 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 px-4 shadow-sm sm:px-6">
      <button
        onClick={onToggleSidebar}
        className="rounded-lg px-2 py-1 text-xl text-purple-700 transition hover:bg-pink-300/60 hover:text-purple-900 md:hidden"
        aria-label="Toggle menu">
        ☰
      </button>

      <button
        onClick={() => onPageChange('home')}
        className="shrink-0 truncate bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-lg font-bold tracking-tight text-transparent transition hover:opacity-80 sm:text-xl">
        DesiSwagTunes
      </button>

      {/* Search sits in the middle of the bar and grows with the viewport */}
      <button
        onClick={onOpenSearch}
        className="mx-auto flex min-w-0 flex-1 items-center gap-2 rounded-full border border-pink-300 bg-white/60 px-3 py-2 text-sm text-purple-500 transition hover:border-purple-400 hover:bg-white/80 sm:max-w-md sm:px-4">
        <span>🔍</span>
        <span className="hidden truncate sm:inline">Search songs, artists…</span>
        <span className="truncate sm:hidden">Search</span>
      </button>

      {/* Now playing chip — replaces the old bar that only appeared with a song */}
      {currentSong && (
        <button
          onClick={onTogglePause}
          title={`Click to ${isPlaying ? 'pause' : 'play'}`}
          className="hidden max-w-[14rem] items-center gap-2 rounded-full border border-pink-300 bg-white/50 px-3 py-1.5 text-xs text-purple-700 transition hover:bg-white/80 lg:flex">
          <span>{isPlaying ? '⏸️' : '▶️'}</span>
          <span className="truncate font-medium">{currentSong.title}</span>
        </button>
      )}

      <button
        onClick={onNavigateToLikes}
        title={`You have ${favorites.size} favorites`}
        className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm text-purple-700 transition hover:bg-pink-300/60 hover:text-purple-900">
        <span>❤️</span>
        {favorites.size > 0 && <span className="text-xs font-semibold">{favorites.size}</span>}
      </button>

      <button
        onClick={() => onPageChange('premium')}
        className="hidden shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-1.5 text-sm font-medium text-white transition hover:shadow-md sm:block">
        Premium
      </button>
    </header>
  );
}
