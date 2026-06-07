import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getArtists } from '@/utils/api';
import { HiUserGroup } from 'react-icons/hi';

interface Artist {
  artist: string;
  albumCount: number;
  trackCount: number;
}

export default function Artists() {
  const navigate = useNavigate();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArtists()
      .then(setArtists)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold">Artists</h1>
        <p className="text-sm text-accent-secondary">{artists.length} artists</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i}>
              <div className="aspect-square skeleton rounded-full mb-3" />
              <div className="h-4 skeleton w-2/3 mx-auto mb-2" />
              <div className="h-3 skeleton w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : artists.length === 0 ? (
        <div className="text-center py-16">
          <HiUserGroup size={48} className="mx-auto text-accent-dim mb-4" />
          <p className="text-accent-secondary">No artists in library</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {artists.map((artist, i) => (
            <motion.div
              key={artist.artist}
              className="card card-hover p-4 cursor-pointer text-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/artists/${encodeURIComponent(artist.artist)}`)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <div className="aspect-square rounded-full bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center mb-3 mx-auto w-32 h-32">
                <span className="text-4xl font-bold text-accent-dim">{getInitial(artist.artist)}</span>
              </div>
              <p className="text-sm font-medium truncate">{artist.artist}</p>
              <p className="text-xs text-accent-secondary">{artist.trackCount} tracks</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
