import { spawn, execSync } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { Track } from '../types.js';

const DOWNLOAD_DIR = path.join(os.homedir(), '.andash', 'downloads');
const CACHE_DIR = path.join(os.homedir(), '.andash', 'cache');

fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
fs.mkdirSync(CACHE_DIR, { recursive: true });

export interface YtDlpSearchResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  thumbnail: string;
  url: string;
}

export async function searchYoutube(query: string, limit = 20): Promise<YtDlpSearchResult[]> {
  return new Promise((resolve, reject) => {
    const results: YtDlpSearchResult[] = [];
    const searchQuery = `ytsearch${limit}:${query}`;

    const proc = spawn('yt-dlp', [
      '--flat-playlist',
      '--dump-json',
      '--no-warnings',
      searchQuery,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000,
    });

    let output = '';

    proc.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0 && !output) {
        reject(new Error('yt-dlp search failed'));
        return;
      }

      const lines = output.trim().split('\n');
      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          const title = item.title || 'Unknown';
          const artist = item.artist || item.uploader || 'Unknown';
          const album = item.album || item.playlist_title || 'Unknown';

          results.push({
            id: item.id,
            title,
            artist,
            album,
            duration: item.duration || 0,
            thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
            url: item.webpage_url || `https://youtube.com/watch?v=${item.id}`,
          });
        } catch {
          // skip parse errors
        }
      }
      resolve(results);
    });

    proc.on('error', reject);
  });
}

export async function getTrackInfo(url: string): Promise<YtDlpSearchResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', [
      '--dump-json',
      '--no-warnings',
      url,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000,
    });

    let output = '';

    proc.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0 || !output) {
        reject(new Error('Failed to get track info'));
        return;
      }

      try {
        const item = JSON.parse(output);
        const title = item.title || 'Unknown';
        const artist = item.artist || item.uploader || 'Unknown';
        const album = item.album || item.playlist_title || 'Unknown';

        resolve({
          id: item.id,
          title,
          artist,
          album,
          duration: item.duration || 0,
          thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
          url: item.webpage_url || url,
        });
      } catch (e) {
        reject(e);
      }
    });

    proc.on('error', reject);
  });
}

export async function downloadAudio(
  url: string,
  trackId: string,
  format: string = 'm4a',
  onProgress?: (percent: number, speed: string) => void
): Promise<string> {
  const outputPath = path.join(DOWNLOAD_DIR, `${trackId}.${format}`);

  return new Promise((resolve, reject) => {
    const args = [
      '-x',
      '--audio-format', format,
      '--audio-quality', '0',
      '--embed-thumbnail',
      '--embed-metadata',
      '--no-warnings',
      '--no-playlist',
      '-o', outputPath,
      url,
    ];

    const proc = spawn('yt-dlp', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 600000,
    });

    let stderr = '';

    proc.stderr.on('data', (data: Buffer) => {
      const line = data.toString();
      stderr += line;

      const progressMatch = line.match(/(\d+\.?\d*)%/);
      const speedMatch = line.match(/at\s+([\d.]+[KM]?i?B\/s)/);
      if (progressMatch || speedMatch) {
        const percent = progressMatch ? parseFloat(progressMatch[1]) : 0;
        const speed = speedMatch ? speedMatch[1] : '';
        onProgress?.(percent, speed);
      }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`Download failed: ${stderr.slice(-200)}`));
      }
    });

    proc.on('error', reject);
  });
}

export async function downloadPlaylist(
  url: string,
  playlistId: string,
  format: string = 'm4a',
  onProgress?: (percent: number, speed: string, current: number, total: number) => void
): Promise<string[]> {
  const playlistDir = path.join(DOWNLOAD_DIR, `playlist_${playlistId}`);
  fs.mkdirSync(playlistDir, { recursive: true });

  const outputTemplate = path.join(playlistDir, `%(title)s.%(ext)s`);

  return new Promise((resolve, reject) => {
    const args = [
      '-x',
      '--audio-format', format,
      '--audio-quality', '0',
      '--embed-thumbnail',
      '--embed-metadata',
      '--no-warnings',
      '--yes-playlist',
      '--ignore-errors',
      '-o', outputTemplate,
      url,
    ];

    const proc = spawn('yt-dlp', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 3600000,
    });

    let stderr = '';

    proc.stderr.on('data', (data: Buffer) => {
      const line = data.toString();
      stderr += line;

      const progressMatch = line.match(/(\d+\.?\d*)%/);
      const speedMatch = line.match(/at\s+([\d.]+[KM]?i?B\/s)/);
      const countMatch = line.match(/\[download\] Downloading item\s+(\d+)\s+of\s+(\d+)/);

      if (countMatch) {
        const current = parseInt(countMatch[1]);
        const total = parseInt(countMatch[2]);
        onProgress?.(
          progressMatch ? parseFloat(progressMatch[1]) : 0,
          speedMatch ? speedMatch[1] : '',
          current,
          total
        );
      } else {
        onProgress?.(
          progressMatch ? parseFloat(progressMatch[1]) : 0,
          speedMatch ? speedMatch[1] : '',
          1,
          1
        );
      }
    });

    proc.on('close', (code) => {
      if (code === 0 || code === 1) {
        try {
          const files = fs.readdirSync(playlistDir)
            .filter((f) => f.endsWith(`.${format}`))
            .map((f) => path.join(playlistDir, f));
          resolve(files);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(`Playlist download failed: ${stderr.slice(-200)}`));
      }
    });

    proc.on('error', reject);
  });
}

export function getStreamUrl(url: string): string {
  try {
    const result = execSync(
      `yt-dlp -f "bestaudio[ext=m4a]/bestaudio" --get-url --no-warnings "${url}"`,
      { timeout: 15000, encoding: 'utf-8' }
    );
    return result.trim().split('\n')[0];
  } catch {
    return url;
  }
}

export function getDownloadPath(trackId: string, format: string = 'm4a'): string {
  return path.join(DOWNLOAD_DIR, `${trackId}.${format}`);
}

export function getDownloadDir(): string {
  return DOWNLOAD_DIR;
}
