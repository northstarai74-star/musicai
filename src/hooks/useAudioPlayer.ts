import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { Song } from '../types';

interface UseAudioPlayerOptions {
  song: Song | null;
  isPlaying: boolean;
  onEnded: () => void;
}

/**
 * Owns the single AudioEngine instance and keeps React state in step with it.
 * Playback position comes from the engine, so the UI reflects real audio
 * rather than a timer.
 */
export function useAudioPlayer({ song, isPlaying, onEnded }: UseAudioPlayerOptions) {
  const engineRef = useRef<AudioEngine | null>(null);
  const endedRef = useRef(onEnded);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(70);

  endedRef.current = onEnded;

  if (engineRef.current === null) {
    engineRef.current = new AudioEngine();
  }

  useEffect(() => {
    const engine = engineRef.current!;
    engine.setListeners({
      onTime: (seconds) => setCurrentTime(seconds),
      onEnded: () => {
        setCurrentTime(0);
        endedRef.current();
      },
    });
    return () => engine.dispose();
  }, []);

  // A new track resets the transport; playback resumes from the isPlaying effect.
  useEffect(() => {
    const engine = engineRef.current!;
    if (!song) return;
    engine.load(song);
    engine.setVolume(volume / 100);
    setCurrentTime(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id]);

  useEffect(() => {
    const engine = engineRef.current!;
    if (!song) return;
    if (isPlaying) {
      void engine.play();
    } else {
      engine.pause();
    }
  }, [isPlaying, song]);

  useEffect(() => {
    engineRef.current!.setVolume(volume / 100);
  }, [volume]);

  const seek = useCallback((seconds: number) => {
    engineRef.current!.seek(seconds);
    setCurrentTime(seconds);
  }, []);

  const setVolume = useCallback((next: number) => {
    setVolumeState(Math.max(0, Math.min(100, next)));
  }, []);

  const duration = song?.duration || 180;

  return { currentTime, duration, volume, setVolume, seek };
}
