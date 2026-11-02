import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Menu } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import NotificationsPopover from './NotificationsPopover';

const Layout: React.FC = () => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { alerts } = useAlerts();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    return path.substring(1).charAt(0).toUpperCase() + path.substring(2);
  };

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-bg-dark text-gray-100">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border-card flex items-center justify-between gap-3 px-3 sm:px-6 bg-bg-dark/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 shrink-0"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <div className="text-sm font-medium text-gray-400 truncate">
              {getPageTitle()}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Bell size={20} />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-bg-dark animate-in zoom-in duration-300">
                    {alerts.length}
                  </span>
                )}
              </button>

              <NotificationsPopover
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                alerts={alerts}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="w-full px-3 sm:px-6 py-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
