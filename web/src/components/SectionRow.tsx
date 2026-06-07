import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Track } from '@/utils/api';
import TrackCard from './TrackCard';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

interface SectionRowProps {
  title: string;
  tracks: Track[];
  isLoading?: boolean;
}

export default function SectionRow({ title, tracks, isLoading }: SectionRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="section-title px-6">{title}</h2>
        <div className="flex gap-4 px-6 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48">
              <div className="aspect-square skeleton rounded-2xl mb-3" />
              <div className="h-4 skeleton w-3/4 mb-2" />
              <div className="h-3 skeleton w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (tracks.length === 0) return null;

  return (
    <section className="mb-8 relative group">
      <div className="flex items-center justify-between px-6 mb-4">
        <h2 className="section-title">{title}</h2>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => scroll('left')} className="btn-icon">
            <HiChevronLeft size={20} />
          </button>
          <button onClick={() => scroll('right')} className="btn-icon">
            <HiChevronRight size={20} />
          </button>
        </div>
      </div>
      <motion.div
        ref={scrollRef}
        className="flex gap-4 px-6 overflow-x-auto no-scrollbar pb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {tracks.map((track, index) => (
          <motion.div
            key={track.id}
            className="flex-shrink-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
          >
            <TrackCard track={track} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
