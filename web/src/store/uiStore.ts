import { create } from 'zustand';

export type Theme = 'amoled' | 'dark' | 'system';
export type ViewMode = 'normal' | 'dock' | 'ambient';
export type VisualizerType = 'spectrum' | 'waveform' | 'circular' | 'bars' | 'none';

interface UIStore {
  sidebarOpen: boolean;
  theme: Theme;
  viewMode: ViewMode;
  fullscreen: boolean;
  nowPlayingOpen: boolean;
  visualizerType: VisualizerType;
  audioSettingsOpen: boolean;
  autoHideMouse: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  setViewMode: (mode: ViewMode) => void;
  setFullscreen: (fullscreen: boolean) => void;
  toggleFullscreen: () => void;
  setNowPlayingOpen: (open: boolean) => void;
  setVisualizerType: (type: VisualizerType) => void;
  setAudioSettingsOpen: (open: boolean) => void;
  setAutoHideMouse: (hide: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  theme: 'amoled',
  viewMode: 'normal',
  fullscreen: false,
  nowPlayingOpen: false,
  visualizerType: 'none',
  audioSettingsOpen: false,
  autoHideMouse: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setTheme: (theme) => set({ theme }),
  setViewMode: (viewMode) => set({ viewMode }),
  setFullscreen: (fullscreen) => set({ fullscreen }),
  toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),
  setNowPlayingOpen: (nowPlayingOpen) => set({ nowPlayingOpen }),
  setVisualizerType: (visualizerType) => set({ visualizerType }),
  setAudioSettingsOpen: (audioSettingsOpen) => set({ audioSettingsOpen }),
  setAutoHideMouse: (autoHideMouse) => set({ autoHideMouse }),
}));
