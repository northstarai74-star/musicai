import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isPlaying && currentSong) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Move to next song
            if (onNextSong) onNextSong();
            return 0;
          }
          return prev + 1 / (currentSong.duration || 180);
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentSong, onNextSong]);

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
    <div className="z-20 shrink-0 border-t border-purple-300 bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 shadow-[0_-4px_12px_rgba(168,85,247,0.12)]">
      {/* Progress Bar */}
      <div className="h-1 bg-purple-200">
        <div
          className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all"
          style={{ width: `${progress}%` }}></div>
      </div>

      {/* Three regions: track on the left, transport in the middle, extras on the right */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 md:grid-cols-3">
        {/* Song Info */}
        <div
          className="flex min-w-0 cursor-pointer items-center gap-3 hover:opacity-80"
          onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-pink-300 to-purple-300 text-xl">
            {currentSong.image ? (
              <img src={currentSong.image} alt="" className="h-full w-full object-cover" />
            ) : (
              '🎵'
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-purple-900">{currentSong.title}</p>
            <p className="truncate text-sm text-purple-600">{currentSong.artist}</p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="col-start-2 flex items-center justify-center gap-3 md:col-start-2">
          <button
            onClick={handlePrevious}
            className="text-purple-600 transition hover:scale-110 hover:text-purple-800"
            title="Previous">
            ⏮️
          </button>
          <button
            onClick={onTogglePause}
            className="rounded-full bg-gradient-to-r from-pink-400 to-rose-400 p-3 text-white shadow-md transition hover:scale-105 hover:from-pink-500 hover:to-rose-500"
            title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button
            onClick={handleNext}
            className="text-purple-600 transition hover:scale-110 hover:text-purple-800"
            title="Next">
            ⏭️
          </button>
          <span className="ml-1 hidden w-12 text-right font-mono text-xs text-purple-600 sm:inline">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Volume + view toggles — hidden on narrow screens where they do not fit */}
        <div className="col-span-2 hidden items-center justify-end gap-4 md:col-span-1 md:flex">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔊</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1 w-20 cursor-pointer rounded bg-purple-300"
              aria-label="Volume"
            />
          </div>

          <button
            onClick={onOpenFullScreen}
            className="text-xl text-purple-600 transition hover:scale-110 hover:text-purple-800"
            title="Full screen player">
            ⛶
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-purple-600 transition hover:text-purple-800"
            title={isExpanded ? 'Hide queue' : 'Show queue'}>
            {isExpanded ? '⏬' : '⏫'}
          </button>
        </div>
      </div>

      {/* Expanded View - Playlist */}
      {isExpanded && (
        <div className="max-h-56 overflow-y-auto border-t border-purple-200 bg-white/40 px-4 py-4 sm:px-6">
          <h3 className="mb-3 font-bold text-purple-900">Now Playing Queue</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {queue.slice(currentIndex, currentIndex + 6).map((song, idx) => (
              <div
                key={song.id}
                onClick={() => onSongChange(currentIndex + idx)}
                className={`cursor-pointer rounded-lg p-3 transition ${
                  idx === 0
                    ? 'bg-gradient-to-r from-pink-300 to-purple-300 font-semibold text-purple-900'
                    : 'bg-purple-100/50 text-purple-700 hover:bg-purple-200/50'
                }`}>
                <p className="truncate font-semibold">{song.title}</p>
                <p className="truncate text-xs">{song.artist}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
