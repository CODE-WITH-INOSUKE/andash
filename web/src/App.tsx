import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import Downloads from './pages/Downloads';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import Artists from './pages/Artists';
import ArtistDetail from './pages/ArtistDetail';
import Albums from './pages/Albums';
import AlbumDetail from './pages/AlbumDetail';
import NowPlaying from './pages/NowPlaying';
import DockMode from './pages/DockMode';
import AmbientMode from './pages/AmbientMode';
import Settings from './pages/Settings';
import { useUIStore } from './store/uiStore';
import { wsService } from './utils/websocket';

export default function App() {
  const location = useLocation();
  const viewMode = useUIStore((s) => s.viewMode);

  useEffect(() => {
    wsService.connect();
    return () => wsService.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (viewMode === 'dock') return <DockMode />;
  if (viewMode === 'ambient') return <AmbientMode />;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #222',
            borderRadius: '12px',
          },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="library" element={<Library />} />
            <Route path="downloads" element={<Downloads />} />
            <Route path="playlists" element={<Playlists />} />
            <Route path="playlists/:id" element={<PlaylistDetail />} />
            <Route path="artists" element={<Artists />} />
            <Route path="artists/:name" element={<ArtistDetail />} />
            <Route path="albums" element={<Albums />} />
            <Route path="albums/:name" element={<AlbumDetail />} />
            <Route path="now-playing" element={<NowPlaying />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  );
}
