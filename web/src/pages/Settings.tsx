import { useState } from 'react';
import { motion } from 'framer-motion';
import { useUIStore, Theme, VisualizerType } from '@/store/uiStore';
import { usePlayerStore } from '@/store/playerStore';
import {
  HiCog, HiSun, HiMoon, HiColorSwatch,
  HiMusicNote, HiDownload, HiLibrary, HiGlobe,
  HiInformationCircle,
} from 'react-icons/hi';

const sections = [
  { id: 'appearance', label: 'Appearance', icon: HiColorSwatch },
  { id: 'playback', label: 'Playback', icon: HiMusicNote },
  { id: 'downloads', label: 'Downloads', icon: HiDownload },
  { id: 'library', label: 'Library', icon: HiLibrary },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: HiMusicNote },
  { id: 'about', label: 'About', icon: HiInformationCircle },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('appearance');
  const { theme, setTheme, visualizerType, setVisualizerType, viewMode, setViewMode } = useUIStore();
  const { crossfade, setCrossfade, normalized, setNormalized, speed, setSpeed } = usePlayerStore();

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HiCog size={24} />
          Settings
        </h1>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        <nav className="lg:w-48 shrink-0 flex lg:flex-col gap-1 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all duration-200 ${
                activeSection === sec.id
                  ? 'bg-white text-black font-medium'
                  : 'text-accent-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <sec.icon size={16} />
              {sec.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 max-w-2xl">
          {activeSection === 'appearance' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card p-5">
                <h3 className="font-semibold mb-3">Theme</h3>
                <div className="flex gap-3">
                  {[
                    { key: 'amoled', label: 'AMOLED Black', icon: HiMoon },
                    { key: 'dark', label: 'Dark Gray', icon: HiSun },
                    { key: 'system', label: 'System', icon: HiGlobe },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTheme(t.key as Theme)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                        theme === t.key
                          ? 'border-white bg-white/10 text-white'
                          : 'border-border text-accent-secondary hover:border-accent-dim/40'
                      }`}
                    >
                      <t.icon size={16} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold mb-3">View Mode</h3>
                <div className="flex gap-3">
                  {[
                    { key: 'normal', label: 'Normal' },
                    { key: 'dock', label: 'Dock Mode' },
                    { key: 'ambient', label: 'Ambient Mode' },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setViewMode(m.key as 'normal' | 'dock' | 'ambient')}
                      className={`px-4 py-2.5 rounded-xl border text-sm transition-all ${
                        viewMode === m.key
                          ? 'border-white bg-white/10 text-white'
                          : 'border-border text-accent-secondary hover:border-accent-dim/40'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-semibold mb-3">Visualizer</h3>
                <div className="flex flex-wrap gap-2">
                  {['none', 'spectrum', 'waveform', 'circular', 'bars'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setVisualizerType(v as VisualizerType)}
                      className={`chip ${visualizerType === v ? 'chip-active' : ''}`}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'playback' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="card p-5">
                <h3 className="font-semibold mb-4">Playback Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center justify-between text-sm mb-2">
                      <span>Crossfade</span>
                      <span className="text-accent-dim">{crossfade}s</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={12}
                      step={1}
                      value={crossfade}
                      onChange={(e) => setCrossfade(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm mb-2">
                      <span>Playback Speed</span>
                      <span className="text-accent-dim">{speed}x</span>
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={2}
                      step={0.05}
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <label className="flex items-center justify-between text-sm">
                    <span>Audio Normalization</span>
                    <button
                      onClick={() => setNormalized(!normalized)}
                      className={`w-10 h-6 rounded-full transition-colors ${
                        normalized ? 'bg-white' : 'bg-border'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-black transition-transform ${
                        normalized ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'downloads' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
              <h3 className="font-semibold mb-4">Download Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm mb-2 block">Download Quality</label>
                  <select className="input">
                    <option>Best available</option>
                    <option>High (320kbps)</option>
                    <option>Medium (192kbps)</option>
                    <option>Low (128kbps)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm mb-2 block">Format</label>
                  <select className="input">
                    <option>M4A (AAC)</option>
                    <option>MP3</option>
                    <option>FLAC</option>
                    <option>OPUS</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center justify-between text-sm mb-2">
                    <span>Concurrent Downloads</span>
                    <span className="text-accent-dim">3</span>
                  </label>
                  <input type="range" min={1} max={5} defaultValue={3} className="w-full" />
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'library' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
              <h3 className="font-semibold mb-4">Library Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm mb-2 block">Music Folders</label>
                  <div className="input text-accent-dim mb-2">/storage/music</div>
                  <button className="btn-ghost text-sm">Add Folder</button>
                </div>
                <button className="btn-primary text-sm">Refresh Library</button>
              </div>
            </motion.div>
          )}

          {activeSection === 'shortcuts' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
              <h3 className="font-semibold mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-3">
                {[
                  { key: 'Space', desc: 'Play / Pause' },
                  { key: '←', desc: 'Previous track' },
                  { key: '→', desc: 'Next track' },
                  { key: '↑', desc: 'Volume up' },
                  { key: '↓', desc: 'Volume down' },
                  { key: 'M', desc: 'Mute / Unmute' },
                  { key: 'S', desc: 'Shuffle toggle' },
                  { key: 'R', desc: 'Repeat toggle' },
                  { key: 'F', desc: 'Fullscreen toggle' },
                  { key: 'D', desc: 'Dock mode' },
                  { key: 'A', desc: 'Ambient mode' },
                  { key: 'Escape', desc: 'Exit dock/ambient mode' },
                ].map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between py-2">
                    <span className="text-sm text-accent-secondary">{shortcut.desc}</span>
                    <kbd className="px-3 py-1 rounded-lg bg-elevated border border-border text-xs font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'about' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-black">A</span>
                </div>
                <h3 className="text-xl font-bold">Andash</h3>
                <p className="text-accent-secondary">v1.0.0</p>
                <p className="text-sm text-accent-dim mt-2 max-w-sm mx-auto">
                  A premium Hi-Fi music player and streaming dashboard.
                  Built with React, Node.js, yt-dlp, and mpv.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
