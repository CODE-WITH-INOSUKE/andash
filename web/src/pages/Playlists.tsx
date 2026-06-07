import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Playlist, getPlaylists, createPlaylist } from '@/utils/api';
import { HiMusicNote, HiPlus, HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Playlists() {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    getPlaylists()
      .then(setPlaylists)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const pl = await createPlaylist(newName.trim());
      setPlaylists((p) => [pl, ...p]);
      setNewName('');
      setShowCreate(false);
      toast.success('Playlist created');
    } catch {
      toast.error('Failed to create playlist');
    }
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Playlists</h1>
          <p className="text-sm text-accent-secondary">{playlists.length} playlists</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <HiPlus size={18} />
          Create
        </button>
      </motion.div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Playlist name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
                <button onClick={handleCreate} className="btn-primary">Create</button>
                <button onClick={() => { setShowCreate(false); setNewName(''); }} className="btn-icon"><HiX size={18} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-square skeleton rounded-2xl mb-3" />
              <div className="h-4 skeleton w-3/4 mb-2" />
              <div className="h-3 skeleton w-1/2" />
            </div>
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-16">
          <HiMusicNote size={48} className="mx-auto text-accent-dim mb-4" />
          <p className="text-accent-secondary">No playlists yet</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">Create your first playlist</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {playlists.map((pl) => (
            <motion.div
              key={pl.id}
              className="card card-hover p-4 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/playlists/${pl.id}`)}
            >
              <div className="aspect-square rounded-xl bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center mb-3 overflow-hidden">
                {pl.thumbnail ? (
                  <img src={pl.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <HiMusicNote size={36} className="text-accent-dim" />
                )}
              </div>
              <p className="text-sm font-medium truncate">{pl.name}</p>
              <p className="text-xs text-accent-secondary">{pl.trackCount} tracks</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
