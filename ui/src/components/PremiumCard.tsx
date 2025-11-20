"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { ReactNode, useRef } from "react";
import { springs } from "../utils/animations";

export interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  tilt?: boolean;
  glow?: boolean;
  shine?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
}

/**
 * Premium Card with 3D tilt and shine effects
 * Inspired by Monday.com's card interactions
 *
 * @example
 * ```tsx
 * <PremiumCard tilt glow shine hoverable>
 *   <h3>Project Dashboard</h3>
 *   <p>View your analytics</p>
 * </PremiumCard>
 * ```
 */
export function PremiumCard({
  children,
  className = "",
  onClick,
  tilt = false,
  glow = false,
  shine = false,
  bordered = true,
  hoverable = true,
}: PremiumCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 3D tilt calculations
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

  // Shine effect position
  const shineX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const shineY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`
        relative rounded-2xl bg-white overflow-hidden
        ${bordered ? "border border-gray-200" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      style={
        tilt
          ? {
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }
          : undefined
      }
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={
        hoverable
          ? {
              y: -4,
              boxShadow: glow
                ? "0 20px 50px rgba(0, 0, 0, 0.15), 0 0 30px rgba(59, 130, 246, 0.3)"
                : "0 20px 50px rgba(0, 0, 0, 0.15)",
            }
          : undefined
      }
      transition={springs.smooth}
    >
      {/* Shine effect */}
      {shine && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)`,
          }}
        />
      )}

      {/* Glow border */}
      {glow && (
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent)",
          }}
          initial={false}
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/**
 * Glassmorphic Card - Modern blur effect
 */
export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg";
  tint?: "light" | "dark" | "blue" | "purple";
}

export function GlassCard({ children, className = "", blur = "md", tint = "light" }: GlassCardProps) {
  const blurStyles = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
  };

  const tintStyles = {
    light: "bg-white/70 border-white/20",
    dark: "bg-gray-900/70 border-white/10 text-white",
    blue: "bg-blue-500/20 border-blue-400/30",
    purple: "bg-purple-500/20 border-purple-400/30",
  };

  return (
    <motion.div
      className={`
        rounded-2xl border ${blurStyles[blur]} ${tintStyles[tint]}
        shadow-2xl backdrop-saturate-150
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
      whileHover={{ y: -2, scale: 1.01 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stat Card - For dashboards with count-up animation
 */
export interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: number;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  gradient?: string;
}

export function StatCard({
  title,
  value,
  prefix = "",
  suffix = "",
  change,
  icon,
  trend = "neutral",
  gradient = "from-blue-600 to-cyan-600",
}: StatCardProps) {
  const trendColors = {
    up: "text-green-600 bg-green-50",
    down: "text-red-600 bg-red-50",
    neutral: "text-gray-600 bg-gray-50",
  };

  return (
    <PremiumCard hoverable glow className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 font-medium mb-1">{title}</p>
          <motion.h3
            className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r"
            style={{
              backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springs.bouncy}
          >
            <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
              {prefix}
              {value.toLocaleString()}
              {suffix}
            </span>
          </motion.h3>
        </div>
        {icon && (
          <motion.div
            className={`p-3 rounded-xl bg-gradient-to-r ${gradient} text-white`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={springs.snappy}
          >
            {icon}
          </motion.div>
        )}
      </div>

      {change !== undefined && (
        <motion.div
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${trendColors[trend]}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, ...springs.smooth }}
        >
          <span>{change > 0 ? "↑" : change < 0 ? "↓" : "→"}</span>
          <span>{Math.abs(change)}%</span>
        </motion.div>
      )}
    </PremiumCard>
  );
}
