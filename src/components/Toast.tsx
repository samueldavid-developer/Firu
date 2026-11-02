import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  variant?: 'success' | 'error';
}

const Toast: React.FC<ToastProps> = ({ message, variant = 'success' }) => {
  const esError = variant === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={`flex items-center gap-3 bg-bg-card border rounded-2xl px-5 py-4 shadow-lg ${esError ? 'border-red-500/30' : 'border-green-500/30'
        }`}>
        {esError ? (
          <XCircle size={20} className="text-red-500 shrink-0" />
        ) : (
          <CheckCircle2 size={20} className="text-green-500 shrink-0" />
        )}
        <span className="text-sm font-medium text-white">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
