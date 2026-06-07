import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, DownloadJob, getDownloads, getDownloadQueue, cancelDownload, pauseDownload, resumeDownload } from '@/utils/api';
import TrackRow from '@/components/TrackRow';
import { HiDownload, HiX, HiPause, HiPlay, HiTrash } from 'react-icons/hi';

export default function Downloads() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [queue, setQueue] = useState<DownloadJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [dls, q] = await Promise.all([getDownloads(), getDownloadQueue()]);
        setTracks(dls);
        setQueue(q);
      } catch {
        setTracks([]);
        setQueue([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await cancelDownload(id);
      setQueue((q) => q.filter((j) => j.id !== id));
    } catch {}
  };

  const handlePause = async (id: string) => {
    try {
      await pauseDownload(id);
      setQueue((q) => q.map((j) => (j.id === id ? { ...j, status: 'paused' } : j)));
    } catch {}
  };

  const handleResume = async (id: string) => {
    try {
      await resumeDownload(id);
      setQueue((q) => q.map((j) => (j.id === id ? { ...j, status: 'downloading' } : j)));
    } catch {}
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Downloads</h1>
            <p className="text-sm text-accent-secondary">{tracks.length} downloaded tracks</p>
          </div>
          {queue.length > 0 && (
            <button onClick={() => setShowQueue(!showQueue)} className="chip relative">
              Queue ({queue.length})
              {queue.filter((j) => j.status === 'downloading').length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500" />
              )}
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showQueue && queue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="card p-4 space-y-3">
              <h3 className="text-sm font-medium">Download Queue</h3>
              {queue.map((job) => (
                <div key={job.id} className="flex items-center gap-3">
                  {job.track.thumbnail ? (
                    <img src={job.track.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-elevated" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{job.track.title}</p>
                    <div className="flex items-center gap-2 text-xs text-accent-dim">
                      <span className={`${job.status === 'downloading' ? 'text-blue-400' : job.status === 'completed' ? 'text-green-400' : job.status === 'failed' ? 'text-red-400' : ''}`}>
                        {job.status}
                      </span>
                      {job.speed && <span>{job.speed}</span>}
                    </div>
                    {job.status === 'downloading' && (
                      <div className="w-full h-1 bg-border rounded-full mt-1 overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${job.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {job.status === 'downloading' && (
                      <button onClick={() => handlePause(job.id)} className="btn-icon"><HiPause size={14} /></button>
                    )}
                    {job.status === 'paused' && (
                      <button onClick={() => handleResume(job.id)} className="btn-icon"><HiPlay size={14} /></button>
                    )}
                    <button onClick={() => handleCancel(job.id)} className="btn-icon"><HiTrash size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="w-10 h-10 skeleton rounded-lg" />
              <div className="flex-1"><div className="h-4 skeleton w-3/4 mb-2" /><div className="h-3 skeleton w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-16">
          <HiDownload size={48} className="mx-auto text-accent-dim mb-4" />
          <p className="text-accent-secondary">No downloads yet</p>
          <p className="text-xs text-accent-dim mt-2">Download tracks to listen offline</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tracks.map((track, i) => (
            <TrackRow key={track.id} track={track} index={i} showIndex />
          ))}
        </div>
      )}
    </div>
  );
}
