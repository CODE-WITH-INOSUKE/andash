import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { Track, Playlist } from './types.js';

const DB_PATH = path.join(os.homedir(), '.andash', 'library.db');

function esc(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

function runSQL(sql: string): void {
  execSync(`sqlite3 "${DB_PATH}"`, {
    input: sql,
    encoding: 'utf-8',
    timeout: 30000,
  });
}

function all<T = Record<string, unknown>>(sql: string): T[] {
  try {
    const output = execSync(`sqlite3 -json "${DB_PATH}"`, {
      input: sql,
      encoding: 'utf-8',
      timeout: 10000,
    }).trim();
    if (!output) return [];
    return JSON.parse(output) as T[];
  } catch {
    return [];
  }
}

function get<T = Record<string, unknown>>(sql: string): T | undefined {
  const rows = all<T>(sql);
  return rows[0];
}

function rowToTrack(row: Record<string, unknown>): Track {
  return {
    id: row.id as string,
    title: row.title as string,
    artist: row.artist as string,
    album: row.album as string,
    duration: row.duration as number,
    url: row.url as string,
    thumbnail: (row.thumbnail as string) || '',
    path: row.path as string | undefined,
    downloaded: !!(row.downloaded as number),
    fileSize: row.file_size as number | undefined,
    format: row.format as string | undefined,
    bitrate: row.bitrate as number | undefined,
    sampleRate: row.sample_rate as number | undefined,
    playCount: row.play_count as number | undefined,
    favorite: row.favorite as number | undefined,
    createdAt: row.created_at as string | undefined,
  };
}

export async function initDatabase(): Promise<void> {
  const dir = path.dirname(DB_PATH);
  fs.mkdirSync(dir, { recursive: true });

  runSQL(`
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
  const rows = all<Record<string, unknown>>(
    `SELECT * FROM tracks
     WHERE title LIKE ${esc(`%${query}%`)} OR artist LIKE ${esc(`%${query}%`)} OR album LIKE ${esc(`%${query}%`)}
     ORDER BY play_count DESC
     LIMIT ${limit}`
  );
  return rows.map(rowToTrack);
}

export function getTrack(id: string): Track | undefined {
  const row = get<Record<string, unknown>>(`SELECT * FROM tracks WHERE id = ${esc(id)}`);
  return row ? rowToTrack(row) : undefined;
}

export function saveTrack(track: Track): void {
  runSQL(
    `INSERT INTO tracks (id, title, artist, album, duration, url, thumbnail, path, format, bitrate, sample_rate)
     VALUES (${esc(track.id)}, ${esc(track.title)}, ${esc(track.artist)}, ${esc(track.album)}, ${track.duration},
             ${esc(track.url)}, ${esc(track.thumbnail)}, ${esc(track.path || null)},
             ${esc(track.format || 'm4a')}, ${track.bitrate || 0}, ${track.sampleRate || 0})
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       artist = excluded.artist,
       album = excluded.album,
       path = excluded.path,
       downloaded = 1`
  );
}

export function getTracksByAlbum(album: string): Track[] {
  return all<Record<string, unknown>>(
    `SELECT * FROM tracks WHERE album = ${esc(album)} ORDER BY title`
  ).map(rowToTrack);
}

export function getTracksByArtist(artist: string): Track[] {
  return all<Record<string, unknown>>(
    `SELECT * FROM tracks WHERE artist = ${esc(artist)} ORDER BY album, title`
  ).map(rowToTrack);
}

export function getAlbums(): { album: string; artist: string; thumbnail: string; trackCount: number }[] {
  const rows = all<Record<string, unknown>>(
    'SELECT album, artist, MAX(thumbnail) as thumbnail, COUNT(*) as trackCount FROM tracks GROUP BY album ORDER BY album'
  );
  return rows as any[];
}

export function getArtists(): { artist: string; albumCount: number; trackCount: number }[] {
  const rows = all<Record<string, unknown>>(
    'SELECT artist, COUNT(DISTINCT album) as albumCount, COUNT(*) as trackCount FROM tracks GROUP BY artist ORDER BY artist'
  );
  return rows as any[];
}

export function getDownloads(): Track[] {
  return all<Record<string, unknown>>(
    'SELECT * FROM tracks WHERE downloaded = 1 ORDER BY title'
  ).map(rowToTrack);
}

export function getRecentPlayed(limit = 20): Track[] {
  return all<Record<string, unknown>>(
    `SELECT DISTINCT t.* FROM tracks t
     JOIN play_history ph ON ph.track_id = t.id
     ORDER BY ph.played_at DESC LIMIT ${limit}`
  ).map(rowToTrack);
}

export function recordPlay(trackId: string): void {
  runSQL(`INSERT INTO play_history (track_id) VALUES (${esc(trackId)})`);
  runSQL(`UPDATE tracks SET play_count = play_count + 1 WHERE id = ${esc(trackId)}`);
}

export function getMostPlayed(limit = 20): Track[] {
  return all<Record<string, unknown>>(
    `SELECT * FROM tracks ORDER BY play_count DESC LIMIT ${limit}`
  ).map(rowToTrack);
}

export function getFavorites(): Track[] {
  return all<Record<string, unknown>>(
    'SELECT * FROM tracks WHERE favorite = 1'
  ).map(rowToTrack);
}

export function toggleFavorite(trackId: string): boolean {
  const row = get<Record<string, unknown>>(
    `SELECT favorite FROM tracks WHERE id = ${esc(trackId)}`
  );
  if (!row) return false;
  const newVal = (row.favorite as number) ? 0 : 1;
  runSQL(`UPDATE tracks SET favorite = ${newVal} WHERE id = ${esc(trackId)}`);
  return !!newVal;
}

export function createPlaylist(name: string, description = ''): Playlist {
  const id = crypto.randomUUID();
  runSQL(
    `INSERT INTO playlists (id, name, description) VALUES (${esc(id)}, ${esc(name)}, ${esc(description)})`
  );
  return getPlaylist(id)!;
}

function rowToPlaylist(pl: Record<string, unknown>, tracks: Track[]): Playlist {
  return {
    id: pl.id as string,
    name: pl.name as string,
    description: (pl.description as string) || '',
    thumbnail: (pl.thumbnail as string) || '',
    tracks,
    createdAt: pl.created_at as string,
    updatedAt: pl.updated_at as string,
    trackCount: tracks.length,
    duration: tracks.reduce((s, t) => s + t.duration, 0),
  };
}

export function getPlaylist(id: string): Playlist | undefined {
  const pl = get<Record<string, unknown>>(`SELECT * FROM playlists WHERE id = ${esc(id)}`);
  if (!pl) return undefined;
  const tracks = all<Record<string, unknown>>(
    `SELECT t.* FROM tracks t
     JOIN playlist_tracks pt ON pt.track_id = t.id
     WHERE pt.playlist_id = ${esc(id)}
     ORDER BY pt.position`
  ).map(rowToTrack);
  return rowToPlaylist(pl, tracks);
}

export function getPlaylists(): Playlist[] {
  const pls = all<Record<string, unknown>>('SELECT * FROM playlists ORDER BY updated_at DESC');
  return pls.map((pl) => getPlaylist(pl.id as string)!).filter(Boolean);
}

export function addTrackToPlaylist(playlistId: string, trackId: string): void {
  const maxPos = get<Record<string, unknown>>(
    `SELECT COALESCE(MAX(position), -1) + 1 as pos FROM playlist_tracks WHERE playlist_id = ${esc(playlistId)}`
  );
  const pos = (maxPos?.pos as number) ?? 0;
  runSQL(
    `INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position)
     VALUES (${esc(playlistId)}, ${esc(trackId)}, ${pos})`
  );
  runSQL(`UPDATE playlists SET updated_at = datetime('now') WHERE id = ${esc(playlistId)}`);
}

export function removeTrackFromPlaylist(playlistId: string, trackId: string): void {
  runSQL(
    `DELETE FROM playlist_tracks WHERE playlist_id = ${esc(playlistId)} AND track_id = ${esc(trackId)}`
  );
  runSQL(`UPDATE playlists SET updated_at = datetime('now') WHERE id = ${esc(playlistId)}`);
}

export function reorderPlaylistTracks(playlistId: string, trackIds: string[]): void {
  const statements = trackIds.map((id, idx) =>
    `UPDATE playlist_tracks SET position = ${idx} WHERE playlist_id = ${esc(playlistId)} AND track_id = ${esc(id)}`
  ).join(';\n');
  runSQL(statements);
  runSQL(`UPDATE playlists SET updated_at = datetime('now') WHERE id = ${esc(playlistId)}`);
}

export function deletePlaylist(id: string): void {
  runSQL(`DELETE FROM playlists WHERE id = ${esc(id)}`);
}

export function getDownloadQueue(): Record<string, unknown>[] {
  return all<Record<string, unknown>>('SELECT * FROM download_queue ORDER BY created_at ASC');
}

export function addToDownloadQueue(id: string, trackId: string): void {
  runSQL(
    `INSERT OR IGNORE INTO download_queue (id, track_id) VALUES (${esc(id)}, ${esc(trackId)})`
  );
}

export function updateDownloadStatus(id: string, status: string, progress: number): void {
  runSQL(
    `UPDATE download_queue SET status = ${esc(status)}, progress = ${progress} WHERE id = ${esc(id)}`
  );
}

export function removeFromDownloadQueue(id: string): void {
  runSQL(`DELETE FROM download_queue WHERE id = ${esc(id)}`);
}

export function closeDatabase(): void {
  // sqlite3 CLI persists every write immediately — nothing to flush
}
