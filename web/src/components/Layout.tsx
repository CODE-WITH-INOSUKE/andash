import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MiniPlayer from './MiniPlayer';

export default function Layout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-amoled">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
        <MiniPlayer />
      </main>
    </div>
  );
}
