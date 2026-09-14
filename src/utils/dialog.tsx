import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  HelpCircle, 
  X 
} from 'lucide-react';

export type DialogType = 'success' | 'warning' | 'error' | 'info' | 'question';

export interface DialogOptions {
  title?: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  isDestructive?: boolean;
}

export type ConfirmOptionsInput = string | {
  message: string;
  title?: string;
  type?: DialogType;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
};

export interface ToastOptions {
  message: string;
  type?: DialogType;
  duration?: number;
}

interface DialogContextValue {
  showDialog: (options: DialogOptions) => Promise<boolean>;
  showToast: (options: ToastOptions | string, type?: DialogType) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

// Global bridge so functions outside React components can trigger dialogs/toasts
let globalShowDialog: ((options: DialogOptions) => Promise<boolean>) | null = null;
let globalShowToast: ((options: ToastOptions | string, type?: DialogType) => void) | null = null;

export const dialogAlert = async (message: string, title?: string, type: DialogType = 'info'): Promise<void> => {
  if (globalShowDialog) {
    await globalShowDialog({ message, title, type, showCancel: false, confirmText: 'Mengerti' });
  } else {
    console.log(`[Alert] ${title ? title + ': ' : ''}${message}`);
  }
};

export const dialogConfirm = async (
  optionsOrMessage: ConfirmOptionsInput, 
  title: string = 'Konfirmasi Tindakan', 
  type: DialogType = 'question',
  confirmText: string = 'Ya, Lanjutkan',
  cancelText: string = 'Batal'
): Promise<boolean> => {
  if (globalShowDialog) {
    if (typeof optionsOrMessage === 'object' && optionsOrMessage !== null) {
      const opts = optionsOrMessage;
      return await globalShowDialog({
        message: opts.message,
        title: opts.title || title,
        type: opts.type || (opts.isDestructive ? 'warning' : type),
        showCancel: true,
        confirmText: opts.confirmLabel || opts.confirmText || confirmText,
        cancelText: opts.cancelLabel || opts.cancelText || cancelText,
        isDestructive: opts.isDestructive
      });
    } else {
      return await globalShowDialog({ 
        message: String(optionsOrMessage), 
        title, 
        type, 
        showCancel: true, 
        confirmText, 
        cancelText 
      });
    }
  }
  return true;
};

export const showToast = (message: string, type: DialogType = 'success') => {
  if (globalShowToast) {
    globalShowToast(message, type);
  } else {
    console.log(`[Toast ${type}] ${message}`);
  }
};

interface ToastItem {
  id: string;
  message: string;
  type: DialogType;
}

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: DialogOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showDialog = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options,
        resolve
      });
    });
  }, []);

  const handleCloseDialog = (result: boolean) => {
    if (dialogState) {
      dialogState.resolve(result);
      setDialogState(null);
    }
  };

  const showToastFunc = useCallback((options: ToastOptions | string, type: DialogType = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const message = typeof options === 'string' ? options : options.message;
    const toastType = typeof options === 'string' ? type : options.type || 'info';
    const duration = typeof options === 'object' && options.duration ? options.duration : 3500;

    setToasts((prev) => [...prev, { id, message, type: toastType }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  globalShowDialog = showDialog;
  globalShowToast = showToastFunc;

  const renderIcon = (type: DialogType = 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-10 h-10 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-10 h-10 text-amber-500" />;
      case 'error':
        return <XCircle className="w-10 h-10 text-rose-500" />;
      case 'question':
        return <HelpCircle className="w-10 h-10 text-blue-500" />;
      default:
        return <Info className="w-10 h-10 text-sky-500" />;
    }
  };

  return (
    <DialogContext.Provider value={{ showDialog, showToast: showToastFunc }}>
      {children}

      {/* Modern Custom Dialog Modal */}
      {dialogState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7 relative transition-all">
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-0.5 p-2 rounded-xl bg-slate-50 border border-slate-100 shadow-xs">
                {renderIcon(dialogState.options.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {dialogState.options.title || 'Pemberitahuan'}
                </h3>
                <div className="mt-2 text-sm text-slate-600 leading-relaxed break-words whitespace-pre-line">
                  {dialogState.options.message}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              {dialogState.options.showCancel && (
                <button
                  type="button"
                  onClick={() => handleCloseDialog(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-all"
                >
                  {dialogState.options.cancelLabel || dialogState.options.cancelText || 'Batal'}
                </button>
              )}
              <button
                type="button"
                autoFocus
                onClick={() => handleCloseDialog(true)}
                className={`px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-md transition-all active:scale-[0.98] ${
                  dialogState.options.isDestructive || dialogState.options.type === 'error'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : dialogState.options.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                {dialogState.options.confirmLabel || dialogState.options.confirmText || 'Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toasts Notification at Top Right */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-lg border text-xs sm:text-sm font-medium backdrop-blur-md transition-all animate-in slide-in-from-top-3 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                : toast.type === 'error'
                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                : toast.type === 'warning'
                ? 'bg-amber-50/95 border-amber-200 text-amber-900'
                : 'bg-slate-900/90 border-slate-800 text-white'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              {toast.type === 'error' && <XCircle className="w-4 h-4 text-rose-600" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
            </div>
            <div className="flex-1 leading-snug">{toast.message}</div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    return {
      showDialog: (opts: DialogOptions) => dialogAlert(opts.message, opts.title, opts.type).then(() => true),
      showToast
    };
  }
  return ctx;
};
