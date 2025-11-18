"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

export interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

/**
 * Production-ready Animated Button with hover effects
 *
 * @example
 * ```tsx
 * <AnimatedButton
 *   variant="primary"
 *   icon={<ArrowRight />}
 *   onClick={handleClick}
 * >
 *   Continue
 * </AnimatedButton>
 * ```
 */
export function AnimatedButton({
  children,
  variant = "default",
  size = "md",
  loading = false,
  icon,
  iconPosition = "right",
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: AnimatedButtonProps) {
  const variantClasses = {
    default: "bg-gray-200 text-gray-900 hover:bg-gray-900 hover:text-white",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-sm gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2.5",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`
        group inline-flex items-center justify-center rounded-full font-medium
        transition-all duration-300 ease-in-out
        ${variantClasses[variant]} ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${isDisabled ? "opacity-50 cursor-not-allowed" : "active:scale-95"}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {/* Left Icon */}
      {!loading && icon && iconPosition === "left" && (
        <span className="transition-transform duration-300 group-hover:translate-x-0.5">
          {icon}
        </span>
      )}

      {/* Loading Spinner */}
      {loading && (
        <Loader2 className="animate-spin" size={size === "sm" ? 14 : size === "lg" ? 18 : 16} />
      )}

      {/* Text */}
      <span>{children}</span>

      {/* Right Icon */}
      {!loading && icon && iconPosition === "right" && (
        <span className="transition-transform duration-300 group-hover:translate-x-0.5">
          {icon}
        </span>
      )}
    </button>
  );
}

/**
 * Expand Button - Button with animated arrow expansion effect
 */
export interface ExpandButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  size?: "sm" | "md" | "lg";
}

export function ExpandButton({
  label,
  size = "md",
  className = "",
  ...props
}: ExpandButtonProps) {
  const sizeClasses = {
    sm: "h-8 pl-2 pr-3 text-sm",
    md: "h-10 pl-3 pr-4 text-sm",
    lg: "h-12 pl-4 pr-5 text-base",
  };

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <button
      className={`
        group flex items-center gap-2 rounded-full bg-gray-200
        transition-all duration-300 ease-in-out
        hover:bg-black hover:text-white hover:pl-2
        active:bg-gray-700
        ${sizeClasses[size]} ${className}
      `}
      {...props}
    >
      <span className="rounded-full bg-black p-1 text-sm transition-colors duration-300 group-hover:bg-white">
        <ArrowRight
          size={iconSize[size]}
          className="-translate-x-[200%] text-[0px] transition-all duration-300 group-hover:translate-x-0 group-hover:text-black group-active:-rotate-45"
          style={{ fontSize: 0 }}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}
