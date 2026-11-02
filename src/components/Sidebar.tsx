import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCircle,
  FileText,
  Wallet,
  TrendingDown,
  Building2,
  X
} from 'lucide-react';

interface SidebarProps {
  /** Controla la visibilidad del menú en móvil (off-canvas). */
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Inquilinos', icon: UserCircle, path: '/inquilinos' },
    { name: 'Contratos', icon: FileText, path: '/contratos' },
    { name: 'Ingresos', icon: Wallet, path: '/ingresos' },
    { name: 'Gastos', icon: TrendingDown, path: '/gastos' },
  ];

  return (
    <>
      {/* Fondo oscuro en móvil al abrir el menú */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 shrink-0 bg-bg-sidebar border-r border-border-card flex flex-col transform transition-transform duration-300 lg:sticky lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 sm:p-6 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="text-bg-dark" size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">AlquilerJEREZ</h1>
            <p className="text-xs text-brand font-medium truncate">Gestión de alquileres</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 lg:hidden shrink-0"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 my-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive
                  ? 'bg-brand/10 text-brand font-semibold border border-brand/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}
              `}
            >
              <item.icon size={20} className="shrink-0" />
              <span className="truncate">{item.name}</span>
              {item.name === 'Dashboard' && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
