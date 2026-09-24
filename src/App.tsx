import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
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
import { songs as localSongs } from './data/songs';
import { fetchSongs } from './services/songService';

type PageType = 'home' | 'search' | 'likes' | 'library' | 'premium';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentQueue, setCurrentQueue] = useState<Song[]>(localSongs);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [showFullScreenPlayer, setShowFullScreenPlayer] = useState(false);
  const [songs, setSongs] = useState<Song[]>(localSongs);

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    const fetchedSongs = await fetchSongs();
    if (fetchedSongs.length > 0) {
      setSongs(fetchedSongs);
      setCurrentQueue(fetchedSongs);
    }
  };

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

  const handleNextSong = () => {
    if (currentQueueIndex < currentQueue.length - 1) {
      const nextIndex = currentQueueIndex + 1;
      setCurrentQueueIndex(nextIndex);
      setCurrentSong(currentQueue[nextIndex]);
      setIsPlaying(true);
    }
  };

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

  return (
    <div className="min-h-screen flex flex-col pb-24 bg-gradient-to-b from-pink-100 via-purple-100 to-blue-100">
      <Navbar
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePause={handlePausePlay}
        onOpenSearch={() => setShowSearch(true)}
        favorites={favorites}
        onNavigateToLikes={() => setCurrentPage('likes')}
        onPageChange={setCurrentPage}
      />
      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          songs={songs}
          onSearch={handleSearch}
        />
      )}

      <div className="flex flex-1 w-full">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

        <main className="flex-1">
          {currentPage === 'home' && (
            <HomePage
              onPlay={handlePlaySong}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onPageChange={setCurrentPage}
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
        </main>
      </div>

      <Footer />

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
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
