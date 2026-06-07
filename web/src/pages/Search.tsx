import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { searchMusic, Track, SearchResult } from '@/utils/api';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import TrackRow from '@/components/TrackRow';
import { HiSearch, HiX, HiClock, HiTrendingUp } from 'react-icons/hi';

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const { searchHistory, addToSearchHistory, clearSearchHistory } = useLibraryStore();
  const { setCurrentTrack, setIsPlaying } = usePlayerStore();

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const data = await searchMusic(q);
      setResults(data);
      addToSearchHistory(q);
    } catch {
      setResults(null);
    }
    setIsSearching(false);
  }, [addToSearchHistory]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handlePlay = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold mb-4">Search</h1>
        <div className="relative">
          <HiSearch size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-dim" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search songs, artists, albums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input pl-12 pr-10 text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 btn-icon"
            >
              <HiX size={18} />
            </button>
          )}
        </div>
      </motion.div>

      {!query && searchHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="section-title !mb-0 flex items-center gap-2">
              <HiClock size={18} className="text-accent-dim" />
              Recent Searches
            </h2>
            <button onClick={clearSearchHistory} className="text-xs text-accent-dim hover:text-white transition-colors">
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((h) => (
              <motion.button
                key={h}
                className="chip"
                onClick={() => setQuery(h)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {h}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {isSearching && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="w-10 h-10 skeleton rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 skeleton w-3/4 mb-2" />
                  <div className="h-3 skeleton w-1/2" />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {results && !isSearching && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {results.artists.length > 0 && (
              <section className="mb-8">
                <h2 className="section-title flex items-center gap-2">
                  <HiTrendingUp size={18} />
                  Artists
                </h2>
                <div className="flex flex-wrap gap-2">
                  {results.artists.map((artist) => (
                    <motion.button
                      key={artist}
                      className="chip"
                      onClick={() => navigate(`/artists/${encodeURIComponent(artist)}`)}
                      whileHover={{ scale: 1.05 }}
                    >
                      {artist}
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {results.albums.length > 0 && (
              <section className="mb-8">
                <h2 className="section-title">Albums</h2>
                <div className="flex flex-wrap gap-2">
                  {results.albums.map((album) => (
                    <motion.button
                      key={album}
                      className="chip"
                      onClick={() => navigate(`/albums/${encodeURIComponent(album)}`)}
                      whileHover={{ scale: 1.05 }}
                    >
                      {album}
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {results.tracks.length > 0 && (
              <section>
                <h2 className="section-title">Songs</h2>
                <div className="space-y-1">
                  {results.tracks.map((track, i) => (
                    <TrackRow key={track.id} track={track} index={i} showIndex />
                  ))}
                </div>
              </section>
            )}

            {results.tracks.length === 0 && results.artists.length === 0 && results.albums.length === 0 && (
              <div className="text-center py-16">
                <HiSearch size={48} className="mx-auto text-accent-dim mb-4" />
                <p className="text-accent-secondary">No results found for "{query}"</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
