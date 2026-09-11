import { useState, useEffect } from 'react';
import { Song } from '../types';

interface FullScreenPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onTogglePause: () => void;
  onNextSong?: () => void;
  onPreviousSong?: () => void;
  onClose: () => void;
  queue: Song[];
  currentIndex: number;
  onSongChange: (index: number) => void;
}

export default function FullScreenPlayer({
  currentSong,
  isPlaying,
  onTogglePause,
  onNextSong,
  onPreviousSong,
  onClose,
  queue,
  currentIndex,
  onSongChange,
}: FullScreenPlayerProps) {
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);

  useEffect(() => {
    if (isPlaying && currentSong) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
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
  const totalTime = currentSong.duration || 180;
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;
  const totalMinutes = Math.floor(totalTime / 60);
  const totalSeconds = totalTime % 60;

  const mockLyrics = [
    "🎶 Feel the rhythm, hear the beat",
    "🎶 Dancing in the pastel street",
    "🎶 Colors flowing, hearts in sync",
    "🎶 In this moment, on the brink",
    "🎶 Every note lifts us high",
    "🎶 Underneath the purple sky",
    "🎶 Music flows through every vein",
    "🎶 In this melody, we remain",
  ];

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 z-50 flex flex-col animate-fadeIn overflow-hidden">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spinRotate {
          from { transform: rotate(0deg) scale(0.9); }
          to { transform: rotate(360deg) scale(1); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(236, 72, 153, 0.3), 0 25px 50px rgba(168, 85, 247, 0.2); }
          50% { box-shadow: 0 0 40px rgba(236, 72, 153, 0.5), 0 25px 50px rgba(168, 85, 247, 0.4); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-in; }
        .animate-slideUp { animation: slideUp 0.6s ease-out; }
        .animate-spinRotate { animation: spinRotate 0.8s ease-out; }
        .animate-pulseGlow { animation: pulse-glow 2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-purple-300 backdrop-blur-sm animate-slideUp flex-shrink-0">
        <div className="text-purple-900 font-bold text-2xl">Now Playing</div>
        <button
          onClick={onClose}
          className="text-4xl text-purple-600 hover:text-purple-800 transition transform hover:scale-125 hover:rotate-90 duration-300">
          ✕
        </button>
      </div>

      {/* Full-Screen Background Image */}
      <div className="absolute inset-0 flex items-center justify-center text-9xl animate-spinRotate opacity-30 pointer-events-none">
        🎵
      </div>

      {/* Main Content - Overlay */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative z-10 overflow-y-auto">
        {/* Album Art with Animation */}
        <div className="animate-spinRotate mb-8 flex-shrink-0">
          <div className="w-64 h-64 rounded-3xl bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-8xl shadow-2xl border-4 border-purple-200 animate-pulseGlow">
            🎵
          </div>
        </div>

        {/* Song Info with Smooth Typography */}
        <h1 className="text-5xl font-bold text-white text-center mb-2 animate-slideUp drop-shadow-lg flex-shrink-0" style={{fontFamily: 'Playfair Display, serif'}}>
          {currentSong.title}
        </h1>
        <p className="text-xl text-white text-center mb-8 animate-slideUp font-medium drop-shadow-lg flex-shrink-0">
          {currentSong.artist}
        </p>

        {/* Lyrics Display */}
        <div className="w-full max-w-2xl mb-8 px-4 animate-slideUp flex-shrink-0">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-purple-200 shadow-lg">
            <h3 className="text-purple-900 font-bold text-lg mb-4 text-center">✨ Lyrics</h3>
            <div className="space-y-3 text-center max-h-32 overflow-y-auto">
              {mockLyrics.map((lyric, idx) => (
                <p
                  key={idx}
                  className={`text-sm font-medium transition-all ${
                    idx === Math.floor(progress / 12.5)
                      ? 'text-pink-500 text-base font-bold scale-110'
                      : 'text-purple-700'
                  }`}>
                  {lyric}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="w-full max-w-2xl px-4 animate-slideUp flex-shrink-0">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full h-3 bg-purple-200 rounded-full cursor-pointer appearance-none accent-pink-400 hover:accent-pink-500 transition"
            style={{
              backgroundImage: `linear-gradient(to right, rgb(244, 114, 182) 0%, rgb(244, 114, 182) ${progress}%, rgb(216, 180, 254) ${progress}%, rgb(216, 180, 254) 100%)`
            }}
          />
          <div className="flex justify-between text-purple-700 text-sm mt-3 font-medium">
            <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
            <span>{totalMinutes}:{totalSeconds.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Enhanced Playback Controls */}
        <div className="flex items-center gap-12 mt-8 mb-8 animate-slideUp flex-shrink-0">
          <button
            onClick={handlePrevious}
            className="text-5xl text-purple-600 hover:text-purple-900 transition transform hover:scale-125 duration-300 hover:-translate-x-1">
            ⏮️
          </button>
          <button
            onClick={onTogglePause}
            className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white p-6 rounded-full transition transform hover:scale-125 shadow-2xl hover:shadow-3xl duration-300 active:scale-95">
            <span className="text-6xl block">{isPlaying ? '⏸️' : '▶️'}</span>
          </button>
          <button
            onClick={handleNext}
            className="text-5xl text-purple-600 hover:text-purple-900 transition transform hover:scale-125 duration-300 hover:translate-x-1">
            ⏭️
          </button>
        </div>

        {/* Enhanced Volume Control */}
        <div className="flex items-center gap-6 w-full max-w-2xl justify-center mb-8 px-4 animate-slideUp flex-shrink-0">
          <span className="text-2xl">🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 h-3 bg-purple-200 rounded-full cursor-pointer appearance-none accent-purple-500"
          />
          <span className="text-purple-700 font-semibold w-12 text-right text-sm">{volume}%</span>
        </div>
      </div>

      {/* Songs List Section - Appears Below */}
      <div className="bg-white/60 backdrop-blur-md border-t border-purple-300 px-6 py-4 max-h-48 overflow-y-auto shadow-lg animate-slideUp flex-shrink-0">
        <h2 className="text-purple-900 font-bold text-lg mb-3" style={{fontFamily: 'Playfair Display, serif'}}>🎵 Next Songs</h2>
        <div className="space-y-2">
          {queue.slice(currentIndex + 1, currentIndex + 4).map((song, idx) => (
            <div
              key={song.id}
              onClick={() => onSongChange(currentIndex + idx + 1)}
              className="p-3 rounded-lg bg-purple-100/70 hover:bg-pink-200/70 cursor-pointer transition transform hover:scale-105 hover:shadow-md">
              <p className="text-purple-900 font-semibold truncate text-sm">{idx + 1}. {song.title}</p>
              <p className="text-xs text-purple-600 truncate">{song.artist}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
