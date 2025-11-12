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

  // Get the appropriate icon based on direction and RTL
  const getIcon = () => {
    switch (direction) {
      case "right":
        return isRTL ? ChevronLeft : ChevronRight;
      case "left":
        return isRTL ? ChevronRight : ChevronLeft;
      case "down":
        return ChevronDown;
      case "up":
        return ChevronUp;
      default:
        return ChevronRight;
    }
  };

  const Icon = getIcon();

  return <Icon className={className} size={size} />;
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
  const Icon = isExpanded ? ChevronDown : isRTL ? ChevronLeft : ChevronRight;

  return <Icon className={className} size={size} />;
}
