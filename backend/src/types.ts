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

export interface QueueItem {
  track: Track;
  addedAt: string;
  requestedBy?: string;
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
  queue: QueueItem[];
  queueHistory: QueueItem[];
  crossfade: number;
  normalized: boolean;
  equalizer: number[];
}

export interface SearchResult {
  tracks: Track[];
  artists: string[];
  albums: string[];
  playlists: Playlist[];
}

export interface WSMessage {
  type: string;
  payload: Record<string, unknown>;
}
