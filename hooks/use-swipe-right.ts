import {useEffect, type RefObject} from 'react'
import {
  createSwipeHandler,
  type SwipeCallback,
  type SwipeConfig,
} from 'swipe-right-js'

/**
 * Configuration for swipe drawer behavior
 */
export interface SwipeDrawerConfig extends Omit<SwipeConfig, 'preventDefault'> {
  /**
   * The direction the drawer opens from ('left' | 'right' | 'top' | 'bottom')
   * Determines which swipe directions will trigger open/close
   */
  targetDirection?: 'left' | 'right' | 'top' | 'bottom'
  /**
   * Whether to prevent default touch behavior (default: false)
   */
  preventDefault?: boolean
  /**
   * Whether the swipe handler is enabled (default: true)
   */
  enabled?: boolean
  /**
   * Maximum distance from the edge (as a fraction of screen width) where swipe can start
   * For left drawer, this is from the left edge (default: 1/3)
   * Set to 1 to allow swipes from anywhere
   */
  edgeThreshold?: number
}

/**
 * Hook to enable swipe gestures for toggling drawer state
 *
 * @param ref - Ref to the element that should detect swipe gestures
 * @param open - Current open state of the drawer
 * @param onOpenChange - Callback to toggle drawer state
 * @param config - Optional configuration for swipe behavior
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false)
 * const swipeAreaRef = useRef<HTMLDivElement>(null)
 *
 * useSwipeRight(swipeAreaRef, open, setOpen, {
 *   drawerDirection: 'right',
 *   threshold: 50,
 * })
 * ```
 */
export const useSwipeRight = (
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  config?: SwipeDrawerConfig,
): void => {
  const {
    targetDirection = 'right',
    enabled = true,
    threshold = 30,
    velocityThreshold = 0.3,
    preventDefault = false,
  } = config ?? {}

  useEffect(() => {
    const element = ref.current
    if (!element || !enabled) {
      return
    }

    let touchStartX: number | null = null
    const edgeThreshold = config?.edgeThreshold ?? 1 / 3

    // Track touch start position to check if it's within the edge threshold
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) {
        touchStartX = touch.clientX
      }
    }

    const handleSwipe: SwipeCallback = (event) => {
      // Check if swipe started within the edge threshold
      if (touchStartX !== null) {
        const screenWidth = window.innerWidth
        const maxStartX = screenWidth * edgeThreshold

        // For left drawer, only allow swipes starting from the left edge
        if (targetDirection === 'left' && touchStartX > maxStartX) {
          touchStartX = null
          return
        }
        // For right drawer, only allow swipes starting from the right edge
        if (targetDirection === 'right' && touchStartX < screenWidth - maxStartX) {
          touchStartX = null
          return
        }
      }

      let shouldToggle = false

      // Determine which swipe direction should trigger toggle based on drawer position
      switch (targetDirection) {
        case 'right': {
          // Right drawer: swipe left opens, swipe right closes
          if (event.direction === 'left' && !open) {
            shouldToggle = true
          } else if (event.direction === 'right' && open) {
            shouldToggle = true
          }
          break
        }
        case 'left': {
          // Left drawer: swipe right opens, swipe left closes
          if (event.direction === 'right' && !open) {
            shouldToggle = true
          } else if (event.direction === 'left' && open) {
            shouldToggle = true
          }
          break
        }
        case 'top': {
          // Top drawer: swipe down opens, swipe up closes
          if (event.direction === 'down' && !open) {
            shouldToggle = true
          } else if (event.direction === 'up' && open) {
            shouldToggle = true
          }
          break
        }
        case 'bottom': {
          // Bottom drawer: swipe up opens, swipe down closes
          if (event.direction === 'up' && !open) {
            shouldToggle = true
          } else if (event.direction === 'down' && open) {
            shouldToggle = true
          }
          break
        }
      }

      if (shouldToggle) {
        onOpenChange(!open)
      }

      touchStartX = null
    }

    const handler = createSwipeHandler(element, handleSwipe, {
      threshold,
      velocityThreshold,
      preventDefault,
    })

    // Add touchstart listener to track initial position
    element.addEventListener('touchstart', handleTouchStart, {passive: true})

    return () => {
      handler.destroy()
      element.removeEventListener('touchstart', handleTouchStart)
    }
  }, [
    ref,
    open,
    onOpenChange,
    targetDirection,
    enabled,
    threshold,
    velocityThreshold,
    preventDefault,
    config?.edgeThreshold,
  ])
}
