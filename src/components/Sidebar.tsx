import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  UserCircle, 
  FileText, 
  CreditCard, 
  Wrench,
  LogOut,
  Building2
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Propietarios', icon: Users, path: '/propietarios' },
    { name: 'Propiedades', icon: Home, path: '/propiedades' },
    { name: 'Inquilinos', icon: UserCircle, path: '/inquilinos' },
    { name: 'Contratos', icon: FileText, path: '/contratos' },
    { name: 'Pagos', icon: CreditCard, path: '/pagos' },
    { name: 'Servicios', icon: Wrench, path: '/servicios' },
  ];

  return (
    <aside className="w-64 bg-bg-sidebar border-r border-border-card flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center">
          <Building2 className="text-bg-dark" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">InmoARG</h1>
          <p className="text-xs text-brand font-medium">Modo Demo</p>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-brand/10 text-brand font-semibold border border-brand/20 shadow-[0_0_15px_rgba(251,191,36,0.1)]' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'}
            `}
          >
            <item.icon size={20} />
            <span>{item.name}</span>
            {item.name === 'Dashboard' && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand" />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-border-card">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-gray-400 hover:text-white transition-colors rounded-xl hover:bg-white/5">
          <LogOut size={20} />
          <span>Salir del demo</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
