import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {/* Toast Stack Portals */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3.5 w-full max-w-xs pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-md flex items-start gap-3 shadow-2xl transition-all duration-300 transform translate-x-0 animate-[slideIn_0.3s_ease-out] relative overflow-hidden ${
              t.type === 'success' 
                ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-300 shadow-emerald-950/10' :
              t.type === 'error'
                ? 'bg-slate-900/90 border-rose-500/30 text-rose-300 shadow-rose-950/10' :
              t.type === 'warning'
                ? 'bg-slate-900/90 border-amber-500/30 text-amber-300 shadow-amber-950/10' :
              'bg-slate-900/90 border-indigo-500/30 text-indigo-300 shadow-indigo-950/10'
            }`}
          >
            {/* Status Icon */}
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="w-4.5 h-4.5 text-rose-400" />}
              {t.type === 'warning' && <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />}
              {t.type === 'info' && <Info className="w-4.5 h-4.5 text-indigo-400" />}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-0.5 pr-2">
              <h4 className="text-xs font-bold text-slate-100 font-sans">{t.title}</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">{t.message}</p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded bg-slate-950/40 hover:bg-slate-950 border border-slate-800 text-slate-450 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Progress Bar Loader */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-850/50">
              <div 
                className={`h-full animate-[progress_linear_forwards] ${
                  t.type === 'success' ? 'bg-emerald-500/40' :
                  t.type === 'error' ? 'bg-rose-500/40' :
                  t.type === 'warning' ? 'bg-amber-500/40' :
                  'bg-indigo-500/40'
                }`}
                style={{ animationDuration: `${t.duration}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
