import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Track, getFavorites, getRecentPlayed, getMostPlayed, getDownloads } from '@/utils/api';
import TrackRow from '@/components/TrackRow';
import { usePlayerStore } from '@/store/playerStore';
import { HiHeart, HiClock, HiTrendingUp, HiDownload, HiMusicNote } from 'react-icons/hi';

type Tab = 'favorites' | 'recent' | 'most-played' | 'downloads';

const tabs: { key: Tab; label: string; icon: typeof HiHeart }[] = [
  { key: 'favorites', label: 'Favorites', icon: HiHeart },
  { key: 'recent', label: 'Recently Played', icon: HiClock },
  { key: 'most-played', label: 'Most Played', icon: HiTrendingUp },
  { key: 'downloads', label: 'Downloads', icon: HiDownload },
];

export default function Library() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('favorites');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const { setCurrentTrack, setIsPlaying } = usePlayerStore();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let data: Track[];
        switch (activeTab) {
          case 'favorites': data = await getFavorites(); break;
          case 'recent': data = await getRecentPlayed(); break;
          case 'most-played': data = await getMostPlayed(); break;
          case 'downloads': data = await getDownloads(); break;
          default: data = [];
        }
        setTracks(data);
      } catch {
        setTracks([]);
      }
      setLoading(false);
    };
    load();
  }, [activeTab]);

  const TabIcon = tabs.find((t) => t.key === activeTab)?.icon || HiMusicNote;

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold mb-4">Library</h1>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={activeTab === tab.key ? 'chip-active flex items-center gap-2' : 'chip flex items-center gap-2'}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4 px-1">
          <TabIcon size={16} className="text-accent-dim" />
          <h2 className="text-lg font-semibold">{tabs.find((t) => t.key === activeTab)?.label}</h2>
          <span className="text-xs text-accent-dim ml-auto">{tracks.length} items</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="w-10 h-10 skeleton rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 skeleton w-3/4 mb-2" />
                  <div className="h-3 skeleton w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-16">
            <TabIcon size={48} className="mx-auto text-accent-dim mb-4" />
            <p className="text-accent-secondary">No tracks found</p>
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
