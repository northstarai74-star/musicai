import { useCallback, useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import SearchModal from './components/SearchModal';
import Player from './components/Player';
import FullScreenPlayer from './components/FullScreenPlayer';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import LikesPage from './pages/LikesPage';
import LibraryPage from './pages/LibraryPage';
import PremiumPage from './pages/PremiumPage';
import Footer from './components/Footer';
import { Song } from './types';
import { songs } from './data/songs';
import { useAudioPlayer } from './hooks/useAudioPlayer';

type PageType = 'home' | 'search' | 'likes' | 'library' | 'premium';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentQueue, setCurrentQueue] = useState<Song[]>(songs);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [showFullScreenPlayer, setShowFullScreenPlayer] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleFavorite = (songId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(songId)) {
      newFavorites.delete(songId);
    } else {
      newFavorites.add(songId);
    }
    setFavorites(newFavorites);
  };

  const handlePlaySong = (song: Song, queue: Song[] = songs) => {
    setCurrentSong(song);
    setCurrentQueue(queue);
    const index = queue.findIndex(s => s.id === song.id);
    setCurrentQueueIndex(index >= 0 ? index : 0);
    setIsPlaying(true);
    setShowFullScreenPlayer(true);
  };

  const handlePausePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextSong = useCallback(() => {
    setCurrentQueueIndex((index) => {
      if (index >= currentQueue.length - 1) {
        setIsPlaying(false);
        return index;
      }
      const nextIndex = index + 1;
      setCurrentSong(currentQueue[nextIndex]);
      setIsPlaying(true);
      return nextIndex;
    });
  }, [currentQueue]);

  const handlePreviousSong = () => {
    if (currentQueueIndex > 0) {
      const prevIndex = currentQueueIndex - 1;
      setCurrentQueueIndex(prevIndex);
      setCurrentSong(currentQueue[prevIndex]);
      setIsPlaying(true);
    }
  };

  const handleSongChange = (index: number) => {
    if (index >= 0 && index < currentQueue.length) {
      setCurrentQueueIndex(index);
      setCurrentSong(currentQueue[index]);
      setIsPlaying(true);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage('search');
    setShowSearch(false);
  };

  const { currentTime, duration, volume, setVolume, seek } = useAudioPlayer({
    song: currentSong,
    isPlaying,
    onEnded: handleNextSong,
  });

  const handlePageChange = (page: PageType) => {
    setCurrentPage(page);
    setIsSidebarOpen(false);
  };

  return (
    // App shell: the top bar, sidebar, player and tab bar are fixed frames;
    // only <main> scrolls.
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-pink-100 via-purple-100 to-blue-100">
      <Navbar
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePause={handlePausePlay}
        onOpenSearch={() => setShowSearch(true)}
        favorites={favorites}
        onNavigateToLikes={() => handlePageChange('likes')}
        onPageChange={handlePageChange}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />

      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          songs={songs}
          onSearch={handleSearch}
        />
      )}

      <div className="flex min-h-0 flex-1">
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          favoritesCount={favorites.size}
        />

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex-1">
            {currentPage === 'home' && (
              <HomePage
                onPlay={handlePlaySong}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onPageChange={handlePageChange}
              />
            )}
            {currentPage === 'search' && (
              <SearchPage
                query={searchQuery}
                onPlay={handlePlaySong}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}
            {currentPage === 'likes' && (
              <LikesPage
                favorites={favorites}
                onPlay={handlePlaySong}
                onToggleFavorite={toggleFavorite}
              />
            )}
            {currentPage === 'library' && (
              <LibraryPage
                onPlay={handlePlaySong}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
              />
            )}
            {currentPage === 'premium' && <PremiumPage />}
          </div>

          <Footer />
        </main>
      </div>

      {currentSong && (
        <>
          <Player
            currentSong={currentSong}
            isPlaying={isPlaying}
            onTogglePause={handlePausePlay}
            onNextSong={handleNextSong}
            onPreviousSong={handlePreviousSong}
            queue={currentQueue}
            currentIndex={currentQueueIndex}
            onSongChange={handleSongChange}
            onOpenFullScreen={() => setShowFullScreenPlayer(true)}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            onVolumeChange={setVolume}
            onSeek={seek}
          />
          {showFullScreenPlayer && (
            <FullScreenPlayer
              currentSong={currentSong}
              isPlaying={isPlaying}
              onTogglePause={handlePausePlay}
              onNextSong={handleNextSong}
              onPreviousSong={handlePreviousSong}
              onClose={() => setShowFullScreenPlayer(false)}
              queue={currentQueue}
              currentIndex={currentQueueIndex}
              onSongChange={handleSongChange}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              onVolumeChange={setVolume}
              onSeek={seek}
            />
          )}
        </>
      )}

      <MobileNav
        currentPage={currentPage}
        onPageChange={handlePageChange}
        favoritesCount={favorites.size}
      />
    </div>
  );
}

export default App;
