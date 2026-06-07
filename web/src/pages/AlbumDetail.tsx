import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Track, getTracksByAlbum, getAlbums } from '@/utils/api';
import TrackRow from '@/components/TrackRow';
import { usePlayerStore } from '@/store/playerStore';
import { formatDuration } from '@/utils/formatters';
import { HiPlay, HiMusicNote, HiArrowLeft } from 'react-icons/hi';

export default function AlbumDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { setCurrentTrack, setIsPlaying, addToQueue } = usePlayerStore();

  useEffect(() => {
    if (!name) return;
    getTracksByAlbum(decodeURIComponent(name))
      .then(setTracks)
      .catch(() => navigate('/albums'))
      .finally(() => setLoading(false));
  }, [name, navigate]);

  const handlePlayAll = () => {
    if (!tracks.length) return;
    setCurrentTrack(tracks[0]);
    setIsPlaying(true);
    tracks.slice(1).forEach((t) => addToQueue(t));
  };

  const albumName = decodeURIComponent(name || '');
  const artist = tracks[0]?.artist || 'Unknown';
  const thumbnail = tracks[0]?.thumbnail || '';
  const totalDuration = tracks.reduce((s, t) => s + t.duration, 0);

  return (
    <div className="page-container">
      <button onClick={() => navigate('/albums')} className="btn-ghost mb-4 flex items-center gap-2">
        <HiArrowLeft size={18} />
        Back to Albums
      </button>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <motion.div
            className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center overflow-hidden shrink-0"
            whileHover={{ scale: 1.02 }}
          >
            {thumbnail ? (
              <img src={thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <HiMusicNote size={56} className="text-accent-dim" />
            )}
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-accent-secondary mb-2">Album</p>
            <h1 className="text-3xl font-bold mb-2 truncate">{albumName}</h1>
            <p className="text-base text-accent-secondary mb-3">{artist}</p>
            <div className="flex items-center gap-3 text-sm text-accent-secondary mb-4">
              <span>{tracks.length} tracks</span>
              <span>{formatDuration(totalDuration)}</span>
            </div>
            {tracks.length > 0 && (
              <button onClick={handlePlayAll} className="btn-primary flex items-center gap-2">
                <HiPlay size={18} />
                Play All
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-accent-secondary">No tracks found for this album</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tracks.map((track, i) => (
              <TrackRow key={track.id} track={track} index={i} showIndex />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
