import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/store/playerStore';
import { useUIStore } from '@/store/uiStore';
import { formatDuration } from '@/utils/formatters';
import {
  HiPlay, HiPause,
  HiHeart, HiPlus, HiVolumeUp, HiVolumeOff,
  HiMusicNote, HiArrowDown,
} from 'react-icons/hi';

export default function NowPlaying() {
  const navigate = useNavigate();
  const {
    currentTrack, isPlaying, volume, muted, position, duration,
    repeat, shuffle, queue,
    togglePlay, toggleMute, setVolume, playNext, playPrevious,
    toggleRepeat, toggleShuffle, setPosition, addToQueue,
  } = usePlayerStore();
  const { visualizerType } = useUIStore();

  if (!currentTrack) {
    return (
      <div className="page-container flex items-center justify-center h-full">
        <div className="text-center">
          <HiMusicNote size={64} className="mx-auto text-accent-dim mb-4" />
          <p className="text-accent-secondary text-lg">No track playing</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">Browse Music</button>
        </div>
      </div>
    );
  }

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={() => navigate(-1)} className="btn-icon">
          <HiArrowDown size={20} />
        </button>
        <p className="text-xs text-accent-secondary">Now Playing</p>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 pb-8">
        <motion.div
          className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-3xl overflow-hidden bg-elevated shrink-0"
          animate={{ scale: isPlaying ? 1 : 0.98 }}
          transition={{ duration: 0.4 }}
        >
          {currentTrack.thumbnail ? (
            <motion.img
              src={currentTrack.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              animate={{ scale: isPlaying ? 1.05 : 1 }}
              transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <HiMusicNote size={80} className="text-accent-dim" />
            </div>
          )}
        </motion.div>

        <div className="flex flex-col items-center lg:items-start w-full max-w-md">
          <motion.div
            className="text-center lg:text-left mb-6 w-full"
            key={currentTrack.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold truncate max-w-full">
              {currentTrack.title}
            </h1>
            <p className="text-lg text-accent-secondary mt-1">{currentTrack.artist}</p>
            <p className="text-sm text-accent-dim">{currentTrack.album}</p>
          </motion.div>

          <div className="w-full mb-4">
            <div className="relative h-1.5 bg-border rounded-full cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                setPosition(pct * duration);
              }}
            >
              <motion.div
                className="h-full bg-white rounded-full"
                style={{ width: `${progress}%` }}
                layout
              />
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progress}%`, marginLeft: '-8px' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-accent-dim tabular-nums">
              <span>{formatDuration(position)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <button onClick={toggleShuffle} className={`btn-icon ${shuffle ? 'text-white' : 'text-accent-dim'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </button>
            <button onClick={playPrevious} className="btn-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
            </button>
            <motion.button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center"
              whileTap={{ scale: 0.9 }}
            >
              {isPlaying ? <HiPause size={28} className="text-black" /> : <HiPlay size={28} className="text-black ml-1" />}
            </motion.button>
            <button onClick={playNext} className="btn-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
            </button>
            <button onClick={toggleRepeat} className={`btn-icon ${repeat !== 'none' ? 'text-white' : 'text-accent-dim'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              {repeat === 'one' && <span className="absolute text-[8px]">1</span>}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full max-w-xs">
            <button onClick={toggleMute} className="btn-icon">
              {muted || volume === 0 ? <HiVolumeOff size={18} /> : <HiVolumeUp size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {queue.length > 0 && (
        <div className="px-6 pb-4">
          <p className="text-xs text-accent-secondary mb-2">Up Next — {queue.length} tracks</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {queue.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-2 shrink-0 card p-2 pr-3">
                <div className="w-8 h-8 rounded-lg bg-elevated overflow-hidden shrink-0">
                  {item.track.thumbnail ? (
                    <img src={item.track.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <HiMusicNote size={14} className="text-accent-dim" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs truncate max-w-[120px]">{item.track.title}</p>
                  <p className="text-2xs text-accent-dim truncate max-w-[120px]">{item.track.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
