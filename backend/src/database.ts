import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import { Track, Playlist } from './types.js';

const DB_PATH = path.join(os.homedir(), '.andash', 'library.db');

let db: Database.Database;

export function initDatabase(): void {
  const dir = path.dirname(DB_PATH);
  import('fs').then(fs => fs.mkdirSync(dir, { recursive: true }));

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT NOT NULL DEFAULT 'Unknown',
      album TEXT NOT NULL DEFAULT 'Unknown',
      duration REAL NOT NULL DEFAULT 0,
      url TEXT NOT NULL,
      thumbnail TEXT DEFAULT '',
      path TEXT,
      downloaded INTEGER NOT NULL DEFAULT 0,
      file_size INTEGER DEFAULT 0,
      format TEXT DEFAULT 'm4a',
      bitrate INTEGER DEFAULT 0,
      sample_rate INTEGER DEFAULT 0,
      play_count INTEGER NOT NULL DEFAULT 0,
      favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      thumbnail TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id TEXT NOT NULL,
      track_id TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (playlist_id, track_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS play_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id TEXT NOT NULL,
      played_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS download_queue (
      id TEXT PRIMARY KEY,
      track_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      progress REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
    CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album);
    CREATE INDEX IF NOT EXISTS idx_tracks_favorite ON tracks(favorite);
    CREATE INDEX IF NOT EXISTS idx_play_history_played ON play_history(played_at);
  `);
}

export function searchTracks(query: string, limit = 50): Track[] {
  const stmt = db.prepare(`
    SELECT * FROM tracks
    WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
    ORDER BY play_count DESC
    LIMIT ?
  `);
  const q = `%${query}%`;
  return stmt.all(q, q, q, limit) as Track[];
}

export function getTrack(id: string): Track | undefined {
  return db.prepare('SELECT * FROM tracks WHERE id = ?').get(id) as Track | undefined;
}

export function saveTrack(track: Track): void {
  db.prepare(`
    INSERT INTO tracks (id, title, artist, album, duration, url, thumbnail, path, format, bitrate, sample_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      artist = excluded.artist,
      album = excluded.album,
      path = excluded.path,
      downloaded = 1
  `).run(
    track.id, track.title, track.artist, track.album, track.duration,
    track.url, track.thumbnail, track.path || null,
    track.format || 'm4a', track.bitrate || 0, track.sampleRate || 0
  );
}

export function getTracksByAlbum(album: string): Track[] {
  return db.prepare('SELECT * FROM tracks WHERE album = ? ORDER BY title').all(album) as Track[];
}

export function getTracksByArtist(artist: string): Track[] {
  return db.prepare('SELECT * FROM tracks WHERE artist = ? ORDER BY album, title').all(artist) as Track[];
}

export function getAlbums(): { album: string; artist: string; thumbnail: string; trackCount: number }[] {
  return db.prepare(`
    SELECT album, artist, MAX(thumbnail) as thumbnail, COUNT(*) as trackCount
    FROM tracks GROUP BY album ORDER BY album
  `).all() as any[];
}

export function getArtists(): { artist: string; albumCount: number; trackCount: number }[] {
  return db.prepare(`
    SELECT artist, COUNT(DISTINCT album) as albumCount, COUNT(*) as trackCount
    FROM tracks GROUP BY artist ORDER BY artist
  `).all() as any[];
}

export function getDownloads(): Track[] {
  return db.prepare('SELECT * FROM tracks WHERE downloaded = 1 ORDER BY title').all() as Track[];
}

export function getRecentPlayed(limit = 20): Track[] {
  return db.prepare(`
    SELECT DISTINCT t.* FROM tracks t
    JOIN play_history ph ON ph.track_id = t.id
    ORDER BY ph.played_at DESC LIMIT ?
  `).all(limit) as Track[];
}

export function recordPlay(trackId: string): void {
  db.prepare('INSERT INTO play_history (track_id) VALUES (?)').run(trackId);
  db.prepare('UPDATE tracks SET play_count = play_count + 1 WHERE id = ?').run(trackId);
}

export function getMostPlayed(limit = 20): Track[] {
  return db.prepare('SELECT * FROM tracks ORDER BY play_count DESC LIMIT ?').all(limit) as Track[];
}

export function getFavorites(): Track[] {
  return db.prepare('SELECT * FROM tracks WHERE favorite = 1').all() as Track[];
}

export function toggleFavorite(trackId: string): boolean {
  const track = db.prepare('SELECT favorite FROM tracks WHERE id = ?').get(trackId) as any;
  if (!track) return false;
  const newVal = track.favorite ? 0 : 1;
  db.prepare('UPDATE tracks SET favorite = ? WHERE id = ?').run(newVal, trackId);
  return !!newVal;
}

export function createPlaylist(name: string, description = ''): Playlist {
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO playlists (id, name, description) VALUES (?, ?, ?)').run(id, name, description);
  return getPlaylist(id)!;
}

export function getPlaylist(id: string): Playlist | undefined {
  const pl = db.prepare('SELECT * FROM playlists WHERE id = ?').get(id) as any;
  if (!pl) return undefined;
  const tracks = db.prepare(`
    SELECT t.* FROM tracks t
    JOIN playlist_tracks pt ON pt.track_id = t.id
    WHERE pt.playlist_id = ?
    ORDER BY pt.position
  `).all(id) as Track[];
  return {
    id: pl.id,
    name: pl.name,
    description: pl.description || '',
    thumbnail: pl.thumbnail || '',
    tracks,
    createdAt: pl.created_at,
    updatedAt: pl.updated_at,
    trackCount: tracks.length,
    duration: tracks.reduce((s: number, t: Track) => s + t.duration, 0)
  };
}

export function getPlaylists(): Playlist[] {
  const pls = db.prepare('SELECT * FROM playlists ORDER BY updated_at DESC').all() as any[];
  return pls.map(pl => getPlaylist(pl.id)!);
}

export function addTrackToPlaylist(playlistId: string, trackId: string): void {
  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) + 1 as pos FROM playlist_tracks WHERE playlist_id = ?')
    .get(playlistId) as any;
  db.prepare('INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)')
    .run(playlistId, trackId, maxPos.pos);
  db.prepare('UPDATE playlists SET updated_at = datetime(\'now\') WHERE id = ?').run(playlistId);
}

export function removeTrackFromPlaylist(playlistId: string, trackId: string): void {
  db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?').run(playlistId, trackId);
  db.prepare('UPDATE playlists SET updated_at = datetime(\'now\') WHERE id = ?').run(playlistId);
}

export function reorderPlaylistTracks(playlistId: string, trackIds: string[]): void {
  const tx = db.transaction(() => {
    trackIds.forEach((id, idx) => {
      db.prepare('UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?')
        .run(idx, playlistId, id);
    });
  });
  tx();
  db.prepare('UPDATE playlists SET updated_at = datetime(\'now\') WHERE id = ?').run(playlistId);
}

export function deletePlaylist(id: string): void {
  db.prepare('DELETE FROM playlists WHERE id = ?').run(id);
}

export function getDownloadQueue(): any[] {
  return db.prepare('SELECT * FROM download_queue ORDER BY created_at ASC').all();
}

export function addToDownloadQueue(id: string, trackId: string): void {
  db.prepare('INSERT OR IGNORE INTO download_queue (id, track_id) VALUES (?, ?)').run(id, trackId);
}

export function updateDownloadStatus(id: string, status: string, progress: number): void {
  db.prepare('UPDATE download_queue SET status = ?, progress = ? WHERE id = ?').run(status, progress, id);
}

export function removeFromDownloadQueue(id: string): void {
  db.prepare('DELETE FROM download_queue WHERE id = ?').run(id);
}

export function closeDatabase(): void {
  if (db) db.close();
}
