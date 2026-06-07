import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/store/playerStore';
import { useUIStore } from '@/store/uiStore';
import { formatDuration } from '@/utils/formatters';
import {
  HiPlay, HiPause,
  HiVolumeUp, HiVolumeOff, HiMusicNote,
  HiX, HiArrowsExpand,
} from 'react-icons/hi';

export default function DockMode() {
  const {
    currentTrack, isPlaying, volume, muted, position, duration,
    repeat, shuffle,
    togglePlay, toggleMute, setVolume, playNext, playPrevious,
    toggleRepeat, toggleShuffle, setPosition,
  } = usePlayerStore();
  const { setViewMode, fullscreen, toggleFullscreen } = useUIStore();
  const [time, setTime] = useState(new Date());
  const [mouseHidden, setMouseHidden] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleMove = () => {
      setMouseHidden(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setMouseHidden(true), 3000);
    };
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': playPrevious(); break;
        case 'ArrowRight': playNext(); break;
        case 'KeyF': toggleFullscreen(); break;
        case 'Escape': setViewMode('normal'); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlay, playPrevious, playNext, toggleFullscreen, setViewMode]);

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div
      className={`h-screen w-screen bg-amoled flex flex-col ${mouseHidden ? 'cursor-none' : ''}`}
      onDoubleClick={toggleFullscreen}
    >
      <div className={`absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 transition-opacity duration-500 ${mouseHidden ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
            <span className="text-black font-bold text-xs">A</span>
          </div>
          <span className="font-semibold text-sm">Andash</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleFullscreen} className="btn-icon"><HiArrowsExpand size={18} /></button>
          <button onClick={() => setViewMode('normal')} className="btn-icon"><HiX size={18} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
        <div className="text-center">
          <p className="text-5xl font-light tabular-nums mb-2">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-lg text-accent-secondary">
            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {currentTrack ? (
          <motion.div
            className="flex items-center gap-8 lg:gap-16"
            key={currentTrack.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-48 h-48 lg:w-64 lg:h-64 rounded-3xl overflow-hidden bg-elevated shrink-0"
              animate={{ scale: isPlaying ? 1 : 0.97 }}
            >
              {currentTrack.thumbnail ? (
                <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <HiMusicNote size={60} className="text-accent-dim" />
                </div>
              )}
            </motion.div>

            <div className="max-w-md">
              <h1 className="text-3xl lg:text-4xl font-bold truncate">{currentTrack.title}</h1>
              <p className="text-xl text-accent-secondary mt-2">{currentTrack.artist}</p>
              <p className="text-base text-accent-dim mt-1">{currentTrack.album}</p>
            </div>
          </motion.div>
        ) : (
          <div className="text-center">
            <HiMusicNote size={80} className="mx-auto text-accent-dim mb-4" />
            <p className="text-2xl text-accent-secondary">No track playing</p>
          </div>
        )}
      </div>

      <div className="px-8 pb-8 space-y-4">
        <div className="relative h-2 bg-border rounded-full cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setPosition(((e.clientX - rect.left) / rect.width) * duration);
          }}
        >
          <motion.div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} layout />
          <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, marginLeft: '-10px' }} />
        </div>
        <div className="flex justify-between text-sm text-accent-dim tabular-nums">
          <span>{formatDuration(position)}</span>
          <span>{formatDuration(duration)}</span>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button onClick={toggleShuffle} className={`btn-icon ${shuffle ? 'text-white' : 'text-accent-dim'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          </button>
          <button onClick={playPrevious} className="btn-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
          </button>
          <motion.button
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? <HiPause size={34} className="text-black" /> : <HiPlay size={34} className="text-black ml-1" />}
          </motion.button>
          <button onClick={playNext} className="btn-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          </button>
          <button onClick={toggleRepeat} className={`btn-icon ${repeat !== 'none' ? 'text-white' : 'text-accent-dim'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button onClick={toggleMute} className="btn-icon">
            {muted || volume === 0 ? <HiVolumeOff size={22} /> : <HiVolumeUp size={22} />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-48"
          />
        </div>
      </div>

      <div className={`absolute bottom-4 left-0 right-0 text-center transition-opacity duration-500 ${mouseHidden ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-2xs text-accent-dim">Double-click to toggle fullscreen · ESC to exit dock mode</p>
      </div>
    </div>
  );
}
