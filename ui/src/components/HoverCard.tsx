"use client";

import { ReactNode } from "react";

export interface HoverCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  gradient?: string;
  iconClassName?: string;
}

/**
 * Production-ready Hover Card with gradient animation
 *
 * @example
 * ```tsx
 * <HoverCard
 *   title="Account Settings"
 *   subtitle="Manage your profile"
 *   icon={<UserIcon />}
 *   href="/settings/account"
 *   gradient="from-blue-600 to-purple-600"
 * />
 * ```
 */
export function HoverCard({
  title,
  subtitle,
  icon,
  href,
  onClick,
  className = "",
  gradient = "from-violet-600 to-indigo-600",
  iconClassName = "",
}: HoverCardProps) {
  const Component = href ? "a" : "button";
  const props = href ? { href } : { onClick, type: "button" as const };

  return (
    <Component
      {...props}
      className={`
        w-full p-6 rounded-xl border border-gray-200 relative overflow-hidden group bg-white
        transition-all duration-300 hover:shadow-lg hover:scale-105
        ${className}
      `}
    >
      {/* Gradient Background */}
      <div
        className={`
          absolute inset-0 bg-gradient-to-r ${gradient}
          translate-y-[100%] group-hover:translate-y-[0%]
          transition-transform duration-300
        `}
      />

      {/* Decorative Large Icon */}
      {icon && (
        <div
          className={`
            absolute z-10 -top-12 -right-12 text-9xl text-gray-100
            transition-all duration-300
            group-hover:text-white/20 group-hover:rotate-12
            ${iconClassName}
          `}
        >
          {icon}
        </div>
      )}

      {/* Icon */}
      {icon && (
        <div className="mb-3 text-3xl text-violet-600 group-hover:text-white transition-colors relative z-10 duration-300">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="font-semibold text-lg text-gray-900 group-hover:text-white relative z-10 duration-300 mb-1">
        {title}
      </h3>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-gray-500 group-hover:text-white/90 relative z-10 duration-300">
          {subtitle}
        </p>
      )}
    </Component>
  );
}

/**
 * HoverCard Grid - Layout helper for multiple cards
 */
export interface HoverCardGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function HoverCardGrid({
  children,
  columns = 4,
  className = "",
}: HoverCardGridProps) {
  const columnClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid gap-4 ${columnClasses[columns]} ${className}`}>
      {children}
    </div>
  );
}
