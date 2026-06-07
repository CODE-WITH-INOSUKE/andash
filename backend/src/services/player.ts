import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { Track, PlayerState, QueueItem } from '../types.js';
import { getStreamUrl } from './ytdlp.js';

class PlayerService extends EventEmitter {
  private mpv: ChildProcess | null = null;
  private state: PlayerState = {
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
  };

  private progressInterval: ReturnType<typeof setInterval> | null = null;
  private ipcSocket: string = '/tmp/andash-mpv.sock';

  constructor() {
    super();
  }

  getState(): PlayerState {
    return { ...this.state };
  }

  async play(track: Track): Promise<void> {
    this.stopMpv();

    try {
      const streamUrl = track.path || getStreamUrl(track.url);
      this.state.currentTrack = track;
      this.state.isPlaying = true;
      this.state.position = 0;
      this.state.duration = track.duration;

      this.launchMpv(streamUrl);
      this.emit('track-change', track);
      this.emit('state-change', this.getState());
      this.startProgressUpdates();
    } catch (error) {
      console.error('Failed to play track:', error);
      this.emit('error', error);
    }
  }

  private launchMpv(url: string): void {
    const args = [
      '--no-video',
      '--vo=null',
      '--no-terminal',
      '--quiet',
      '--no-audio-display',
      `--volume=${this.state.muted ? 0 : this.state.volume}`,
      `--speed=${this.state.speed}`,
      '--audio-file-auto=no',
      '--demuxer-max-bytes=10M',
      '--demuxer-max-back-bytes=2M',
      '--cache=yes',
      '--cache-secs=30',
      '--cache-pause=no',
      url,
    ];

    if (this.state.normalized) {
      args.splice(args.length - 1, 0, '--drc=yes');
    }

    this.mpv = spawn('mpv', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.mpv.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      const timeMatch = output.match(/AV:\s*([\d.]+)/);
      if (timeMatch) {
        this.state.position = parseFloat(timeMatch[1]);
      }
    });

    this.mpv.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();
      const timeMatch = output.match(/AV:\s*([\d.]+)/);
      if (timeMatch) {
        this.state.position = parseFloat(timeMatch[1]);
      }
    });

    this.mpv.on('close', (code) => {
      if (code !== null && code !== 0 && code !== 247) {
        console.error(`mpv exited with code ${code}`);
      }
      if (this.state.isPlaying) {
        this.playNext();
      }
    });

    this.mpv.on('error', (err) => {
      console.error('mpv error:', err);
    });
  }

  private stopMpv(): void {
    if (this.mpv) {
      try {
        this.mpv.kill('SIGTERM');
      } catch {}
      this.mpv = null;
    }
  }

  pause(): void {
    if (this.mpv) {
      try {
        this.mpv.kill('SIGSTOP');
      } catch {}
    }
    this.state.isPlaying = false;
    this.emit('state-change', this.getState());
  }

  resume(): void {
    if (this.mpv) {
      try {
        this.mpv.kill('SIGCONT');
      } catch {}
    }
    this.state.isPlaying = true;
    this.emit('state-change', this.getState());
  }

  togglePlay(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  stop(): void {
    this.stopMpv();
    this.stopProgressUpdates();
    this.state.isPlaying = false;
    this.state.position = 0;
    this.emit('state-change', this.getState());
  }

  seek(position: number): void {
    if (this.mpv && this.mpv.stdin) {
      this.mpv.stdin.write(`seek ${position} absolute\n`);
    }
    this.state.position = position;
  }

  setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(100, volume));
    if (this.mpv && this.mpv.stdin) {
      this.mpv.stdin.write(`volume ${this.state.volume}\n`);
    }
    this.emit('state-change', this.getState());
  }

  setMuted(muted: boolean): void {
    this.state.muted = muted;
    const vol = muted ? 0 : this.state.volume;
    if (this.mpv && this.mpv.stdin) {
      this.mpv.stdin.write(`volume ${vol}\n`);
    }
    this.emit('state-change', this.getState());
  }

  toggleMute(): void {
    this.setMuted(!this.state.muted);
  }

  setSpeed(speed: number): void {
    this.state.speed = Math.max(0.5, Math.min(2, speed));
    if (this.mpv && this.mpv.stdin) {
      this.mpv.stdin.write(`speed ${this.state.speed}\n`);
    }
    this.emit('state-change', this.getState());
  }

  setRepeat(repeat: 'none' | 'one' | 'all'): void {
    this.state.repeat = repeat;
    this.emit('state-change', this.getState());
  }

  toggleRepeat(): void {
    const map: Record<string, 'none' | 'one' | 'all'> = {
      'none': 'all',
      'all': 'one',
      'one': 'none',
    };
    this.state.repeat = map[this.state.repeat];
    this.emit('state-change', this.getState());
  }

  setShuffle(shuffle: boolean): void {
    this.state.shuffle = shuffle;
    this.emit('state-change', this.getState());
  }

  toggleShuffle(): void {
    this.state.shuffle = !this.state.shuffle;
    this.emit('state-change', this.getState());
  }

  playNext(): void {
    const { queue, shuffle, currentTrack, repeat } = this.state;

    if (repeat === 'one' && currentTrack) {
      this.play(currentTrack);
      return;
    }

    if (queue.length === 0) {
      if (repeat === 'all' && currentTrack) {
        this.state.queue = [{ track: currentTrack, addedAt: new Date().toISOString() }];
        this.play(currentTrack);
        return;
      }
      this.stop();
      return;
    }

    let nextIndex = 0;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    }

    const next = queue[nextIndex];
    const newQueue = queue.filter((_, i) => i !== nextIndex);

    this.state.queue = newQueue;
    if (currentTrack) {
      this.state.queueHistory = [
        ...this.state.queueHistory,
        { track: currentTrack, addedAt: new Date().toISOString() },
      ];
    }

    this.play(next.track);
  }

  playPrevious(): void {
    const { queueHistory, currentTrack } = this.state;

    if (queueHistory.length === 0) return;

    const prev = queueHistory[queueHistory.length - 1];
    this.state.queueHistory = queueHistory.slice(0, -1);

    if (currentTrack) {
      this.state.queue = [
        { track: currentTrack, addedAt: new Date().toISOString() },
        ...this.state.queue.slice(0, -1),
      ];
    }

    this.play(prev.track);
  }

  setQueue(queue: QueueItem[]): void {
    this.state.queue = queue;
    this.emit('queue-update', queue);
    this.emit('state-change', this.getState());
  }

  addToQueue(track: Track): void {
    this.state.queue = [
      ...this.state.queue,
      { track, addedAt: new Date().toISOString() },
    ];
    this.emit('queue-update', this.state.queue);
    this.emit('state-change', this.getState());
  }

  removeFromQueue(index: number): void {
    this.state.queue = this.state.queue.filter((_, i) => i !== index);
    this.emit('queue-update', this.state.queue);
    this.emit('state-change', this.getState());
  }

  clearQueue(): void {
    this.state.queue = [];
    this.emit('queue-update', this.state.queue);
    this.emit('state-change', this.getState());
  }

  setCrossfade(seconds: number): void {
    this.state.crossfade = Math.max(0, Math.min(12, seconds));
    this.emit('state-change', this.getState());
  }

  setNormalized(normalized: boolean): void {
    this.state.normalized = normalized;
    if (this.state.currentTrack) {
      this.play(this.state.currentTrack);
    }
    this.emit('state-change', this.getState());
  }

  setEqualizer(bands: number[]): void {
    this.state.equalizer = bands;
    this.emit('state-change', this.getState());
  }

  private startProgressUpdates(): void {
    this.stopProgressUpdates();
    this.progressInterval = setInterval(() => {
      this.emit('progress', {
        position: this.state.position,
        duration: this.state.duration,
      });
    }, 500);
  }

  private stopProgressUpdates(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  destroy(): void {
    this.stop();
    this.removeAllListeners();
  }
}

export const playerService = new PlayerService();
