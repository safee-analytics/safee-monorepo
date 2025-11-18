"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

export interface AnimatedListProps<T> {
  items: T[];
  keyExtractor: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  layout?: "vertical" | "horizontal" | "grid";
  columns?: 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  staggerDelay?: number;
  animationDuration?: number;
  animateExit?: boolean;
  className?: string;
  itemClassName?: string;
}

const gapClasses = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

const columnClasses = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
};

/**
 * Production-ready Animated List component with staggered animations
 *
 * @example
 * ```tsx
 * <AnimatedList
 *   items={users}
 *   keyExtractor={(user) => user.id}
 *   renderItem={(user) => (
 *     <div className="p-4 bg-white rounded-lg shadow">
 *       <h3>{user.name}</h3>
 *       <p>{user.email}</p>
 *     </div>
 *   )}
 *   layout="grid"
 *   columns={3}
 * />
 * ```
 */
export function AnimatedList<T>({
  items,
  keyExtractor,
  renderItem,
  layout = "vertical",
  columns = 3,
  gap = "md",
  staggerDelay = 0.05,
  animationDuration = 0.3,
  animateExit = true,
  className = "",
  itemClassName = "",
}: AnimatedListProps<T>) {
  const containerClasses = {
    vertical: `flex flex-col ${gapClasses[gap]}`,
    horizontal: `flex flex-row overflow-x-auto ${gapClasses[gap]}`,
    grid: `grid ${columnClasses[columns]} ${gapClasses[gap]}`,
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: layout === "vertical" ? 20 : 0,
      x: layout === "horizontal" ? 20 : 0,
      scale: 0.95,
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: animationDuration,
        delay: index * staggerDelay,
      },
    }),
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: animationDuration * 0.5,
      },
    },
  };

  return (
    <AnimatePresence mode={animateExit ? "popLayout" : undefined}>
      <div className={`${containerClasses[layout]} ${className}`}>
        {items.map((item, index) => {
          const key = keyExtractor(item, index);
          return (
            <motion.div
              key={key}
              custom={index}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={animateExit ? "exit" : undefined}
              className={itemClassName}
            >
              {renderItem(item, index)}
            </motion.div>
          );
        })}
      </div>
    </AnimatePresence>
  );
}

/**
 * Simple List Item - Common wrapper for list items
 */
export interface SimpleListItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function SimpleListItem({ children, onClick, className = "" }: SimpleListItemProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`
        bg-white rounded-lg p-4 shadow-sm border border-gray-200
        transition-all duration-200
        ${onClick ? "hover:shadow-md hover:border-gray-300 cursor-pointer active:scale-98" : ""}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}

/**
 * Compact List - List variant with minimal spacing
 */
export interface CompactListProps<T> {
  items: T[];
  keyExtractor: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  divider?: boolean;
  className?: string;
}

export function CompactList<T>({
  items,
  keyExtractor,
  renderItem,
  divider = true,
  className = "",
}: CompactListProps<T>) {
  return (
    <AnimatedList
      items={items}
      keyExtractor={keyExtractor}
      renderItem={(item, index) => (
        <>
          {renderItem(item, index)}
          {divider && index < items.length - 1 && <div className="border-b border-gray-200" />}
        </>
      )}
      layout="vertical"
      gap="sm"
      staggerDelay={0.03}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}
      itemClassName="px-4 py-3"
    />
  );
}
