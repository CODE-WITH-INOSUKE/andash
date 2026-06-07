import { Router, Request, Response } from 'express';
import * as db from '../database.js';
import { searchYoutube, getTrackInfo } from '../services/ytdlp.js';
import { playerService } from '../services/player.js';
import { downloadService } from '../services/downloader.js';
import { Track } from '../types.js';

const router = Router();

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.json({ tracks: [], artists: [], albums: [], playlists: [] });
    }

    const dbResults = db.searchTracks(query);
    const ytResults = await searchYoutube(query);

    const existingIds = new Set(dbResults.map((t) => t.id));
    const newTracks = ytResults
      .filter((y) => !existingIds.has(y.id))
      .map((y) => ({
        id: y.id,
        title: y.title,
        artist: y.artist,
        album: y.album,
        duration: y.duration,
        url: y.url,
        thumbnail: y.thumbnail,
        downloaded: false,
      }));

    const allTracks = [...dbResults, ...newTracks].slice(0, 50);
    const artists = [...new Set(allTracks.map((t) => t.artist))].slice(0, 10);
    const albums = [...new Set(allTracks.map((t) => t.album))].slice(0, 10);
    const playlists = db.getPlaylists().filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );

    res.json({ tracks: allTracks, artists, albums, playlists });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/tracks', (req: Request, res: Response) => {
  try {
    const { album, artist } = req.query;
    if (album) {
      return res.json(db.getTracksByAlbum(album as string));
    }
    if (artist) {
      return res.json(db.getTracksByArtist(artist as string));
    }
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tracks' });
  }
});

router.get('/tracks/:id', (req: Request, res: Response) => {
  try {
    const track = db.getTrack(req.params.id);
    if (!track) return res.status(404).json({ error: 'Track not found' });
    res.json(track);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get track' });
  }
});

router.post('/tracks/:id/favorite', (req: Request, res: Response) => {
  try {
    const favorite = db.toggleFavorite(req.params.id);
    res.json({ favorite });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

router.get('/albums', (_req: Request, res: Response) => {
  try {
    res.json(db.getAlbums());
  } catch (error) {
    res.status(500).json({ error: 'Failed to get albums' });
  }
});

router.get('/artists', (_req: Request, res: Response) => {
  try {
    res.json(db.getArtists());
  } catch (error) {
    res.status(500).json({ error: 'Failed to get artists' });
  }
});

router.get('/recent', (_req: Request, res: Response) => {
  try {
    res.json(db.getRecentPlayed());
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recent' });
  }
});

router.get('/most-played', (_req: Request, res: Response) => {
  try {
    res.json(db.getMostPlayed());
  } catch (error) {
    res.status(500).json({ error: 'Failed to get most played' });
  }
});

router.get('/favorites', (_req: Request, res: Response) => {
  try {
    res.json(db.getFavorites());
  } catch (error) {
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

router.get('/downloads', (_req: Request, res: Response) => {
  try {
    res.json(db.getDownloads());
  } catch (error) {
    res.status(500).json({ error: 'Failed to get downloads' });
  }
});

// Playlist routes
router.get('/playlists', (_req: Request, res: Response) => {
  try {
    res.json(db.getPlaylists());
  } catch (error) {
    res.status(500).json({ error: 'Failed to get playlists' });
  }
});

router.get('/playlists/:id', (req: Request, res: Response) => {
  try {
    const playlist = db.getPlaylist(req.params.id);
    if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get playlist' });
  }
});

router.post('/playlists', (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const playlist = db.createPlaylist(name, description || '');
    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

router.delete('/playlists/:id', (req: Request, res: Response) => {
  try {
    db.deletePlaylist(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

router.post('/playlists/:id/tracks', (req: Request, res: Response) => {
  try {
    const { trackId } = req.body;
    if (!trackId) return res.status(400).json({ error: 'trackId required' });
    db.addTrackToPlaylist(req.params.id, trackId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add track' });
  }
});

router.delete('/playlists/:id/tracks/:trackId', (req: Request, res: Response) => {
  try {
    db.removeTrackFromPlaylist(req.params.id, req.params.trackId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove track' });
  }
});

router.put('/playlists/:id/tracks/reorder', (req: Request, res: Response) => {
  try {
    const { trackIds } = req.body;
    if (!trackIds) return res.status(400).json({ error: 'trackIds required' });
    db.reorderPlaylistTracks(req.params.id, trackIds);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder' });
  }
});

// Download routes
router.post('/download', async (req: Request, res: Response) => {
  try {
    const { trackId, track } = req.body;
    if (!track) return res.status(400).json({ error: 'Track data required' });

    const newTrack: Track = {
      id: track.id || trackId,
      title: track.title,
      artist: track.artist || 'Unknown',
      album: track.album || 'Unknown',
      duration: track.duration || 0,
      url: track.url,
      thumbnail: track.thumbnail || '',
      downloaded: false,
    };
    db.saveTrack(newTrack);
    await downloadService.addTrack(newTrack, newTrack.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to start download' });
  }
});

router.post('/download/playlist', async (req: Request, res: Response) => {
  try {
    const { tracks } = req.body;
    if (!tracks || !tracks.length) {
      return res.status(400).json({ error: 'Tracks required' });
    }

    for (const trackData of tracks) {
      const newTrack: Track = {
        id: trackData.id,
        title: trackData.title,
        artist: trackData.artist || 'Unknown',
        album: trackData.album || 'Unknown',
        duration: trackData.duration || 0,
        url: trackData.url,
        thumbnail: trackData.thumbnail || '',
        downloaded: false,
      };
      db.saveTrack(newTrack);
      await downloadService.addTrack(newTrack, newTrack.id);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start playlist download' });
  }
});

router.get('/download/queue', (_req: Request, res: Response) => {
  res.json(downloadService.getQueue());
});

router.delete('/download/:id', (req: Request, res: Response) => {
  downloadService.cancelJob(req.params.id);
  res.json({ success: true });
});

router.post('/download/:id/pause', (req: Request, res: Response) => {
  downloadService.pauseJob(req.params.id);
  res.json({ success: true });
});

router.post('/download/:id/resume', (req: Request, res: Response) => {
  downloadService.resumeJob(req.params.id);
  res.json({ success: true });
});

// Player routes
router.get('/player', (_req: Request, res: Response) => {
  res.json(playerService.getState());
});

router.post('/player/play', (req: Request, res: Response) => {
  try {
    const { track } = req.body;
    if (!track) return res.status(400).json({ error: 'Track required' });

    const newTrack: Track = {
      id: track.id,
      title: track.title,
      artist: track.artist || 'Unknown',
      album: track.album || 'Unknown',
      duration: track.duration || 0,
      url: track.url,
      thumbnail: track.thumbnail || '',
      downloaded: false,
      path: track.path,
    };
    db.saveTrack(newTrack);
    db.recordPlay(newTrack.id);
    playerService.play(newTrack);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to play' });
  }
});

router.post('/player/toggle', (_req: Request, res: Response) => {
  playerService.togglePlay();
  res.json({ success: true });
});

router.post('/player/next', (_req: Request, res: Response) => {
  playerService.playNext();
  res.json({ success: true });
});

router.post('/player/previous', (_req: Request, res: Response) => {
  playerService.playPrevious();
  res.json({ success: true });
});

router.post('/player/seek', (req: Request, res: Response) => {
  const { position } = req.body;
  playerService.seek(position || 0);
  res.json({ success: true });
});

router.post('/player/volume', (req: Request, res: Response) => {
  const { volume } = req.body;
  playerService.setVolume(volume ?? 80);
  res.json({ success: true });
});

router.post('/player/mute', (_req: Request, res: Response) => {
  playerService.toggleMute();
  res.json({ success: true });
});

router.post('/player/speed', (req: Request, res: Response) => {
  const { speed } = req.body;
  playerService.setSpeed(speed || 1);
  res.json({ success: true });
});

router.post('/player/repeat', (_req: Request, res: Response) => {
  playerService.toggleRepeat();
  res.json({ success: true });
});

router.post('/player/shuffle', (_req: Request, res: Response) => {
  playerService.toggleShuffle();
  res.json({ success: true });
});

router.get('/player/queue', (_req: Request, res: Response) => {
  const state = playerService.getState();
  res.json({ queue: state.queue, queueHistory: state.queueHistory });
});

router.post('/player/queue/add', (req: Request, res: Response) => {
  try {
    const { track } = req.body;
    if (!track) return res.status(400).json({ error: 'Track required' });
    playerService.addToQueue(track);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to queue' });
  }
});

router.post('/player/queue/remove', (req: Request, res: Response) => {
  const { index } = req.body;
  playerService.removeFromQueue(index ?? 0);
  res.json({ success: true });
});

router.post('/player/queue/clear', (_req: Request, res: Response) => {
  playerService.clearQueue();
  res.json({ success: true });
});

export default router;
