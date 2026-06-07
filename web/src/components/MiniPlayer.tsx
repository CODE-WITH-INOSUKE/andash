import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/store/playerStore';
import { useUIStore } from '@/store/uiStore';
import { formatDuration } from '@/utils/formatters';
import {
  HiPlay,
  HiPause,
  HiVolumeUp,
  HiVolumeOff,
  HiMusicNote,
} from 'react-icons/hi';

export default function MiniPlayer() {
  const navigate = useNavigate();
  const {
    currentTrack,
    isPlaying,
    volume,
    muted,
    position,
    duration,
    repeat,
    shuffle,
    togglePlay,
    toggleMute,
    setVolume,
    playNext,
    playPrevious,
    toggleRepeat,
    toggleShuffle,
  } = usePlayerStore();
  const { setNowPlayingOpen } = useUIStore();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      className="h-mini-player border-t border-border bg-amoled/95 backdrop-blur-2xl flex items-center px-4 gap-4 shrink-0 z-20"
    >
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate('/now-playing')}
      >
        {currentTrack.thumbnail ? (
          <motion.img
            src={currentTrack.thumbnail}
            alt=""
            className="w-12 h-12 rounded-xl object-cover shrink-0"
            animate={{ scale: isPlaying ? 1 : 0.95 }}
            transition={{ duration: 0.2 }}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-elevated flex items-center justify-center shrink-0">
            <HiMusicNote size={22} className="text-accent-dim" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate max-w-[200px] lg:max-w-[300px]">
            {currentTrack.title}
          </p>
          <p className="text-xs text-accent-secondary truncate max-w-[200px] lg:max-w-[300px]">
            {currentTrack.artist}
          </p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-1">
        <button onClick={toggleShuffle} className={`btn-icon ${shuffle ? 'text-white' : 'text-accent-dim'}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
        </button>
        <button onClick={playPrevious} className="btn-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
        </button>
        <motion.button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          {isPlaying ? <HiPause size={20} className="text-black" /> : <HiPlay size={20} className="text-black ml-0.5" />}
        </motion.button>
        <button onClick={playNext} className="btn-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
        </button>
        <button onClick={toggleRepeat} className={`btn-icon ${repeat !== 'none' ? 'text-white' : 'text-accent-dim'}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          {repeat === 'one' && <span className="text-[8px] absolute">1</span>}
        </button>
      </div>

      <div className="hidden lg:flex items-center gap-3 min-w-[180px]">
        <button onClick={toggleMute} className="btn-icon">
          {muted || volume === 0 ? <HiVolumeOff size={18} /> : <HiVolumeUp size={18} />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={muted ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-24"
        />
      </div>

      <div className="hidden lg:flex items-center gap-2 text-xs text-accent-secondary tabular-nums">
        <span>{formatDuration(position)}</span>
        <div className="w-24 h-1 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white rounded-full"
            style={{ width: `${progress}%` }}
            layout
          />
        </div>
        <span>{formatDuration(duration)}</span>
      </div>
    </motion.div>
  );
}
