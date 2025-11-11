'use client'

import {AnimatePresence, motion} from 'motion/react'
import {useRef, useState} from 'react'

interface LensProps {
  children: React.ReactNode
  zoomFactor?: number
  lensSize?: number
  position?: {
    x: number
    y: number
  }
  isStatic?: boolean
  isFocusing?: () => void
  hovering?: boolean
  setHovering?: (hovering: boolean) => void
}

export const Lens: React.FC<LensProps> = ({
  children,
  zoomFactor = 1.75,
  lensSize = 280,
  isStatic = false,
  position = {x: 180, y: 150},
  hovering,
  setHovering,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const [localIsHovering, setLocalIsHovering] = useState(false)
  const [zoom, setZoom] = useState(false)

  const isHovering = hovering !== undefined ? hovering : localIsHovering
  const setIsHovering = setHovering || setLocalIsHovering

  // const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({x: 100, y: 100})

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePosition({x, y})
  }

  const handleToggleZoom = () => {
    if (isHovering) {
      setZoom((prev) => !prev)
    }
  }

  return (
    <div
      ref={containerRef}
      className='relative overflow-hidden rounded-lg z-20 cursor-crosshair'
      onMouseEnter={() => {
        setIsHovering(true)
      }}
      onClick={handleToggleZoom}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}>
      {children}

      {isStatic ? (
        <div>
          <motion.div
            initial={{opacity: 0, scale: 0.58}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0.8}}
            transition={{duration: 0.3, ease: 'easeOut'}}
            className='absolute inset-0 overflow-hidden'
            style={{
              maskImage: `radial-gradient(circle ${lensSize / 2}px at ${
                position.x
              }px ${position.y}px, black 100%, transparent 100%)`,
              WebkitMaskImage: `radial-gradient(circle ${lensSize / 2}px at ${
                position.x
              }px ${position.y}px, black 100%, transparent 100%)`,
              transformOrigin: `${position.x}px ${position.y}px`,
            }}>
            <div
              className='absolute inset-0'
              style={{
                transform: `scale(${zoomFactor})`,
                transformOrigin: `${position.x}px ${position.y}px`,
              }}>
              {children}
            </div>
          </motion.div>
        </div>
      ) : (
        <AnimatePresence>
          {isHovering && (
            <div>
              <motion.div
                initial={{opacity: 0, scale: 0.58}}
                animate={{opacity: 1, scale: 1}}
                exit={{opacity: 0, scale: 0.8}}
                transition={{duration: 0.3, ease: 'easeOut'}}
                className='absolute inset-0 overflow-hidden'
                style={{
                  maskImage: `radial-gradient(circle ${lensSize / 2}px at ${
                    mousePosition.x
                  }px ${mousePosition.y}px, black 100%, transparent 100%)`,
                  WebkitMaskImage: `radial-gradient(circle ${
                    lensSize / 2
                  }px at ${mousePosition.x}px ${
                    mousePosition.y
                  }px, black 100%, transparent 100%)`,
                  transformOrigin: `${mousePosition.x}px ${mousePosition.y}px`,
                  zIndex: 50,
                }}>
                <div
                  className='absolute inset-0'
                  style={{
                    transform: `scale(${zoom ? zoomFactor + 1 : zoomFactor})`,
                    transformOrigin: `${mousePosition.x}px ${mousePosition.y}px`,
                  }}>
                  {children}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
