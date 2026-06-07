import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  thumbnail: string;
  path?: string;
  downloaded: boolean;
  fileSize?: number;
  format?: string;
  bitrate?: number;
  sampleRate?: number;
  playCount?: number;
  favorite?: number;
  createdAt?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
  trackCount: number;
  duration: number;
}

export interface SearchResult {
  tracks: Track[];
  artists: string[];
  albums: string[];
  playlists: Playlist[];
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  position: number;
  duration: number;
  speed: number;
  repeat: 'none' | 'one' | 'all';
  shuffle: boolean;
  queue: { track: Track; addedAt: string }[];
  queueHistory: { track: Track; addedAt: string }[];
  crossfade: number;
  normalized: boolean;
  equalizer: number[];
}

export interface DownloadJob {
  id: string;
  trackId: string;
  track: Track;
  progress: number;
  speed: string;
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'paused';
  eta?: string;
  error?: string;
}

export async function searchMusic(query: string): Promise<SearchResult> {
  const { data } = await api.get('/search', { params: { q: query } });
  return data;
}

export async function getTrack(id: string): Promise<Track> {
  const { data } = await api.get(`/tracks/${id}`);
  return data;
}

export async function getAlbums(): Promise<{ album: string; artist: string; thumbnail: string; trackCount: number }[]> {
  const { data } = await api.get('/albums');
  return data;
}

export async function getArtists(): Promise<{ artist: string; albumCount: number; trackCount: number }[]> {
  const { data } = await api.get('/artists');
  return data;
}

export async function getRecentPlayed(): Promise<Track[]> {
  const { data } = await api.get('/recent');
  return data;
}

export async function getMostPlayed(): Promise<Track[]> {
  const { data } = await api.get('/most-played');
  return data;
}

export async function getFavorites(): Promise<Track[]> {
  const { data } = await api.get('/favorites');
  return data;
}

export async function toggleFavorite(trackId: string): Promise<boolean> {
  const { data } = await api.post(`/tracks/${trackId}/favorite`);
  return data.favorite;
}

export async function getDownloads(): Promise<Track[]> {
  const { data } = await api.get('/downloads');
  return data;
}

export async function getPlaylists(): Promise<Playlist[]> {
  const { data } = await api.get('/playlists');
  return data;
}

export async function getPlaylist(id: string): Promise<Playlist> {
  const { data } = await api.get(`/playlists/${id}`);
  return data;
}

export async function createPlaylist(name: string, description?: string): Promise<Playlist> {
  const { data } = await api.post('/playlists', { name, description });
  return data;
}

export async function deletePlaylist(id: string): Promise<void> {
  await api.delete(`/playlists/${id}`);
}

export async function addToPlaylist(playlistId: string, trackId: string): Promise<void> {
  await api.post(`/playlists/${playlistId}/tracks`, { trackId });
}

export async function removeFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  await api.delete(`/playlists/${playlistId}/tracks/${trackId}`);
}

export async function reorderPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
  await api.put(`/playlists/${playlistId}/tracks/reorder`, { trackIds });
}

export async function downloadTrack(trackId: string): Promise<void> {
  await api.post('/download', { trackId });
}

export async function downloadPlaylist(playlistId: string): Promise<void> {
  await api.post('/download/playlist', { playlistId });
}

export async function getDownloadQueue(): Promise<DownloadJob[]> {
  const { data } = await api.get('/download/queue');
  return data;
}

export async function cancelDownload(id: string): Promise<void> {
  await api.delete(`/download/${id}`);
}

export async function pauseDownload(id: string): Promise<void> {
  await api.post(`/download/${id}/pause`);
}

export async function resumeDownload(id: string): Promise<void> {
  await api.post(`/download/${id}/resume`);
}

export async function getPlayerState(): Promise<PlayerState> {
  const { data } = await api.get('/player');
  return data;
}

export async function getTracksByAlbum(album: string): Promise<Track[]> {
  const { data } = await api.get('/tracks', { params: { album } });
  return data;
}

export async function getTracksByArtist(artist: string): Promise<Track[]> {
  const { data } = await api.get('/tracks', { params: { artist } });
  return data;
}

export default api;
