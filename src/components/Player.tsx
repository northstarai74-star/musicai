import { useState, useEffect, useRef } from 'react';
import { Song } from '../types';

interface PlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePause: () => void;
  onNextSong?: () => void;
  onPreviousSong?: () => void;
  queue: Song[];
  currentIndex: number;
  onSongChange: (index: number) => void;
  onOpenFullScreen?: () => void;
}

export default function Player({
  currentSong,
  isPlaying,
  onTogglePause,
  onNextSong,
  onPreviousSong,
  queue,
  currentIndex,
  onSongChange,
  onOpenFullScreen,
}: PlayerProps) {
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSong?.audioUrl) {
      audio.src = currentSong.audioUrl;
      audio.volume = volume / 100;
    }

    if (isPlaying && currentSong?.audioUrl) {
      audio.play().catch(() => {
        // Audio playback failed silently
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      if (onNextSong) onNextSong();
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onNextSong]);

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      onSongChange(currentIndex + 1);
    } else if (onNextSong) {
      onNextSong();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onSongChange(currentIndex - 1);
    } else if (onPreviousSong) {
      onPreviousSong();
    }
  };

  if (!currentSong) return null;

  const currentTime = Math.floor((progress / 100) * (currentSong.duration || 180));
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 border-t border-purple-300 transition-all duration-300 ${
        isExpanded ? 'bottom-0 h-auto' : 'h-24'
      } shadow-lg`}>
      {/* Progress Bar */}
      <div className="h-1 bg-purple-200">
        <div
          className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all"
          style={{ width: `${progress}%` }}></div>
      </div>

      {/* Player Content */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          {/* Song Info */}
          <div
            className="flex-1 cursor-pointer hover:opacity-80"
            onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-xl">
                🎵
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-purple-900 truncate">{currentSong.title}</p>
                <p className="text-sm text-purple-600 truncate">{currentSong.artist}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 ml-8">
            {/* Time Display */}
            <div className="text-xs text-purple-600 font-mono w-12 text-right">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <span className="text-sm">🔊</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 h-1 bg-purple-300 rounded cursor-pointer"
              />
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                className="text-purple-600 hover:text-purple-800 transition hover:scale-110"
                title="Previous">
                ⏮️
              </button>
              <button
                onClick={onTogglePause}
                className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white p-3 rounded-full transition transform hover:scale-105 shadow-md"
                title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <button
                onClick={handleNext}
                className="text-purple-600 hover:text-purple-800 transition hover:scale-110"
                title="Next">
                ⏭️
              </button>
            </div>

            {/* Full Screen Button */}
            <button
              onClick={onOpenFullScreen}
              className="text-purple-600 hover:text-purple-800 transition text-xl hover:scale-110"
              title="Full screen player">
              ⛶
            </button>

            {/* Expand Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-purple-600 hover:text-purple-800 transition">
              {isExpanded ? '⏬' : '⏫'}
            </button>
          </div>
        </div>

        {/* Expanded View - Playlist */}
        {isExpanded && (
          <div className="mt-6 max-h-64 overflow-y-auto bg-white/40 rounded-lg p-4">
            <h3 className="text-purple-900 font-bold mb-4">Now Playing Queue</h3>
            <div className="space-y-2">
              {queue.slice(currentIndex, currentIndex + 5).map((song, idx) => (
                <div
                  key={song.id}
                  onClick={() => onSongChange(currentIndex + idx)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    idx === 0
                      ? 'bg-gradient-to-r from-pink-300 to-purple-300 text-purple-900 font-semibold'
                      : 'bg-purple-100/50 text-purple-700 hover:bg-purple-200/50'
                  }`}>
                  <p className="font-semibold truncate">{song.title}</p>
                  <p className="text-xs truncate">{song.artist}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <audio ref={audioRef} crossOrigin="anonymous" />
    </div>
  );
}
