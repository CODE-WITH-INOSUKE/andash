import { useEffect, useState } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { useUIStore } from '@/store/uiStore';
import { HiMusicNote } from 'react-icons/hi';

export default function AmbientMode() {
  const { currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { setViewMode } = useUIStore();
  const [time, setTime] = useState(new Date());
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handle = () => {
      setShow(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShow(false), 4000);
    };
    window.addEventListener('mousemove', handle);
    window.addEventListener('touchstart', handle);
    handle();
    return () => {
      window.removeEventListener('mousemove', handle);
      window.removeEventListener('touchstart', handle);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'Escape' || e.code === 'KeyA') setViewMode('normal');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [togglePlay, setViewMode]);

  const toggleAmbient = () => {
    setViewMode('normal');
  };

  return (
    <div
      className="h-screen w-screen bg-amoled flex flex-col items-center justify-center select-none"
      onClick={toggleAmbient}
    >
      {currentTrack?.thumbnail && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <img
            src={currentTrack.thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className={`transition-all duration-1000 text-center ${show ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-7xl font-thin tabular-nums mb-4">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>

        {currentTrack ? (
          <div className="space-y-2">
            {currentTrack.thumbnail && (
              <img
                src={currentTrack.thumbnail}
                alt=""
                className="w-32 h-32 rounded-2xl mx-auto mb-4 object-cover opacity-90"
              />
            )}
            <h1 className="text-2xl font-light truncate max-w-[80vw] mx-auto">
              {currentTrack.title}
            </h1>
            <p className="text-lg text-accent-secondary/60 truncate max-w-[80vw] mx-auto">
              {currentTrack.artist}
            </p>
            <div className="flex justify-center gap-1 mt-6">
              {isPlaying && [1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-white/40 rounded-full"
                  style={{
                    height: `${12 + Math.sin(Date.now() / 300 + i) * 10}px`,
                    animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-accent-dim/40">
            <HiMusicNote size={48} className="mx-auto mb-2" />
            <p className="text-lg font-light">No track</p>
          </div>
        )}
      </div>

      <div className={`absolute bottom-8 transition-all duration-1000 ${show ? 'opacity-40' : 'opacity-0'}`}>
        <p className="text-xs text-accent-dim">Tap to exit ambient mode</p>
      </div>
    </div>
  );
}
