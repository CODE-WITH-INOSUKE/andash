import { motion } from 'framer-motion';
import { Track } from '@/utils/api';
import { usePlayerStore } from '@/store/playerStore';
import { formatDuration } from '@/utils/formatters';
import { HiPlay, HiPlus, HiHeart, HiMusicNote } from 'react-icons/hi';
import { toggleFavorite } from '@/utils/api';
import toast from 'react-hot-toast';

interface TrackRowProps {
  track: Track;
  index?: number;
  showIndex?: boolean;
  onAddToPlaylist?: (track: Track) => void;
}

export default function TrackRow({ track, index, showIndex, onAddToPlaylist }: TrackRowProps) {
  const { setCurrentTrack, setIsPlaying, addToQueue, currentTrack, isPlaying } = usePlayerStore();
  const isActive = currentTrack?.id === track.id;

  const handlePlay = () => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleFavorite = async () => {
    try {
      const result = await toggleFavorite(track.id);
      toast.success(result ? 'Added to favorites' : 'Removed from favorites');
    } catch {
      toast.error('Failed to toggle favorite');
    }
  };

  return (
    <motion.div
      className={`group flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
        isActive ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
      onClick={handlePlay}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 4 }}
    >
      {showIndex && (
        <span className="w-6 text-center text-xs text-accent-dim tabular-nums">
          {isActive && isPlaying ? (
            <motion.span
              className="flex gap-0.5 justify-center"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span className="w-0.5 h-3 bg-white rounded-full" />
              <span className="w-0.5 h-2 bg-white rounded-full" />
              <span className="w-0.5 h-3 bg-white rounded-full" />
            </motion.span>
          ) : (
            (index ?? 0) + 1
          )}
        </span>
      )}

      {track.thumbnail ? (
        <img
          src={track.thumbnail}
          alt=""
          className="w-10 h-10 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center shrink-0">
          <HiMusicNote size={16} className="text-accent-dim" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isActive ? 'text-white font-medium' : ''}`}>
          {track.title}
        </p>
        <p className="text-xs text-accent-secondary truncate">{track.artist}</p>
      </div>

      <p className="text-xs text-accent-dim tabular-nums hidden sm:block">
        {track.album}
      </p>

      <p className="text-xs text-accent-dim tabular-nums">{formatDuration(track.duration)}</p>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFavorite();
          }}
          className="btn-icon"
        >
          <HiHeart size={16} className={track.favorite ? 'text-red-400' : ''} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToQueue(track);
          }}
          className="btn-icon"
        >
          <HiPlus size={16} />
        </button>
        {onAddToPlaylist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlaylist(track);
            }}
            className="btn-icon"
          >
            <HiPlus size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
