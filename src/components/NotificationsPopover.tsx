import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  Bell,
  ChevronRight
} from 'lucide-react';
import type { Alert } from '../hooks/useAlerts';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
}

const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ isOpen, onClose, alerts }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'expiry': return Calendar;
      case 'payment': return CreditCard;
      default: return Bell;
    }
  };

  const getColorClasses = (color: Alert['color']) => {
    switch (color) {
      case 'red': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'orange': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default: return 'text-brand bg-brand/10 border-brand/20';
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] bg-bg-card border border-border-card rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="p-4 border-b border-border-card flex items-center justify-between bg-bg-sidebar/50">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-brand" />
          <h3 className="text-sm font-bold text-white">Notificaciones</h3>
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          {alerts.length} Alertas
        </span>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Bell size={24} className="text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">No tienes alertas pendientes</p>
          </div>
        ) : (
          <div className="divide-y divide-border-card">
            {alerts.map((alert) => {
              const Icon = getIcon(alert.type);
              const colorClasses = getColorClasses(alert.color);

              return (
                <Link
                  key={alert.id}
                  to={alert.link}
                  onClick={onClose}
                  className="flex items-start gap-4 p-4 hover:bg-white/5 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${colorClasses}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold ${alert.color === 'red' ? 'text-red-500' : 'text-orange-500'}`}>
                      {alert.title}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {alert.description}
                    </p>
                    {alert.daysRemaining !== undefined && (
                      <span className={`inline-block mt-2 px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-bold border border-white/10 text-gray-400`}>
                        en {alert.daysRemaining} días
                      </span>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all mt-1" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {alerts.length > 0 && (
        <div className="p-3 border-t border-border-card bg-bg-sidebar/30 text-center">
          <button
            onClick={onClose}
            className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPopover;
