import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { playerService } from '../services/player.js';
import { downloadService } from '../services/downloader.js';
import { searchYoutube } from '../services/ytdlp.js';
import * as db from '../database.js';

interface WsClient {
  ws: WebSocket;
  id: string;
}

const clients: WsClient[] = [];

export function setupWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    const client: WsClient = {
      ws,
      id: crypto.randomUUID(),
    };
    clients.push(client);

    // Send current state on connect
    ws.send(JSON.stringify({
      type: 'player:state',
      payload: playerService.getState(),
    }));

    ws.on('message', async (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        await handleMessage(client, msg);
      } catch (e) {
        console.error('WS message error:', e);
      }
    });

    ws.on('close', () => {
      const idx = clients.findIndex((c) => c.id === client.id);
      if (idx !== -1) clients.splice(idx, 1);
    });

    ws.on('error', () => {
      const idx = clients.findIndex((c) => c.id === client.id);
      if (idx !== -1) clients.splice(idx, 1);
    });
  });

  // Player event broadcasting
  playerService.on('state-change', (state) => {
    broadcast('player:state', state);
  });

  playerService.on('track-change', (track) => {
    broadcast('player:track-change', { track });
  });

  playerService.on('progress', (data) => {
    broadcast('player:progress', data);
  });

  playerService.on('queue-update', (queue) => {
    broadcast('queue:update', { queue });
  });

  // Download event broadcasting
  downloadService.on('queue-update', (queue) => {
    broadcast('download:progress', { queue });
  });

  downloadService.on('completed', (job) => {
    broadcast('download:completed', { job });
  });

  downloadService.on('failed', (job) => {
    broadcast('download:failed', { job, error: job.error });
  });
}

async function handleMessage(client: WsClient, msg: { type: string; payload?: any }): Promise<void> {
  const { type, payload = {} } = msg;

  switch (type) {
    case 'player:play': {
      if (payload.track) {
        const track = {
          id: payload.track.id,
          title: payload.track.title,
          artist: payload.track.artist || 'Unknown',
          album: payload.track.album || 'Unknown',
          duration: payload.track.duration || 0,
          url: payload.track.url,
          thumbnail: payload.track.thumbnail || '',
          downloaded: false,
          path: payload.track.path,
        };
        db.saveTrack(track as any);
        db.recordPlay(track.id);
        playerService.play(track as any);
      }
      break;
    }
    case 'player:toggle':
      playerService.togglePlay();
      break;
    case 'player:next':
      playerService.playNext();
      break;
    case 'player:previous':
      playerService.playPrevious();
      break;
    case 'player:seek':
      playerService.seek(payload.position || 0);
      break;
    case 'player:volume':
      playerService.setVolume(payload.volume ?? 80);
      break;
    case 'player:mute':
      playerService.toggleMute();
      break;
    case 'player:speed':
      playerService.setSpeed(payload.speed || 1);
      break;
    case 'player:repeat':
      playerService.toggleRepeat();
      break;
    case 'player:shuffle':
      playerService.toggleShuffle();
      break;
    case 'queue:add':
      if (payload.track) playerService.addToQueue(payload.track);
      break;
    case 'queue:remove':
      playerService.removeFromQueue(payload.index ?? 0);
      break;
    case 'queue:clear':
      playerService.clearQueue();
      break;
    case 'search': {
      if (payload.query && payload.query.length >= 2) {
        const results = await searchYoutube(payload.query);
        client.ws.send(JSON.stringify({
          type: 'search:results',
          payload: { results, query: payload.query },
        }));
      }
      break;
    }
    case 'ping':
      client.ws.send(JSON.stringify({ type: 'pong', payload: {} }));
      break;
  }
}

function broadcast(type: string, payload: any): void {
  const msg = JSON.stringify({ type, payload });
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  }
}
