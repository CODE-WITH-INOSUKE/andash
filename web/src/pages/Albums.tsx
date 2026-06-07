import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAlbums } from '@/utils/api';
import { HiCollection, HiMusicNote } from 'react-icons/hi';

interface Album {
  album: string;
  artist: string;
  thumbnail: string;
  trackCount: number;
}

export default function Albums() {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlbums()
      .then(setAlbums)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold">Albums</h1>
        <p className="text-sm text-accent-secondary">{albums.length} albums</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i}>
              <div className="aspect-square skeleton rounded-2xl mb-3" />
              <div className="h-4 skeleton w-3/4 mb-2" />
              <div className="h-3 skeleton w-1/2" />
            </div>
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-16">
          <HiCollection size={48} className="mx-auto text-accent-dim mb-4" />
          <p className="text-accent-secondary">No albums in library</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {albums.map((album, i) => (
            <motion.div
              key={album.album + album.artist}
              className="card card-hover p-4 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/albums/${encodeURIComponent(album.album)}`)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <div className="aspect-square rounded-xl bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center mb-3 overflow-hidden">
                {album.thumbnail ? (
                  <img src={album.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <HiMusicNote size={36} className="text-accent-dim" />
                )}
              </div>
              <p className="text-sm font-medium truncate">{album.album}</p>
              <p className="text-xs text-accent-secondary truncate">{album.artist}</p>
              <p className="text-2xs text-accent-dim mt-1">{album.trackCount} tracks</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
