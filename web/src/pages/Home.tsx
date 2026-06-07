import { useEffect } from 'react';
import { motion } from 'framer-motion';
import SectionRow from '@/components/SectionRow';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { getRecentPlayed, getMostPlayed, getFavorites, getDownloads, getPlaylists } from '@/utils/api';
import { formatDuration } from '@/utils/formatters';
import { HiPlay, HiPause, HiMusicNote, HiClock, HiTrendingUp, HiHeart } from 'react-icons/hi';

export default function Home() {
  const { recentPlayed, mostPlayed, favorites, downloads, playlists, loading, setRecentPlayed, setMostPlayed, setFavorites, setDownloads, setPlaylists, setLoading } = useLibraryStore();
  const { currentTrack, isPlaying, setCurrentTrack, setIsPlaying } = usePlayerStore();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [recent, most, favs, dls, pls] = await Promise.all([
          getRecentPlayed(),
          getMostPlayed(),
          getFavorites(),
          getDownloads(),
          getPlaylists(),
        ]);
        setRecentPlayed(recent);
        setMostPlayed(most);
        setFavorites(favs);
        setDownloads(dls);
        setPlaylists(pls);
      } catch (e) {
        console.error('Failed to load home data', e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-1">{greeting()}</h1>
        <p className="text-accent-secondary">Welcome back to your music</p>
      </motion.div>

      {currentTrack && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mb-8 p-4 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 border border-white/10 cursor-pointer"
          onClick={() => setCurrentTrack(currentTrack)}
        >
          <div className="flex items-center gap-4">
            {currentTrack.thumbnail ? (
              <img
                src={currentTrack.thumbnail}
                alt=""
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-elevated flex items-center justify-center">
                <HiMusicNote size={28} className="text-accent-dim" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-accent-secondary mb-1">Now Playing</p>
              <p className="text-base font-semibold truncate">{currentTrack.title}</p>
              <p className="text-sm text-accent-secondary truncate">{currentTrack.artist}</p>
            </div>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center"
              whileTap={{ scale: 0.9 }}
            >
              {isPlaying ? <HiPause size={22} className="text-black" /> : <HiPlay size={22} className="text-black ml-0.5" />}
            </motion.button>
          </div>
        </motion.div>
      )}

      <SectionRow title="Recently Played" tracks={recentPlayed} isLoading={loading} />
      <SectionRow title="Most Played" tracks={mostPlayed} isLoading={loading} />
      <SectionRow title="Favorites" tracks={favorites} isLoading={loading} />

      {downloads.length > 0 && (
        <SectionRow title="Downloads" tracks={downloads} isLoading={false} />
      )}

      {playlists.length > 0 && (
        <section className="mb-8 px-6">
          <h2 className="section-title">Your Playlists</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {playlists.slice(0, 5).map((pl) => (
              <motion.div
                key={pl.id}
                className="card card-hover p-4 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = `/playlists/${pl.id}`}
              >
                <div className="aspect-square rounded-xl bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center mb-3">
                  <HiMusicNote size={32} className="text-accent-dim" />
                </div>
                <p className="text-sm font-medium truncate">{pl.name}</p>
                <p className="text-xs text-accent-secondary">{pl.trackCount} tracks</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
