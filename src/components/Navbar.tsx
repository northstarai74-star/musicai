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
}

export default function Navbar({
  currentSong,
  isPlaying,
  onTogglePause,
  onOpenSearch,
  favorites,
  onNavigateToLikes,
  onPageChange,
}: NavbarProps) {
  return (
    <nav className="bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 sticky top-0 z-50">
      {currentSong && (
        <div className="bg-gradient-to-r from-pink-300/80 via-purple-300/80 to-blue-300/80 border-t-2 border-pink-400 px-4 py-2 flex items-center justify-between">
          <div
            className="text-xs text-purple-700 truncate cursor-pointer hover:text-purple-900 transition font-medium"
            onClick={onTogglePause}
            title={`Click to ${isPlaying ? 'pause' : 'play'}`}>
            {currentSong.title}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSearch}
              className="text-purple-600 hover:text-purple-900 transition text-sm"
              title="Search songs">
              Search
            </button>
            <button
              onClick={onNavigateToLikes}
              className="text-purple-600 hover:text-purple-900 transition text-sm"
              title={`You have ${favorites.size} favorites`}>
              Likes {favorites.size > 0 && <span className="text-xs ml-1">({favorites.size})</span>}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
