import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell } from 'lucide-react';

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full bg-bg-dark text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border-card flex items-center justify-between px-8 bg-bg-dark/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="text-sm font-medium text-gray-400">
            Dashboard
          </div>
          <div className="flex items-center gap-4">
            <button className="px-3 py-1.5 rounded-lg bg-brand/10 text-brand text-xs font-bold border border-brand/20 hover:bg-brand/20 transition-colors">
              MODO DEMO
            </button>
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-bg-dark">
                3
              </span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
