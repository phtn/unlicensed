'use client'

import {motion} from 'motion/react'
import {RefObject, useEffect, useId, useState} from 'react'

import {cn} from '@/lib/utils'

export interface AnimatedBeamProps {
  className?: string
  containerRef: RefObject<HTMLElement | null> // Container ref
  fromRef: RefObject<HTMLElement | null>
  toRef: RefObject<HTMLElement | null>
  curvature?: number
  reverse?: boolean
  pathColor?: string
  pathWidth?: number
  pathOpacity?: number
  gradientStartColor?: string
  gradientStopColor?: string
  delay?: number
  duration?: number
  /**
   * Manual offset overrides for connection points (auto-calculated if not provided)
   * @default undefined - auto-calculates optimal connection points
   */
  startXOffset?: number
  startYOffset?: number
  endXOffset?: number
  endYOffset?: number
  /**
   * Enable decaying path effect - fades out along the path length
   * @default false
   */
  decay?: boolean
  /**
   * Where the decay effect starts (0-1, 0 = start of path, 1 = end of path)
   * @default 0
   */
  decayStart?: number
  /**
   * Where the decay effect ends (0-1, 0 = start of path, 1 = end of path)
   * @default 1
   */
  decayEnd?: number
  /**
   * Intensity of the decay effect (0-1, higher = more fade)
   * @default 1
   */
  decayIntensity?: number
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0.33,
  reverse = false, // Include the reverse prop
  duration = Math.random() * 3 + 6,
  delay = 0.33,
  pathColor = 'gray',
  pathWidth = 2,
  pathOpacity = 0.0,
  gradientStartColor = '#fc81fe',
  gradientStopColor = '#03bfff',
  startXOffset,
  startYOffset,
  endXOffset,
  endYOffset,
  decay = false,
  decayStart = 0,
  decayEnd = 1,
  decayIntensity = 1,
}) => {
  const id = useId()
  const maskId = useId()
  const [pathD, setPathD] = useState('')
  const [svgDimensions, setSvgDimensions] = useState({width: 0, height: 0})
  const [pathCoords, setPathCoords] = useState<{
    startX: number
    startY: number
    endX: number
    endY: number
  } | null>(null)

  /**
   * Calculate the optimal connection points between two rectangles
   * Finds the closest points on the perimeters of the bounding boxes
   */
  const calculateConnectionPoints = (
    rectA: DOMRect,
    rectB: DOMRect,
    containerRect: DOMRect,
  ): {startX: number; startY: number; endX: number; endY: number} => {
    // Convert to container-relative coordinates
    const a = {
      left: rectA.left - containerRect.left,
      top: rectA.top - containerRect.top,
      right: rectA.right - containerRect.left,
      bottom: rectA.bottom - containerRect.top,
      width: rectA.width,
      height: rectA.height,
      centerX: rectA.left - containerRect.left + rectA.width / 2,
      centerY: rectA.top - containerRect.top + rectA.height / 2,
    }

    const b = {
      left: rectB.left - containerRect.left,
      top: rectB.top - containerRect.top,
      right: rectB.right - containerRect.left,
      bottom: rectB.bottom - containerRect.top,
      width: rectB.width,
      height: rectB.height,
      centerX: rectB.left - containerRect.left + rectB.width / 2,
      centerY: rectB.top - containerRect.top + rectB.height / 2,
    }

    // Calculate relative positions
    const dx = b.centerX - a.centerX
    const dy = b.centerY - a.centerY

    // Determine which edges to connect based on relative positions
    let startX: number
    let startY: number
    let endX: number
    let endY: number

    // Check if elements overlap significantly
    const horizontalOverlap =
      a.left < b.right && a.right > b.left
    const verticalOverlap =
      a.top < b.bottom && a.bottom > b.top

    if (horizontalOverlap && !verticalOverlap) {
      // Vertical alignment - connect top/bottom edges
      startX = a.centerX
      endX = b.centerX
      if (dy > 0) {
        // B is below A
        startY = a.bottom
        endY = b.top
      } else {
        // B is above A
        startY = a.top
        endY = b.bottom
      }
    } else if (verticalOverlap && !horizontalOverlap) {
      // Horizontal alignment - connect left/right edges
      startY = a.centerY
      endY = b.centerY
      if (dx > 0) {
        // B is to the right of A
        startX = a.right
        endX = b.left
      } else {
        // B is to the left of A
        startX = a.left
        endX = b.right
      }
    } else {
      // Diagonal or overlapping - use edge centers for cleaner connections
      if (Math.abs(dx) > Math.abs(dy)) {
        // More horizontal - use vertical edge centers
        startY = a.centerY
        endY = b.centerY
        if (dx > 0) {
          startX = a.right
          endX = b.left
        } else {
          startX = a.left
          endX = b.right
        }
      } else {
        // More vertical - use horizontal edge centers
        startX = a.centerX
        endX = b.centerX
        if (dy > 0) {
          startY = a.bottom
          endY = b.top
        } else {
          startY = a.top
          endY = b.bottom
        }
      }
    }

    return {startX, startY, endX, endY}
  }

  // Calculate the gradient coordinates based on the reverse prop
  const gradientCoordinates = reverse
    ? {
        x1: ['90%', '-10%'],
        x2: ['100%', '0%'],
        y1: ['0%', '0%'],
        y2: ['0%', '0%'],
      }
    : {
        x1: ['10%', '110%'],
        x2: ['0%', '100%'],
        y1: ['0%', '0%'],
        y2: ['0%', '0%'],
      }

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const rectA = fromRef.current.getBoundingClientRect()
        const rectB = toRef.current.getBoundingClientRect()

        const svgWidth = containerRect.width
        const svgHeight = containerRect.height
        setSvgDimensions({width: svgWidth, height: svgHeight})

        // Auto-calculate connection points if offsets are not provided
        let connectionPoints: {
          startX: number
          startY: number
          endX: number
          endY: number
        }

        if (
          startXOffset === undefined &&
          startYOffset === undefined &&
          endXOffset === undefined &&
          endYOffset === undefined
        ) {
          // Auto-calculate optimal connection points
          connectionPoints = calculateConnectionPoints(
            rectA,
            rectB,
            containerRect,
          )
        } else {
          // Use manual offsets (fallback to center if offset not provided)
          connectionPoints = {
            startX:
              rectA.left -
              containerRect.left +
              rectA.width / 2 +
              (startXOffset ?? 0),
            startY:
              rectA.top -
              containerRect.top +
              rectA.height / 2 +
              (startYOffset ?? 0),
            endX:
              rectB.left -
              containerRect.left +
              rectB.width / 2 +
              (endXOffset ?? 0),
            endY:
              rectB.top -
              containerRect.top +
              rectB.height / 2 +
              (endYOffset ?? 0),
          }
        }

        setPathCoords(connectionPoints)

        // Calculate path distance for relative curvature
        const dx = connectionPoints.endX - connectionPoints.startX
        const dy = connectionPoints.endY - connectionPoints.startY
        const pathLength = Math.sqrt(dx * dx + dy * dy)
        
        // Safety check for zero-length paths
        if (pathLength === 0 || !isFinite(pathLength)) {
          setPathD('')
          return
        }
        
        // Calculate midpoint
        const midX = (connectionPoints.startX + connectionPoints.endX) / 2
        const midY = (connectionPoints.startY + connectionPoints.endY) / 2
        
        // Calculate curvature offset
        // Use a combination of fixed minimum and relative offset for consistent curves
        // This ensures curves are visible even for short paths
        const minCurvature = 50 // Minimum curve height in pixels
        // Use curvature as a percentage of path length, but ensure it's always visible
        const relativeCurvature = pathLength * curvature
        // For very long paths, cap the curvature to prevent excessive curves
        const maxCurvature = Math.min(pathLength * 0.5, 200) // Max 50% of path or 200px
        const curvatureHeight = Math.max(minCurvature, Math.min(relativeCurvature, maxCurvature))
        
        // Always use perpendicular offset for consistent curves
        // Normalize the direction vector
        const dirX = dx / pathLength
        const dirY = dy / pathLength
        
        // Perpendicular vector (rotate 90 degrees counter-clockwise)
        // This creates a curve that's always perpendicular to the path
        const perpX = -dirY
        const perpY = dirX
        
        // For vertical paths (dx ≈ 0), perpX will be ±1, creating horizontal curve
        // For horizontal paths (dy ≈ 0), perpY will be ±1, creating vertical curve
        // For diagonal paths, we get a diagonal perpendicular curve
        
        // Control point: midpoint with perpendicular offset
        // Use consistent direction: always curve in the same relative direction
        // Negative offset creates a consistent curve appearance
        let controlX = midX + perpX * curvatureHeight * -1
        let controlY = midY + perpY * curvatureHeight * -1
        
        // Ensure the control point creates a visible curve
        // Check if control point is too close to the line (would create straight line)
        const distToLine = Math.abs(
          (dy * controlX - dx * controlY + connectionPoints.endX * connectionPoints.startY - connectionPoints.endY * connectionPoints.startX) / pathLength
        )
        
        // If the control point is too close to the line, increase the offset
        if (distToLine < minCurvature * 0.5) {
          // Increase curvature to ensure visibility
          const adjustedCurvature = minCurvature * 1.5
          controlX = midX + perpX * adjustedCurvature * -1
          controlY = midY + perpY * adjustedCurvature * -1
        }
        
        // Ensure coordinates are valid
        if (
          !isFinite(controlX) ||
          !isFinite(controlY) ||
          !isFinite(connectionPoints.startX) ||
          !isFinite(connectionPoints.startY) ||
          !isFinite(connectionPoints.endX) ||
          !isFinite(connectionPoints.endY)
        ) {
          setPathD('')
          return
        }
        
        const d = `M ${connectionPoints.startX},${connectionPoints.startY} Q ${controlX},${controlY} ${connectionPoints.endX},${connectionPoints.endY}`
        setPathD(d)
      }
    }

    // Initialize ResizeObserver and MutationObserver for position changes
    const resizeObserver = new ResizeObserver(() => {
      updatePath()
    })

    // Observe the container and both ref elements
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    if (fromRef.current) {
      resizeObserver.observe(fromRef.current)
    }
    if (toRef.current) {
      resizeObserver.observe(toRef.current)
    }

    // Also listen for scroll events on the container to update path position
    const handleScroll = () => {
      updatePath()
    }
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, {passive: true})
    }

    // Call the updatePath initially to set the initial path
    updatePath()

    // Clean up the observer on component unmount
    return () => {
      resizeObserver.disconnect()
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [
    containerRef,
    fromRef,
    toRef,
    curvature,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
    decay,
    decayStart,
    decayEnd,
    decayIntensity,
  ])

  // Calculate decay opacity for gradient stops
  const getDecayOpacity = (offset: number): number => {
    if (!decay) return 1
    if (offset < decayStart) return 1
    if (offset > decayEnd) return 1 - decayIntensity
    // Linear interpolation between decayStart and decayEnd
    const progress = (offset - decayStart) / (decayEnd - decayStart)
    return 1 - progress * decayIntensity
  }

  // Don't render if dimensions are invalid or path is empty
  if (
    svgDimensions.width === 0 ||
    svgDimensions.height === 0 ||
    !pathD ||
    pathD.trim() === ''
  ) {
    return null
  }

  return (
    <svg
      fill='none'
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns='http://www.w3.org/2000/svg'
      className={cn(
        'pointer-events-none absolute top-0 left-0 transform-gpu stroke-2',
        className,
      )}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}>
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap='round'
        mask={decay ? `url(#${maskId})` : undefined}
      />
      <path
        d={pathD}
        strokeWidth={pathWidth}
        stroke={`url(#${id})`}
        strokeOpacity='1'
        strokeLinecap='round'
        mask={decay ? `url(#${maskId})` : undefined}
      />
      <defs>
        <motion.linearGradient
          className='transform-gpu'
          id={id}
          gradientUnits={'userSpaceOnUse'}
          initial={{
            x1: '0%',
            x2: '0%',
            y1: '0%',
            y2: '0%',
          }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1], // https://easings.net/#easeOutExpo
            repeat: Infinity,
            repeatDelay: 0,
          }}>
          <stop stopColor={gradientStartColor} stopOpacity='0'></stop>
          <stop stopColor={gradientStartColor}></stop>
          <stop offset='62.5%' stopColor={gradientStopColor}></stop>
          <stop
            offset='100%'
            stopColor={gradientStopColor}
            stopOpacity='0'></stop>
        </motion.linearGradient>
        {decay && pathCoords && (
          <mask id={maskId} maskUnits='userSpaceOnUse'>
            <linearGradient
              id={`${maskId}-gradient`}
              gradientUnits='userSpaceOnUse'
              x1={pathCoords.startX}
              y1={pathCoords.startY}
              x2={pathCoords.endX}
              y2={pathCoords.endY}>
              <stop
                offset='0%'
                stopColor='white'
                stopOpacity={String(getDecayOpacity(0))}
              />
              <stop
                offset={`${decayStart * 100}%`}
                stopColor='white'
                stopOpacity={String(getDecayOpacity(decayStart))}
              />
              <stop
                offset={`${decayEnd * 100}%`}
                stopColor='white'
                stopOpacity={String(getDecayOpacity(decayEnd))}
              />
              <stop
                offset='100%'
                stopColor='white'
                stopOpacity={String(getDecayOpacity(1))}
              />
            </linearGradient>
            <rect
              width={svgDimensions.width}
              height={svgDimensions.height}
              fill={`url(#${maskId}-gradient)`}
            />
          </mask>
        )}
      </defs>
    </svg>
  )
}
