import { useEffect, useState } from 'react'

export type Direction = 'ltr' | 'rtl'

/**
 * Hook to get current text direction from HTML element
 * Useful for RTL-aware component styling
 */
export function useDirection(): Direction {
  const [direction, setDirection] = useState<Direction>('rtl')

  useEffect(() => {
    const dir = document.documentElement.dir as Direction
    setDirection(dir || 'rtl')

    // Watch for direction changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'dir') {
          const newDir = document.documentElement.dir as Direction
          setDirection(newDir || 'rtl')
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir'],
    })

    return () => observer.disconnect()
  }, [])

  return direction
}

/**
 * Helper to flip directional classes for RTL
 * Example: dirClass('ml-4', 'mr-4') returns 'mr-4' in RTL, 'ml-4' in LTR
 */
export function useDirectionClass(ltrClass: string, rtlClass: string): string {
  const dir = useDirection()
  return dir === 'rtl' ? rtlClass : ltrClass
}
