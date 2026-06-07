import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Playlist, getPlaylist, deletePlaylist, removeFromPlaylist } from '@/utils/api';
import { usePlayerStore } from '@/store/playerStore';
import TrackRow from '@/components/TrackRow';
import { formatDuration, formatRelativeTime } from '@/utils/formatters';
import { HiMusicNote, HiPlay, HiTrash, HiArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const { setCurrentTrack, setIsPlaying, addToQueue } = usePlayerStore();

  useEffect(() => {
    if (!id) return;
    getPlaylist(id)
      .then(setPlaylist)
      .catch(() => navigate('/playlists'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handlePlayAll = () => {
    if (!playlist?.tracks.length) return;
    setCurrentTrack(playlist.tracks[0]);
    setIsPlaying(true);
    playlist.tracks.slice(1).forEach((t) => addToQueue(t));
  };

  const handleShufflePlay = () => {
    if (!playlist?.tracks.length) return;
    const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
    setCurrentTrack(shuffled[0]);
    setIsPlaying(true);
    shuffled.slice(1).forEach((t) => addToQueue(t));
  };

  const handleDelete = async () => {
    if (!playlist) return;
    try {
      await deletePlaylist(playlist.id);
      toast.success('Playlist deleted');
      navigate('/playlists');
    } catch {
      toast.error('Failed to delete playlist');
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!playlist) return;
    try {
      await removeFromPlaylist(playlist.id, trackId);
      setPlaylist({ ...playlist, tracks: playlist.tracks.filter((t) => t.id !== trackId), trackCount: playlist.trackCount - 1 });
    } catch {
      toast.error('Failed to remove track');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex gap-6 mb-8">
          <div className="w-56 h-56 skeleton rounded-2xl" />
          <div className="flex-1"><div className="h-8 skeleton w-1/3 mb-3" /><div className="h-4 skeleton w-1/4 mb-2" /><div className="h-4 skeleton w-1/5" /></div>
        </div>
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
      </div>
    );
  }

  if (!playlist) return null;

  const totalDuration = playlist.tracks.reduce((s, t) => s + t.duration, 0);

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button onClick={() => navigate('/playlists')} className="btn-ghost mb-4 flex items-center gap-2">
          <HiArrowLeft size={18} />
          Back to Playlists
        </button>

        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <motion.div
            className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center overflow-hidden shrink-0"
            whileHover={{ scale: 1.02 }}
          >
            {playlist.thumbnail ? (
              <img src={playlist.thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <HiMusicNote size={56} className="text-accent-dim" />
            )}
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-accent-secondary mb-2">Playlist</p>
            <h1 className="text-3xl font-bold mb-2 truncate">{playlist.name}</h1>
            {playlist.description && <p className="text-sm text-accent-secondary mb-3">{playlist.description}</p>}
            <div className="flex items-center gap-3 text-sm text-accent-secondary mb-4">
              <span>{playlist.trackCount} tracks</span>
              <span>{formatDuration(totalDuration)}</span>
              <span>Updated {formatRelativeTime(playlist.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePlayAll} className="btn-primary flex items-center gap-2">
                <HiPlay size={18} />
                Play All
              </button>
              <button onClick={handleShufflePlay} className="btn-ghost flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
                Shuffle
              </button>
              <button onClick={handleDelete} className="btn-ghost text-red-400 hover:text-red-300 flex items-center gap-2">
                <HiTrash size={18} />
                Delete
              </button>
            </div>
          </div>
        </div>

        {playlist.tracks.length === 0 ? (
          <div className="text-center py-16">
            <HiMusicNote size={48} className="mx-auto text-accent-dim mb-4" />
            <p className="text-accent-secondary">This playlist is empty</p>
            <p className="text-xs text-accent-dim mt-2">Search for music to add</p>
          </div>
        ) : (
          <div className="space-y-1">
            {playlist.tracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                index={i}
                showIndex
                onAddToPlaylist={() => handleRemoveTrack(track.id)}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
