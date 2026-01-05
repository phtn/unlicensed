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
  lensSize = 240,
  isStatic = false,
  position = {x: 180, y: 150},
  hovering,
  setHovering,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const lensRef = useRef<HTMLDivElement>(null)

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
      className='relative overflow-hidden z-20 hover:cursor-none'
      onMouseEnter={() => {
        setIsHovering(true)
      }}
      onClick={handleToggleZoom}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}>
      {children}

      {isStatic ? (
        <div className='flex items-center justify-center'>
          <motion.div
            ref={lensRef}
            id='lens'
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
            <motion.div
              className='absolute inset-0'
              animate={{
                scale: zoom ? zoomFactor + 1 : zoomFactor,
              }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{
                transformOrigin: `${position.x}px ${position.y}px`,
              }}>
              {children}
            </motion.div>
          </motion.div>
        </div>
      ) : (
        <AnimatePresence>
          {isHovering && (
            <div className='flex items-center justify-center hover:cursor-none'>
              <motion.div
                id='lens'
                initial={{opacity: 0, scale: 0.58}}
                animate={{opacity: 1, scale: 1}}
                exit={{opacity: 0, scale: 0.8}}
                transition={{duration: 0.5, ease: 'easeOut'}}
                className='absolute inset-0 overflow-hidden hover:cursor-none'
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
                  cursor: 'none',
                }}>
                <motion.div
                  className='absolute inset-0 hover:cursor-none'
                  animate={{
                    scale: zoom ? zoomFactor + 1.5 : zoomFactor,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  style={{
                    transformOrigin: `${mousePosition.x}px ${mousePosition.y}px`,
                  }}>
                  {children}
                </motion.div>
              </motion.div>
              <ZoomEffect
                mousePosition={mousePosition}
                lensSize={lensSize}
                zoom={zoom}
              />
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

interface ZoomEffectProps {
  mousePosition: {x: number; y: number}
  lensSize: number
  zoom: boolean
}

const ZoomEffect = ({mousePosition, lensSize, zoom}: ZoomEffectProps) => (
  <motion.div
    initial={{opacity: 0, scale: 0.8}}
    animate={{opacity: 1, scale: 1}}
    exit={{opacity: 0, scale: 0.8}}
    transition={{duration: 0.4, ease: 'easeOut'}}
    className='absolute pointer-events-none hover:cursor-none flex items-center justify-center p-1'
    style={{
      left: `${mousePosition.x - lensSize / 2}px`,
      top: `${mousePosition.y - lensSize / 2}px`,
      width: `${lensSize}px`,
      height: `${lensSize}px`,
      transform: 'translate(-50%, -50%)',
      zIndex: 60,
    }}>
    <motion.svg width={lensSize} height={lensSize} className='absolute inset-0'>
      <circle
        cx={(lensSize - (zoom ? 2 : 0)) / 2}
        cy={(lensSize - (zoom ? 2 : 0)) / 2}
        r={lensSize - (zoom ? 2.5 : 0)}
        fill='none'
        stroke='rgba(55, 55, 55, 0.8)'
        strokeWidth={zoom ? '6' : '4'}
      />

      <motion.circle
        animate={{
          rotate: zoom ? 15 : 0,
        }}
        transition={{
          type: 'spring',
          visualDuration: 0.5,
          bounce: 0.2,
          ease: 'easeInOut',
        }}
        style={{
          transformOrigin: 'center',
        }}
        cx={lensSize / 2}
        cy={lensSize / 2}
        r={lensSize / 2 - 2}
        fill='none'
        stroke='white'
        strokeWidth='4'
        strokeDasharray={zoom ? '1 6' : '1 4'}
      />
      <line
        x1={lensSize / 2}
        y1={lensSize / 2}
        x2={lensSize / 2}
        y2={lensSize / 2 + 6}
        stroke='rgba(255, 255, 255, 0.6)'
        strokeWidth='0.5'
        strokeLinecap='square'
        className='translate-y-px'
      />
      <line
        x1={lensSize / 2 - 6}
        y1={lensSize / 2}
        x2={lensSize / 2}
        y2={lensSize / 2}
        stroke='rgba(255, 255, 255, 0.6)'
        strokeWidth='0.5'
        strokeLinecap='square'
        className='-translate-x-px'
      />
    </motion.svg>
  </motion.div>
)
