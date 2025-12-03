/**
 * Advanced Animation Utilities
 * Premium motion configurations for smooth, professional animations
 */

import type { Transition as _Transition, Variants } from "framer-motion";

// ============================================
// SPRING PHYSICS - Natural, smooth motion
// ============================================

export const springs = {
  // Snappy - Quick, responsive (Monday.com style)
  snappy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 0.5,
  },

  // Smooth - Elegant, polished (Notion style)
  smooth: {
    type: "spring" as const,
    stiffness: 300,
    damping: 35,
    mass: 0.8,
  },

  // Bouncy - Playful, energetic
  bouncy: {
    type: "spring" as const,
    stiffness: 500,
    damping: 25,
    mass: 0.6,
  },

  // Gentle - Soft, subtle
  gentle: {
    type: "spring" as const,
    stiffness: 200,
    damping: 40,
    mass: 1,
  },

  // Molasses - Slow, dramatic
  molasses: {
    type: "spring" as const,
    stiffness: 100,
    damping: 30,
    mass: 1.2,
  },
};

// ============================================
// EASING CURVES - Bezier curves for timing
// ============================================

export const easings = {
  // Standard Material Design easing
  standard: [0.4, 0.0, 0.2, 1] as const,

  // Emphasized - For important actions
  emphasized: [0.0, 0.0, 0.2, 1] as const,

  // Decelerate - Entering elements
  decelerate: [0.0, 0.0, 0.2, 1] as const,

  // Accelerate - Exiting elements
  accelerate: [0.4, 0.0, 1, 1] as const,

  // Sharp - Quick, decisive
  sharp: [0.4, 0.0, 0.6, 1] as const,

  // Smooth - iOS style
  smooth: [0.25, 0.1, 0.25, 1] as const,

  // Bounce - Playful
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
};

// ============================================
// PRESET TRANSITIONS
// ============================================

export const transitions = {
  fast: { duration: 0.15, ease: easings.sharp },
  normal: { duration: 0.25, ease: easings.standard },
  slow: { duration: 0.35, ease: easings.smooth },
  verySlow: { duration: 0.5, ease: easings.smooth },
};

// ============================================
// ANIMATION VARIANTS - Reusable patterns
// ============================================

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: transitions.fast,
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springs.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.fast,
  },
};

export const slideInRight: Variants = {
  hidden: { x: 100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: springs.smooth,
  },
  exit: {
    x: -50,
    opacity: 0,
    transition: transitions.fast,
  },
};

export const slideInLeft: Variants = {
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: springs.smooth,
  },
};

// ============================================
// STAGGER CHILDREN - Cascading animations
// ============================================

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.snappy,
  },
};

// ============================================
// HOVER & TAP EFFECTS
// ============================================

export const hoverScale = {
  scale: 1.02,
  transition: springs.snappy,
};

export const hoverLift = {
  y: -2,
  scale: 1.01,
  boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.15)",
  transition: springs.snappy,
};

export const tapScale = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

export const tapShrink = {
  scale: 0.95,
  transition: { duration: 0.1 },
};

// ============================================
// LOADING STATES
// ============================================

export const pulse: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.8,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  },
};

export const shimmer: Variants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

export const spin: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// ============================================
// GESTURE CONFIGURATIONS
// ============================================

export const dragConstraints = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export const dragElastic = 0.2;

export const dragTransition = {
  bounceStiffness: 300,
  bounceDamping: 20,
};

// ============================================
// PAGE TRANSITIONS
// ============================================

export const pageTransitions: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: transitions.fast,
  },
};

// ============================================
// MICRO-INTERACTIONS
// ============================================

export const buttonPress: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: springs.snappy,
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

export const cardHover: Variants = {
  rest: {
    y: 0,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  hover: {
    y: -4,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
    transition: springs.snappy,
  },
};

// ============================================
// NOTIFICATION ANIMATIONS
// ============================================

export const notificationSlideIn: Variants = {
  hidden: {
    x: 400,
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: springs.snappy,
  },
  exit: {
    x: 400,
    opacity: 0,
    scale: 0.8,
    transition: transitions.fast,
  },
};

export const toastPop: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: transitions.fast,
  },
};
