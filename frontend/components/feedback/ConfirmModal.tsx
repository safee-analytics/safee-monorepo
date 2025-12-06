"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FiAlertTriangle, FiAlertCircle, FiInfo } from "react-icons/fi";
import { useState, useCallback } from "react";

export type ConfirmType = "danger" | "warning" | "info";

export interface ConfirmOptions {
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmModalProps {
  isOpen: boolean;
  options: ConfirmOptions | null;
  onClose: () => void;
}

export const ConfirmModal = ({ isOpen, options, onClose }: ConfirmModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!options) return null;

  const {
    title,
    message,
    type = "warning",
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
  } = options;

  const config = getConfirmConfig(type);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
          className="bg-black/50 backdrop-blur-sm fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 cursor-default relative"
          >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}>
              <config.icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>

            {/* Message */}
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{message}</p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`flex-1 px-4 py-2.5 ${config.buttonBg} ${config.buttonHover} text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? "Loading..." : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function getConfirmConfig(type: ConfirmType) {
  switch (type) {
    case "danger":
      return {
        icon: FiAlertTriangle,
        iconBg: "bg-red-100 dark:bg-red-900/30",
        iconColor: "text-red-600 dark:text-red-400",
        buttonBg: "bg-red-600",
        buttonHover: "hover:bg-red-700",
      };
    case "warning":
      return {
        icon: FiAlertCircle,
        iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
        iconColor: "text-yellow-600 dark:text-yellow-400",
        buttonBg: "bg-yellow-600",
        buttonHover: "hover:bg-yellow-700",
      };
    case "info":
    default:
      return {
        icon: FiInfo,
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        buttonBg: "bg-blue-600",
        buttonHover: "hover:bg-blue-700",
      };
  }
}

// Hook for easier confirm modal management
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback(
    (confirmOptions: Omit<ConfirmOptions, "onConfirm"> & { onConfirm?: () => void | Promise<void> }) => {
      return new Promise<boolean>((resolve) => {
        setOptions({
          ...confirmOptions,
          onConfirm: async () => {
            if (confirmOptions.onConfirm) {
              await confirmOptions.onConfirm();
            }
            resolve(true);
          },
          onCancel: () => {
            if (confirmOptions.onCancel) {
              confirmOptions.onCancel();
            }
            resolve(false);
          },
        });
        setIsOpen(true);
      });
    },
    [],
  );

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Clear options after animation completes
    setTimeout(() => setOptions(null), 300);
  }, []);

  return {
    confirm,
    ConfirmModalComponent: () => <ConfirmModal isOpen={isOpen} options={options} onClose={closeModal} />,
  };
}

export default ConfirmModal;
