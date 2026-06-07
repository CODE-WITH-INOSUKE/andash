import { create } from 'zustand';
import { Track, Playlist } from '@/utils/api';

interface LibraryStore {
  favorites: Track[];
  recentPlayed: Track[];
  mostPlayed: Track[];
  downloads: Track[];
  playlists: Playlist[];
  loading: boolean;
  searchHistory: string[];

  setFavorites: (tracks: Track[]) => void;
  setRecentPlayed: (tracks: Track[]) => void;
  setMostPlayed: (tracks: Track[]) => void;
  setDownloads: (tracks: Track[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  setLoading: (loading: boolean) => void;
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  favorites: [],
  recentPlayed: [],
  mostPlayed: [],
  downloads: [],
  playlists: [],
  loading: false,
  searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),

  setFavorites: (favorites) => set({ favorites }),
  setRecentPlayed: (recentPlayed) => set({ recentPlayed }),
  setMostPlayed: (mostPlayed) => set({ mostPlayed }),
  setDownloads: (downloads) => set({ downloads }),
  setPlaylists: (playlists) => set({ playlists }),
  setLoading: (loading) => set({ loading }),

  addToSearchHistory: (query) =>
    set((s) => {
      const filtered = s.searchHistory.filter((h) => h !== query);
      const updated = [query, ...filtered].slice(0, 10);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
      return { searchHistory: updated };
    }),

  clearSearchHistory: () => {
    localStorage.removeItem('searchHistory');
    set({ searchHistory: [] });
  },
}));
