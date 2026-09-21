import { Song } from '../types';

/**
 * Playback for the player UI.
 *
 * A song with an `audioUrl` is played through an <audio> element — that is the
 * real path, and the only change needed to use licensed recordings is to set
 * `audioUrl` on the track.
 *
 * Without one there is nothing to decode, so the engine synthesises an
 * instrumental with the Web Audio API instead: a bass line, an arpeggiated
 * melody and a sustained pad, seeded from the song id so a given track always
 * sounds the same. It is a stand-in for the recording, not the recording.
 */

type Listeners = {
  onTime?: (seconds: number) => void;
  onEnded?: () => void;
  onDuration?: (seconds: number) => void;
};

const BEAT_LOOKAHEAD = 0.25; // seconds of notes scheduled ahead of the clock
const SCHEDULER_TICK = 25; // ms

/** Deterministic hash so each song keeps its own melody between plays. */
const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** Deterministic [0,1) value for a seed/step pair. */
const rand = (seed: number, step: number): number => {
  let t = (seed + step * 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

// Minor pentatonic — forgiving enough that any random walk over it stays musical.
const SCALE = [0, 3, 5, 7, 10];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private element: HTMLAudioElement | null = null;

  private song: Song | null = null;
  private listeners: Listeners = {};

  private volume = 0.7;
  private playing = false;

  // Synth transport
  private schedulerId: number | null = null;
  private tickId: number | null = null;
  private beat = 0;
  private beatDuration = 0.5;
  private nextNoteTime = 0;
  private startedAtCtxTime = 0;
  private offset = 0;
  private seed = 0;
  private rootMidi = 57;

  private get usesElement() {
    return this.element !== null;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  setListeners(listeners: Listeners) {
    this.listeners = listeners;
  }

  load(song: Song) {
    this.stopSources();
    this.song = song;
    this.offset = 0;
    this.beat = 0;

    if (song.audioUrl) {
      const element = new Audio(song.audioUrl);
      element.preload = 'auto';
      element.volume = this.volume;
      element.addEventListener('timeupdate', () => {
        this.listeners.onTime?.(element.currentTime);
      });
      // The file's real length wins over the value recorded in the catalogue.
      element.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(element.duration) && element.duration > 0) {
          this.listeners.onDuration?.(element.duration);
        }
      });
      element.addEventListener('error', () => {
        // Tearing an element down clears its src, which fires error; ignore that.
        if (this.element !== element) return;
        // A browser missing the codec (AAC is absent from plain Chromium builds,
        // for one) would otherwise leave the track silent, so fall back to the
        // synthesised stand-in rather than playing nothing at all.
        console.warn(
          `Could not decode "${song.audioUrl}" for "${song.title}"; playing the synthesised stand-in instead.`
        );
        const wasPlaying = this.playing;
        this.element = null;
        this.configureSynth(song);
        this.listeners.onDuration?.(song.duration || 180);
        if (wasPlaying) void this.play();
      });
      element.addEventListener('ended', () => {
        this.playing = false;
        this.listeners.onEnded?.();
      });
      this.element = element;
      return;
    }

    this.configureSynth(song);
  }

  private configureSynth(song: Song) {
    this.element = null;
    this.offset = 0;
    this.beat = 0;
    this.seed = hashString(song.id);
    // 84–108 bpm, and a root between A3 and D4, so tracks differ from each other.
    const tempo = 84 + Math.floor(rand(this.seed, 1) * 24);
    this.beatDuration = 60 / tempo;
    this.rootMidi = 57 + Math.floor(rand(this.seed, 2) * 5);
  }

  async play() {
    if (!this.song) return;
    this.playing = true;

    if (this.element) {
      try {
        await this.element.play();
      } catch {
        // Autoplay was refused; the next user gesture will start it.
        this.playing = false;
      }
      return;
    }

    const ctx = this.ensureContext();
    // Browsers start the context suspended until a user gesture reaches it.
    if (ctx.state === 'suspended') await ctx.resume();

    this.startedAtCtxTime = ctx.currentTime;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.beat = Math.floor(this.offset / this.beatDuration);
    this.applyVolume();

    this.schedulerId = window.setInterval(() => this.scheduleAhead(), SCHEDULER_TICK);
    this.tickId = window.setInterval(() => this.reportTime(), 250);
  }

  pause() {
    this.playing = false;

    if (this.element) {
      this.element.pause();
      return;
    }

    this.offset = this.currentTime();
    this.clearTimers();
    // Notes already scheduled cannot be unscheduled, so mute the bus instead of
    // letting them ring out after the pause.
    if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.015);
    }
  }

  seek(seconds: number) {
    const target = Math.max(0, Math.min(seconds, this.duration()));

    if (this.element) {
      this.element.currentTime = target;
      this.listeners.onTime?.(target);
      return;
    }

    this.offset = target;
    this.beat = Math.floor(target / this.beatDuration);
    if (this.ctx) {
      this.startedAtCtxTime = this.ctx.currentTime;
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }
    this.listeners.onTime?.(target);
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.element) {
      this.element.volume = this.volume;
      return;
    }
    this.applyVolume();
  }

  currentTime(): number {
    if (this.element) return this.element.currentTime;
    if (!this.ctx || !this.playing) return this.offset;
    return this.offset + (this.ctx.currentTime - this.startedAtCtxTime);
  }

  duration(): number {
    if (this.element && Number.isFinite(this.element.duration) && this.element.duration > 0) {
      return this.element.duration;
    }
    return this.song?.duration || 180;
  }

  dispose() {
    this.stopSources();
    this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  private stopSources() {
    this.clearTimers();
    this.playing = false;
    if (this.element) {
      this.element.pause();
      this.element.src = '';
      this.element = null;
    }
    if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  private clearTimers() {
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    if (this.tickId !== null) {
      clearInterval(this.tickId);
      this.tickId = null;
    }
  }

  private applyVolume() {
    if (!this.ctx || !this.master) return;
    // The synth stacks several voices, so it needs headroom the element does not.
    const target = this.playing ? this.volume * 0.22 : 0;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
  }

  private reportTime() {
    const time = this.currentTime();
    this.listeners.onTime?.(time);
    if (time >= this.duration()) {
      this.pause();
      this.offset = 0;
      this.listeners.onEnded?.();
    }
  }

  private scheduleAhead() {
    const ctx = this.ctx;
    if (!ctx) return;
    while (this.nextNoteTime < ctx.currentTime + BEAT_LOOKAHEAD) {
      this.scheduleBeat(this.beat, this.nextNoteTime);
      this.nextNoteTime += this.beatDuration;
      this.beat += 1;
    }
  }

  private scheduleBeat(beat: number, time: number) {
    const bar = Math.floor(beat / 4);
    const degree = Math.floor(rand(this.seed, bar) * SCALE.length);
    const chordRoot = this.rootMidi + SCALE[degree];

    // Bass on the beat.
    this.tone(chordRoot - 24, time, this.beatDuration * 0.9, 'sine', 0.5);

    // Pad at the top of each bar.
    if (beat % 4 === 0) {
      const barLength = this.beatDuration * 4;
      this.tone(chordRoot, time, barLength, 'sine', 0.16, 0.35);
      this.tone(chordRoot + 7, time, barLength, 'sine', 0.13, 0.35);
      this.tone(chordRoot + 12, time, barLength, 'triangle', 0.1, 0.35);
    }

    // Melody in eighths, walking the scale above the chord.
    for (let eighth = 0; eighth < 2; eighth++) {
      const step = beat * 2 + eighth;
      if (rand(this.seed, step + 500) < 0.28) continue; // rests keep it from droning
      const octave = rand(this.seed, step + 900) > 0.75 ? 12 : 0;
      const note = SCALE[Math.floor(rand(this.seed, step + 100) * SCALE.length)];
      this.tone(
        this.rootMidi + 12 + note + octave,
        time + eighth * (this.beatDuration / 2),
        this.beatDuration * 0.45,
        'triangle',
        0.22
      );
    }
  }

  private tone(
    midi: number,
    time: number,
    duration: number,
    type: OscillatorType,
    peak: number,
    attack = 0.01
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = midiToFreq(midi);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(peak, time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }
}
