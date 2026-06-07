import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { usePlayerStore } from '@/store/playerStore';
import { classNames } from '@/utils/formatters';
import {
  HiHome,
  HiSearch,
  HiLibrary,
  HiDownload,
  HiMusicNote,
  HiUserGroup,
  HiCollection,
  HiChip,
  HiCog,
  HiX,
  HiMenu,
  HiPlay,
} from 'react-icons/hi';

const navItems = [
  { path: '/', icon: HiHome, label: 'Home' },
  { path: '/search', icon: HiSearch, label: 'Search' },
  { path: '/library', icon: HiLibrary, label: 'Library' },
  { path: '/downloads', icon: HiDownload, label: 'Downloads' },
  { path: '/playlists', icon: HiMusicNote, label: 'Playlists' },
  { path: '/artists', icon: HiUserGroup, label: 'Artists' },
  { path: '/albums', icon: HiCollection, label: 'Albums' },
];

export default function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, setViewMode } = useUIStore();
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 btn-icon lg:hidden"
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <HiX size={22} /> : <HiMenu size={22} />}
      </button>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={classNames(
              'fixed lg:relative z-40 h-full w-sidebar',
              'bg-amoled border-r border-border flex flex-col',
              'shrink-0'
            )}
          >
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                  <span className="text-black font-bold text-sm">A</span>
                </div>
                <span className="text-lg font-bold tracking-tight">Andash</span>
              </div>
              <p className="text-2xs text-accent-secondary ml-11">Hi-Fi Music Player</p>
            </div>

            <nav className="flex-1 px-3 py-2 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                      isActive
                        ? 'bg-white text-black font-medium'
                        : 'text-accent-secondary hover:text-white hover:bg-white/5'
                    )
                  }
                >
                  <item.icon size={20} />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="px-3 py-2">
              <button
                onClick={() => setViewMode('dock')}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-accent-secondary hover:text-white hover:bg-white/5 transition-all duration-200 text-sm"
              >
                <HiChip size={20} />
                <span>Dock Mode</span>
              </button>
            </div>

            <div className="px-3 pb-4">
              <NavLink
                to="/settings"
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={({ isActive }) =>
                  classNames(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm',
                    isActive
                      ? 'bg-white text-black font-medium'
                      : 'text-accent-secondary hover:text-white hover:bg-white/5'
                  )
                }
              >
                <HiCog size={20} />
                <span>Settings</span>
              </NavLink>
            </div>

            {currentTrack && (
              <div className="mx-3 mb-3 p-3 rounded-xl bg-elevated border border-border">
                <div className="flex items-center gap-3">
                  {currentTrack.thumbnail ? (
                    <img
                      src={currentTrack.thumbnail}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center">
                      <HiMusicNote size={18} className="text-accent-dim" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{currentTrack.title}</p>
                    <p className="text-2xs text-accent-secondary truncate">{currentTrack.artist}</p>
                  </div>
                  <NavLink
                    to="/now-playing"
                    className="btn-icon"
                  >
                    <HiPlay size={18} />
                  </NavLink>
                </div>
              </div>
            )}

            <div className="px-6 py-3 border-t border-border">
              <p className="text-2xs text-accent-dim">v1.0.0</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
