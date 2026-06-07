import { EventEmitter } from 'events';
import { Track, DownloadJob } from '../types.js';
import { downloadAudio, downloadPlaylist, getDownloadPath } from './ytdlp.js';
import * as db from '../database.js';
import fs from 'fs';

class DownloadService extends EventEmitter {
  private queue: DownloadJob[] = [];
  private activeCount = 0;
  private maxConcurrent = 3;
  private paused = false;

  getQueue(): DownloadJob[] {
    return [...this.queue];
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  async addTrack(track: Track, trackId: string): Promise<void> {
    const existing = this.queue.find((j) => j.trackId === trackId);
    if (existing) return;

    const job: DownloadJob = {
      id: crypto.randomUUID(),
      trackId,
      track,
      progress: 0,
      speed: '',
      status: 'queued',
    };

    this.queue.push(job);
    db.addToDownloadQueue(job.id, trackId);
    this.emit('queue-update', this.getQueue());
    this.processNext();
  }

  async addPlaylist(tracks: Track[], playlistId: string): Promise<void> {
    for (const track of tracks) {
      await this.addTrack(track, track.id);
    }
  }

  private async processNext(): Promise<void> {
    if (this.paused) return;
    if (this.activeCount >= this.maxConcurrent) return;

    const nextJob = this.queue.find((j) => j.status === 'queued');
    if (!nextJob) return;

    this.activeCount++;
    await this.download(nextJob);
    this.activeCount--;
    this.processNext();
  }

  private async download(job: DownloadJob): Promise<void> {
    job.status = 'downloading';
    db.updateDownloadStatus(job.id, 'downloading', 0);
    this.emit('queue-update', this.getQueue());

    try {
      const format = 'm4a';
      const outputPath = await downloadAudio(
        job.track.url,
        job.trackId,
        format,
        (percent, speed) => {
          job.progress = percent;
          job.speed = speed;
          db.updateDownloadStatus(job.id, 'downloading', percent);
          this.emit('progress', { id: job.id, progress: percent, speed });
          this.emit('queue-update', this.getQueue());
        }
      );

      job.status = 'completed';
      job.progress = 100;
      db.updateDownloadStatus(job.id, 'completed', 100);

      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        db.saveTrack({
          ...job.track,
          path: outputPath,
          downloaded: true,
          fileSize: stats.size,
          format,
        });
      }

      this.emit('completed', job);
      this.emit('queue-update', this.getQueue());
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      db.updateDownloadStatus(job.id, 'failed', job.progress);
      this.emit('failed', job);
      this.emit('queue-update', this.getQueue());
    }
  }

  pauseJob(id: string): void {
    const job = this.queue.find((j) => j.id === id);
    if (job && job.status === 'downloading') {
      job.status = 'paused';
      db.updateDownloadStatus(id, 'paused', job.progress);
      this.emit('queue-update', this.getQueue());
    }
  }

  resumeJob(id: string): void {
    const job = this.queue.find((j) => j.id === id);
    if (job && job.status === 'paused') {
      job.status = 'queued';
      db.updateDownloadStatus(id, 'queued', job.progress);
      this.emit('queue-update', this.getQueue());
      this.processNext();
    }
  }

  cancelJob(id: string): void {
    const job = this.queue.find((j) => j.id === id);
    if (job) {
      job.status = 'failed';
      db.removeFromDownloadQueue(id);
      this.queue = this.queue.filter((j) => j.id !== id);
      this.emit('queue-update', this.getQueue());
    }
  }

  pauseAll(): void {
    this.paused = true;
    for (const job of this.queue) {
      if (job.status === 'downloading') {
        job.status = 'paused';
        db.updateDownloadStatus(job.id, 'paused', job.progress);
      }
    }
    this.emit('queue-update', this.getQueue());
  }

  resumeAll(): void {
    this.paused = false;
    for (const job of this.queue) {
      if (job.status === 'paused') {
        job.status = 'queued';
        db.updateDownloadStatus(job.id, 'queued', job.progress);
      }
    }
    this.emit('queue-update', this.getQueue());
    this.processNext();
  }

  setMaxConcurrent(count: number): void {
    this.maxConcurrent = Math.max(1, Math.min(10, count));
  }
}

export const downloadService = new DownloadService();
