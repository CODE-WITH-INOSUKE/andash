import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Track, getTracksByArtist } from '@/utils/api';
import TrackRow from '@/components/TrackRow';
import { usePlayerStore } from '@/store/playerStore';
import { HiPlay, HiArrowLeft } from 'react-icons/hi';

export default function ArtistDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { setCurrentTrack, setIsPlaying, addToQueue } = usePlayerStore();

  useEffect(() => {
    if (!name) return;
    getTracksByArtist(decodeURIComponent(name))
      .then(setTracks)
      .catch(() => navigate('/artists'))
      .finally(() => setLoading(false));
  }, [name, navigate]);

  const handlePlayAll = () => {
    if (!tracks.length) return;
    setCurrentTrack(tracks[0]);
    setIsPlaying(true);
    tracks.slice(1).forEach((t) => addToQueue(t));
  };

  const artistName = decodeURIComponent(name || '');

  return (
    <div className="page-container">
      <button onClick={() => navigate('/artists')} className="btn-ghost mb-4 flex items-center gap-2">
        <HiArrowLeft size={18} />
        Back to Artists
      </button>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-6 mb-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center shrink-0">
            <span className="text-5xl font-bold text-accent-dim">
              {artistName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-xs text-accent-secondary mb-1">Artist</p>
            <h1 className="text-3xl font-bold mb-2">{artistName}</h1>
            <p className="text-sm text-accent-secondary">{tracks.length} tracks</p>
            {tracks.length > 0 && (
              <button onClick={handlePlayAll} className="btn-primary flex items-center gap-2 mt-3">
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
            <p className="text-accent-secondary">No tracks found for this artist</p>
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
