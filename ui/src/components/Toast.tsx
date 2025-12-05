"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { toastPop, springs } from "../utils/animations";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

/**
 * Toast Provider - Wrap your app with this
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "success", title, message });
    },
    [addToast],
  );

  const error = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "error", title, message });
    },
    [addToast],
  );

  const info = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "info", title, message });
    },
    [addToast],
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "warning", title, message });
    },
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

/**
 * Toast Container - Renders toasts
 */
function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 p-6 space-y-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => {
              removeToast(toast.id);
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Individual Toast Item
 */
interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />,
    warning: <AlertTriangle size={20} />,
  };

  const styles = {
    success: {
      bg: "bg-white",
      icon: "text-green-600 bg-green-50",
      border: "border-green-200",
    },
    error: {
      bg: "bg-white",
      icon: "text-red-600 bg-red-50",
      border: "border-red-200",
    },
    info: {
      bg: "bg-white",
      icon: "text-blue-600 bg-blue-50",
      border: "border-blue-200",
    },
    warning: {
      bg: "bg-white",
      icon: "text-amber-600 bg-amber-50",
      border: "border-amber-200",
    },
  };

  const style = styles[toast.type];

  return (
    <motion.div
      className={`
        ${style.bg} ${style.border}
        rounded-xl border-2 shadow-2xl p-4 min-w-[350px] max-w-[450px]
        pointer-events-auto overflow-hidden
      `}
      variants={toastPop}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${style.icon} p-2 rounded-lg`}>{icons[toast.type]}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 mb-1">{toast.title}</h4>
          {toast.message && <p className="text-sm text-gray-600">{toast.message}</p>}
          {toast.action && (
            <motion.button
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              onClick={toast.action.onClick}
              whileHover={{ x: 2 }}
              transition={springs.snappy}
            >
              {toast.action.label} →
            </motion.button>
          )}
        </div>

        {/* Close button */}
        <motion.button
          className="text-gray-400 hover:text-gray-600 p-1"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={springs.snappy}
        >
          <X size={18} />
        </motion.button>
      </div>

      {/* Progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: (toast.duration ?? 5000) / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}

/**
 * Simple toast hook for direct usage
 * @example
 * ```tsx
 * const toast = useToast();
 * toast.success("Saved!", "Your changes have been saved");
 * ```
 */
