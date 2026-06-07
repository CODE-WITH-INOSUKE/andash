import { motion } from 'framer-motion';
import { Track } from '@/utils/api';
import { usePlayerStore } from '@/store/playerStore';
import { formatDuration } from '@/utils/formatters';
import { HiPlay, HiMusicNote } from 'react-icons/hi';

interface TrackCardProps {
  track: Track;
  isQueue?: boolean;
  onRemove?: () => void;
}

export default function TrackCard({ track, isQueue, onRemove }: TrackCardProps) {
  const { setCurrentTrack, setIsPlaying, addToQueue } = usePlayerStore();

  const handlePlay = () => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleAddToQueue = () => {
    addToQueue(track);
  };

  return (
    <motion.div
      className="group cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handlePlay}
    >
      <div className="relative aspect-square w-44 md:w-48 rounded-2xl overflow-hidden bg-elevated mb-3">
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HiMusicNote size={40} className="text-accent-dim" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            whileHover={{ scale: 1.1 }}
          >
            <HiPlay size={22} className="text-black ml-0.5" />
          </motion.div>
        </div>
        {track.downloaded && (
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500 shadow-lg" />
        )}
      </div>
      <p className="text-sm font-medium truncate max-w-44 md:max-w-48">{track.title}</p>
      <p className="text-xs text-accent-secondary truncate max-w-44 md:max-w-48">{track.artist}</p>
      <p className="text-2xs text-accent-dim mt-1">{formatDuration(track.duration)}</p>
    </motion.div>
  );
}
