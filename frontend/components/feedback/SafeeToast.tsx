"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";
import { useEffect, useState } from "react";
import { useDirection } from "@/lib/hooks/useDirection";
import { twMerge } from "tailwind-merge";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastNotification {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // milliseconds
}

interface SafeeToastProps {
  notifications: ToastNotification[];
  onRemove: (id: string) => void;
}

export const SafeeToastContainer = ({ notifications, onRemove }: SafeeToastProps) => {
  const dir = useDirection();
  const isRTL = dir === "rtl";

  return (
    <div
      className={twMerge("fixed z-50 flex flex-col gap-2", isRTL ? "bottom-4 left-4" : "bottom-4 right-4")}
    >
      <AnimatePresence>
        {notifications.map((notif) => (
          <Toast key={notif.id} {...notif} onRemove={onRemove} isRTL={isRTL} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const Toast = ({
  id,
  type,
  message,
  duration = 5000,
  onRemove,
  isRTL,
}: ToastNotification & { onRemove: (id: string) => void; isRTL: boolean }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const config = getToastConfig(type);

  return (
    <motion.div
      layout
      initial={{
        x: isRTL ? -300 : 300,
        opacity: 0,
        scale: 0.9,
      }}
      animate={{
        x: 0,
        opacity: 1,
        scale: 1,
      }}
      exit={{
        x: isRTL ? -300 : 300,
        opacity: 0,
        scale: 0.9,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={twMerge(
        "relative flex items-start gap-3 rounded-lg p-4 w-80 shadow-xl border",
        config.bgColor,
        config.borderColor,
        config.textColor,
      )}
    >
      <div className={twMerge("flex-shrink-0 mt-0.5", config.iconColor)}>{config.icon}</div>

      <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>

      <button
        onClick={() => onRemove(id)}
        className={twMerge("flex-shrink-0 rounded p-1 transition-colors", config.closeButtonHover)}
      >
        <FiX className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: "linear" }}
        className={twMerge(
          "absolute bottom-0 h-1 rounded-bl-lg",
          isRTL ? "right-0 origin-right rounded-br-lg" : "left-0 origin-left rounded-bl-lg",
          config.progressColor,
        )}
        style={{ width: "100%" }}
      />
    </motion.div>
  );
};

function getToastConfig(type: ToastType) {
  switch (type) {
    case "success":
      return {
        icon: <FiCheckCircle className="w-5 h-5" />,
        bgColor: "bg-green-50 dark:bg-green-950",
        borderColor: "border-green-200 dark:border-green-800",
        textColor: "text-green-800 dark:text-green-200",
        iconColor: "text-green-600 dark:text-green-400",
        progressColor: "bg-green-500",
        closeButtonHover: "hover:bg-green-100 dark:hover:bg-green-900",
      };
    case "error":
      return {
        icon: <FiAlertCircle className="w-5 h-5" />,
        bgColor: "bg-red-50 dark:bg-red-950",
        borderColor: "border-red-200 dark:border-red-800",
        textColor: "text-red-800 dark:text-red-200",
        iconColor: "text-red-600 dark:text-red-400",
        progressColor: "bg-red-500",
        closeButtonHover: "hover:bg-red-100 dark:hover:bg-red-900",
      };
    case "warning":
      return {
        icon: <FiAlertCircle className="w-5 h-5" />,
        bgColor: "bg-yellow-50 dark:bg-yellow-950",
        borderColor: "border-yellow-200 dark:border-yellow-800",
        textColor: "text-yellow-800 dark:text-yellow-200",
        iconColor: "text-yellow-600 dark:text-yellow-400",
        progressColor: "bg-yellow-500",
        closeButtonHover: "hover:bg-yellow-100 dark:hover:bg-yellow-900",
      };
    case "info":
    default:
      return {
        icon: <FiInfo className="w-5 h-5" />,
        bgColor: "bg-blue-50 dark:bg-blue-950",
        borderColor: "border-blue-200 dark:border-blue-800",
        textColor: "text-blue-800 dark:text-blue-200",
        iconColor: "text-blue-600 dark:text-blue-400",
        progressColor: "bg-blue-500",
        closeButtonHover: "hover:bg-blue-100 dark:hover:bg-blue-900",
      };
  }
}

// Hook for easier toast management
export function useToast() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addToast = (message: string, type: ToastType = "info", duration?: number) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications((prev) => [...prev, { id, type, message, duration }]);
  };

  const removeToast = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notifications,
    addToast,
    removeToast,
    success: (message: string, duration?: number) => addToast(message, "success", duration),
    error: (message: string, duration?: number) => addToast(message, "error", duration),
    warning: (message: string, duration?: number) => addToast(message, "warning", duration),
    info: (message: string, duration?: number) => addToast(message, "info", duration),
  };
}

export default SafeeToastContainer;
