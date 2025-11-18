"use client";

import { motion, MotionProps } from "framer-motion";
import { ReactNode, ButtonHTMLAttributes, useState } from "react";
import { Loader2 } from "lucide-react";
import { springs, tapScale } from "../utils/animations";

export interface PremiumButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  glow?: boolean;
  ripple?: boolean;
}

/**
 * Premium Button with advanced animations and micro-interactions
 * Features:
 * - Spring physics for natural motion
 * - Ripple effect on click
 * - Glow effect on hover
 * - Smooth loading transitions
 * - Haptic-like feedback
 *
 * @example
 * ```tsx
 * <PremiumButton
 *   variant="primary"
 *   glow
 *   ripple
 *   icon={<ArrowRight />}
 *   onClick={handleAction}
 * >
 *   Get Started
 * </PremiumButton>
 * ```
 */
export function PremiumButton({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "right",
  fullWidth = false,
  glow = false,
  ripple = true,
  className = "",
  disabled,
  onClick,
  ...props
}: PremiumButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [isPressed, setIsPressed] = useState(false);

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50",
    secondary: "bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300 shadow-md",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
    danger:
      "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50",
    success:
      "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50",
  };

  const sizeStyles = {
    sm: "h-9 px-4 text-sm gap-2",
    md: "h-11 px-6 text-base gap-2.5",
    lg: "h-13 px-8 text-lg gap-3",
  };

  const glowStyles =
    glow && !disabled
      ? {
          boxShadow: "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
        }
      : {};

  const isDisabled = disabled || loading;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled || !onClick) return;

    // Create ripple effect
    if (ripple) {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }

    onClick(e);
  };

  return (
    <motion.button
      className={`
        group relative inline-flex items-center justify-center rounded-xl font-semibold
        transition-all duration-200 overflow-hidden
        ${variantStyles[variant]} ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      style={glowStyles}
      disabled={isDisabled}
      onClick={handleClick}
      whileHover={!isDisabled ? { scale: 1.02, y: -1 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      transition={springs.snappy}
      onTapStart={() => setIsPressed(true)}
      onTap={() => setIsPressed(false)}
      onTapCancel={() => setIsPressed(false)}
      {...props}
    >
      {/* Background gradient animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
        initial={{ x: "-100%" }}
        animate={{ x: isPressed ? "100%" : "-100%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white rounded-full"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            opacity: 0.5,
          }}
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}

      {/* Left Icon */}
      {!loading && icon && iconPosition === "left" && (
        <motion.span
          className="relative z-10"
          initial={false}
          animate={{ x: 0 }}
          whileHover={{ x: -2 }}
          transition={springs.snappy}
        >
          {icon}
        </motion.span>
      )}

      {/* Loading Spinner */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.bouncy}
        >
          <Loader2 className="animate-spin" size={size === "sm" ? 16 : size === "lg" ? 20 : 18} />
        </motion.div>
      )}

      {/* Text */}
      <span className="relative z-10 whitespace-nowrap">{children}</span>

      {/* Right Icon */}
      {!loading && icon && iconPosition === "right" && (
        <motion.span
          className="relative z-10"
          initial={false}
          animate={{ x: 0 }}
          whileHover={{ x: 2 }}
          transition={springs.snappy}
        >
          {icon}
        </motion.span>
      )}
    </motion.button>
  );
}

/**
 * Floating Action Button - Monday.com style
 */
export interface FABProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "style" | "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"> {
  icon: ReactNode;
  label?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  extended?: boolean;
}

export function FAB({ icon, label, position = "bottom-right", extended = false, onClick, ...props }: FABProps) {
  const positionStyles = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  return (
    <motion.button
      className={`
        fixed ${positionStyles[position]} z-50
        ${extended ? "px-6 gap-3" : "w-14"}
        h-14 rounded-full
        bg-gradient-to-r from-blue-600 to-blue-700 text-white
        shadow-2xl shadow-blue-500/40
        flex items-center justify-center font-semibold
        overflow-hidden
      `}
      onClick={onClick}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)",
      }}
      whileTap={{ scale: 0.95 }}
      transition={springs.snappy}
      initial={false}
      animate={{ width: extended && label ? "auto" : 56 }}
      {...props}
    >
      <motion.span
        className="text-xl"
        animate={{ rotate: extended ? 0 : 360 }}
        transition={{ duration: 0.3 }}
      >
        {icon}
      </motion.span>
      {extended && label && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.span>
      )}
    </motion.button>
  );
}
