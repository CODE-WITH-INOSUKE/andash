import { create } from 'zustand';
import { Track, PlayerState } from '@/utils/api';

interface PlayerStore extends PlayerState {
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setSpeed: (speed: number) => void;
  setRepeat: (repeat: 'none' | 'one' | 'all') => void;
  toggleRepeat: () => void;
  setShuffle: (shuffle: boolean) => void;
  toggleShuffle: () => void;
  setQueue: (queue: { track: Track; addedAt: string }[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setCrossfade: (crossfade: number) => void;
  setNormalized: (normalized: boolean) => void;
  setEqualizer: (equalizer: number[]) => void;
  setPlayerState: (state: Partial<PlayerState>) => void;
  togglePlay: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 80,
  muted: false,
  position: 0,
  duration: 0,
  speed: 1,
  repeat: 'none',
  shuffle: false,
  queue: [],
  queueHistory: [],
  crossfade: 0,
  normalized: true,
  equalizer: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(100, volume)) }),

  setMuted: (muted) => set({ muted }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),

  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setSpeed: (speed) => set({ speed }),

  setRepeat: (repeat) => set({ repeat }),
  toggleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === 'none' ? 'all' : s.repeat === 'all' ? 'one' : 'none',
    })),

  setShuffle: (shuffle) => set({ shuffle }),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

  setQueue: (queue) => set({ queue }),
  addToQueue: (track) =>
    set((s) => ({
      queue: [...s.queue, { track, addedAt: new Date().toISOString() }],
    })),

  removeFromQueue: (index) =>
    set((s) => ({
      queue: s.queue.filter((_, i) => i !== index),
    })),

  reorderQueue: (from, to) =>
    set((s) => {
      const newQueue = [...s.queue];
      const [removed] = newQueue.splice(from, 1);
      newQueue.splice(to, 0, removed);
      return { queue: newQueue };
    }),

  clearQueue: () => set({ queue: [] }),

  playNext: () => {
    const { queue, shuffle, currentTrack, queueHistory } = get();
    if (queue.length === 0) return;

    let nextIndex = 0;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    }
    const next = queue[nextIndex];
    const newQueue = queue.filter((_, i) => i !== nextIndex);
    set({
      currentTrack: next.track,
      queue: newQueue,
      queueHistory: currentTrack
        ? [...queueHistory, { track: currentTrack, addedAt: new Date().toISOString() }]
        : queueHistory,
      isPlaying: true,
      position: 0,
    });
  },

  playPrevious: () => {
    const { queueHistory, currentTrack } = get();
    if (queueHistory.length === 0) return;

    const prev = queueHistory[queueHistory.length - 1];
    set({
      currentTrack: prev.track,
      queueHistory: queueHistory.slice(0, -1),
      queue: currentTrack
        ? [{ track: currentTrack, addedAt: new Date().toISOString() }, ...queueHistory.slice(-1)]
        : queueHistory,
      isPlaying: true,
      position: 0,
    });
  },

  setCrossfade: (crossfade) => set({ crossfade }),
  setNormalized: (normalized) => set({ normalized }),
  setEqualizer: (equalizer) => set({ equalizer }),

  setPlayerState: (state) => set(state),

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
}));
