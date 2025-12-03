"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect?: (item: DropdownItem) => void;
  position?: "left" | "right" | "center";
  className?: string;
  menuClassName?: string;
}

/**
 * Production-ready Dropdown component with animations
 *
 * @example
 * ```tsx
 * <Dropdown
 *   trigger={<button>Actions</button>}
 *   items={[
 *     { label: "Edit", value: "edit", icon: <EditIcon /> },
 *     { label: "Delete", value: "delete", icon: <DeleteIcon /> },
 *   ]}
 *   onSelect={(item) => console.log(item.value)}
 * />
 * ```
 */
export function Dropdown({
  trigger,
  items,
  onSelect,
  position = "left",
  className = "",
  menuClassName = "",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const positionClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  function handleItemClick(item: DropdownItem) {
    if (item.disabled) return;

    item.onClick?.();
    onSelect?.(item);
    setIsOpen(false);
  }

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <div onClick={() => { setIsOpen(!isOpen); }}>{trigger}</div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full mt-2 ${positionClasses[position]} z-50 min-w-[200px] ${menuClassName}`}
          >
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1 overflow-hidden">
              {items.map((item, index) => (
                <motion.button
                  key={`${item.value}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => { handleItemClick(item); }}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                    ${
                      item.disabled
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                    }
                  `}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Simple Dropdown Button - Common use case wrapper
 */
export interface DropdownButtonProps {
  label: string;
  items: DropdownItem[];
  onSelect?: (item: DropdownItem) => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DropdownButton({
  label,
  items,
  onSelect,
  variant = "secondary",
  size = "md",
  className = "",
}: DropdownButtonProps) {
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const trigger = (
    <button
      className={`
        flex items-center gap-2 rounded-lg font-medium transition-colors
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}
      `}
    >
      {label}
      <ChevronDown size={16} />
    </button>
  );

  return <Dropdown trigger={trigger} items={items} onSelect={onSelect} />;
}
