"use client";

import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";

interface DirectionalChevronProps {
  direction: "right" | "left" | "down" | "up";
  className?: string;
  size?: number;
}

/**
 * A chevron component that automatically adjusts direction for RTL languages.
 * For 'right' and 'left', it will flip in RTL mode (ar locale).
 * For 'down' and 'up', it stays the same regardless of locale.
 */
export function DirectionalChevron({ direction, className = "", size }: DirectionalChevronProps) {
  const { locale } = useTranslation();
  const isRTL = locale === "ar";

  // Directly render the appropriate icon based on direction and RTL
  if (direction === "right") {
    return isRTL ? (
      <ChevronLeft className={className} size={size} />
    ) : (
      <ChevronRight className={className} size={size} />
    );
  }

  if (direction === "left") {
    return isRTL ? (
      <ChevronRight className={className} size={size} />
    ) : (
      <ChevronLeft className={className} size={size} />
    );
  }

  if (direction === "down") {
    return <ChevronDown className={className} size={size} />;
  }

  if (direction === "up") {
    return <ChevronUp className={className} size={size} />;
  }

  // Default fallback
  return <ChevronRight className={className} size={size} />;
}

/**
 * A collapsible chevron that rotates between right (collapsed) and down (expanded).
 * Automatically handles RTL direction.
 */
interface CollapsibleChevronProps {
  isExpanded: boolean;
  className?: string;
  size?: number;
}

export function CollapsibleChevron({ isExpanded, className = "", size }: CollapsibleChevronProps) {
  const { locale } = useTranslation();
  const isRTL = locale === "ar";

  // When collapsed, show right chevron (or left in RTL)
  // When expanded, show down chevron
  if (isExpanded) {
    return <ChevronDown className={className} size={size} />;
  }

  return isRTL ? (
    <ChevronLeft className={className} size={size} />
  ) : (
    <ChevronRight className={className} size={size} />
  );
}
