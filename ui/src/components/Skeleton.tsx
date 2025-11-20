"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { shimmer } from "../utils/animations";

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  animate?: boolean;
}

/**
 * Skeleton loader with shimmer effect
 * Creates smooth loading states like Monday.com
 *
 * @example
 * ```tsx
 * <Skeleton width="100%" height="20px" />
 * <Skeleton circle width="40px" height="40px" />
 * ```
 */
export function Skeleton({
  className = "",
  width = "100%",
  height = "20px",
  circle = false,
  animate = true,
}: SkeletonProps) {
  return (
    <div
      className={`relative bg-gray-200 overflow-hidden ${circle ? "rounded-full" : "rounded-lg"} ${className}`}
      style={{ width, height }}
    >
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          variants={shimmer}
          initial="initial"
          animate="animate"
        />
      )}
    </div>
  );
}

/**
 * Skeleton Text - Multiple lines
 */
export interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
  className?: string;
}

export function SkeletonText({ lines = 3, lastLineWidth = "70%", className = "" }: SkeletonTextProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="16px" width={i === lines - 1 ? lastLineWidth : "100%"} />
      ))}
    </div>
  );
}

/**
 * Skeleton Card - Full card placeholder
 */
export interface SkeletonCardProps {
  showImage?: boolean;
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

export function SkeletonCard({
  showImage = true,
  showAvatar = false,
  lines = 3,
  className = "",
}: SkeletonCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${className}`}>
      {showImage && <Skeleton height="200px" className="mb-4" />}

      <div className="flex items-center gap-3 mb-4">
        {showAvatar && <Skeleton circle width="40px" height="40px" />}
        <div className="flex-1">
          <Skeleton height="20px" width="60%" className="mb-2" />
          <Skeleton height="16px" width="40%" />
        </div>
      </div>

      <SkeletonText lines={lines} />
    </div>
  );
}

/**
 * Skeleton Table - Table loading state
 */
export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className = "" }: SkeletonTableProps) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-200 bg-gray-50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} height="20px" width={`${100 / columns}%`} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex items-center gap-4 p-4 border-b border-gray-100">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="16px" width={`${100 / columns}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton List - List loading state
 */
export interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

export function SkeletonList({ items = 5, showAvatar = true, className = "" }: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
          {showAvatar && <Skeleton circle width="48px" height="48px" />}
          <div className="flex-1">
            <Skeleton height="18px" width="40%" className="mb-2" />
            <Skeleton height="14px" width="60%" />
          </div>
          <Skeleton width="80px" height="32px" />
        </div>
      ))}
    </div>
  );
}

/**
 * Loading Screen - Full page loader
 */
export interface LoadingScreenProps {
  message?: string;
  logo?: ReactNode;
}

export function LoadingScreen({ message = "Loading...", logo }: LoadingScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {logo && (
        <motion.div
          className="mb-8"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {logo}
        </motion.div>
      )}

      {/* Animated dots */}
      <div className="flex items-center gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-blue-600 rounded-full"
            animate={{
              y: [0, -10, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.p
        className="mt-6 text-gray-600 font-medium"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

/**
 * Progress Bar - Smooth animated progress
 */
export interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  color?: "blue" | "green" | "purple" | "red";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = true,
  color = "blue",
  size = "md",
  className = "",
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorStyles = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
    red: "bg-red-600",
  };

  const sizeStyles = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={className}>
      <div className={`relative w-full ${sizeStyles[size]} bg-gray-200 rounded-full overflow-hidden`}>
        <motion.div
          className={`h-full ${colorStyles[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {showLabel && (
        <motion.p
          className="text-sm text-gray-600 mt-2 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {Math.round(percentage)}%
        </motion.p>
      )}
    </div>
  );
}
