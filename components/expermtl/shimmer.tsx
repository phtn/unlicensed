'use client'

/**
 * @author: @dorian_baffier
 * @description: Shimmer Text
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import {cn} from '@/lib/utils'
import type {Transition} from 'motion/react'
import {motion, useAnimationControls, useReducedMotion} from 'motion/react'
import {useEffect, useState} from 'react'

export interface ShimmerTextProps {
  text?: string
  className?: string
  auto?: boolean
  playOnHover?: boolean
  playOnClick?: boolean
  loading?: boolean
  active?: boolean
  duration?: number
  loop?: boolean
  ease?: Transition['ease']
  surface?: 'auto' | 'light' | 'dark'
  variant?: 'default' | 'chatgpt'
  children?: React.ReactNode
}

export default function ShimmerText({
  text,
  className,
  playOnHover = false,
  playOnClick = false,
  loading = false,
  auto = !playOnHover,
  active,
  duration,
  loop = true,
  ease,
  surface = 'auto',
  variant = 'default',
  children,
}: ShimmerTextProps) {
  const controls = useAnimationControls()
  const prefersReducedMotion = useReducedMotion()

  const [isHovered, setIsHovered] = useState<boolean>(false)
  const [isClicked, setIsClicked] = useState<boolean>(false)

  const shouldPlay: boolean =
    typeof active === 'boolean'
      ? active
      : loading ||
        auto ||
        (playOnHover && isHovered) ||
        (playOnClick && isClicked)

  useEffect(() => {
    if (prefersReducedMotion) {
      controls.stop()
      controls.set({
        backgroundPosition: variant === 'chatgpt' ? '0% center' : '300% center',
      })
      return
    }
    if (shouldPlay) {
      controls.start({
        backgroundPosition:
          variant === 'chatgpt'
            ? ['300% center', '-300% center']
            : ['300% center', '-300% center'],
        transition: {
          duration: duration ?? (variant === 'chatgpt' ? 4.65 : 6.5),
          ease: (ease ??
            (variant === 'chatgpt'
              ? 'backInOut'
              : 'easeInOut')) as Transition['ease'],
          repeat: loop ? Number.POSITIVE_INFINITY : 0,
          repeatDelay: 0,
        },
      })
    } else {
      controls.stop()
      controls.set({
        backgroundPosition:
          variant === 'chatgpt' ? '300% center' : '300% center',
      })
    }
  }, [
    shouldPlay,
    duration,
    loop,
    ease,
    variant,
    prefersReducedMotion,
    controls,
  ])

  const isInteractive = playOnClick || playOnHover

  const lightDefault = 'from-sky-100 via-white to-orange-50'
  const darkDefault = 'from-white via-neutral-500 to-white'
  const lightChatgpt =
    'dark:from-zinc-700 dark:via-zinc-400 dark:to-zinc-600 from-zinc-200 via-zinc-400 to-zinc-200'
  const darkChatgpt =
    'dark:from-zinc-200 dark:via-zinc-400 dark:to-zinc-700 from-zinc-100 via-zinc-200 to-zinc-100'

  const gradientClass =
    surface === 'auto'
      ? `bg-gradient-to-r ${variant === 'chatgpt' ? lightChatgpt : lightDefault} dark:${variant === 'chatgpt' ? darkChatgpt : darkDefault}`
      : surface === 'light'
        ? `bg-gradient-to-r ${variant === 'chatgpt' ? lightChatgpt : lightDefault}`
        : `bg-gradient-to-r ${variant === 'chatgpt' ? darkChatgpt : darkDefault}`

  const bgLengthClass =
    variant === 'chatgpt' ? 'bg-[length:400%_200%]' : 'bg-[length:300%_500%]'

  return (
    <div className='flex items-center justify-center'>
      <motion.div
        className='relative py-2 overflow-hidden'
        initial={{opacity: 0, y: 0}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 4.5}}>
        <motion.h1
          className={cn(
            'text-xl font-semibold tracking-tight bg-clip-text text-transparent',
            gradientClass,
            bgLengthClass,
            className,
          )}
          initial={{
            backgroundPosition:
              variant === 'chatgpt' ? '400% center' : '100% center',
          }}
          animate={controls}
          onHoverStart={playOnHover ? () => setIsHovered(true) : undefined}
          onHoverEnd={playOnHover ? () => setIsHovered(false) : undefined}
          onClick={playOnClick ? () => setIsClicked((p) => !p) : undefined}
          onKeyDown={
            playOnClick
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsClicked((p) => !p)
                  }
                }
              : undefined
          }
          role={isInteractive ? 'button' : undefined}
          tabIndex={isInteractive ? 0 : undefined}
          aria-pressed={playOnClick ? isClicked : undefined}
          aria-busy={loading || undefined}
          aria-live={loading ? 'polite' : undefined}>
          {text}
          {children}
        </motion.h1>
      </motion.div>
    </div>
  )
}
