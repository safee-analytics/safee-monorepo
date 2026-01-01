import { useEffect, useState } from "react";

import { isDirection, type Direction } from "@/lib/utils/type-guards";

/**
 * Hook to get current text direction from HTML element
 * Useful for RTL-aware component styling
 */
export function useDirection(): Direction {
  const [direction, setDirection] = useState<Direction>(() => {
    if (typeof window === "undefined") return "ltr";
    const dir = document.documentElement.dir;
    return isDirection(dir) ? dir : "ltr";
  });

  useEffect(() => {
    // Watch for direction changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "dir") {
          const newDir = document.documentElement.dir;
          setDirection(isDirection(newDir) ? newDir : "ltr");
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return direction;
}

/**
 * Helper to flip directional classes for RTL
 * Example: dirClass('ml-4', 'mr-4') returns 'mr-4' in RTL, 'ml-4' in LTR
 */
export function useDirectionClass(ltrClass: string, rtlClass: string): string {
  const dir = useDirection();
  return dir === "rtl" ? rtlClass : ltrClass;
}
