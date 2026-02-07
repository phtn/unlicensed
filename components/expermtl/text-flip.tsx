'use client'

import {useEffect, useId, useMemo, useRef, useState} from 'react'

import {cn} from '@/lib/utils'
import {AnimatePresence, motion} from 'motion/react'

export type TextFlipDirection = 'horizontal' | 'vertical'

export interface CTextFlipProps {
  /** Array of words to cycle through in the animation */
  words?: string[]
  /** Time in milliseconds between word transitions */
  interval?: number
  /** Additional CSS classes to apply to the container */
  className?: string
  /** Additional CSS classes to apply to the text */
  textClassName?: string
  /** Duration of the transition animation in milliseconds */
  animationDuration?: number
  /** Transition direction: width-based (horizontal) or height-based slide (vertical) */
  direction?: TextFlipDirection
}

const transitionDuration = (ms: number) => ms / 1000

export const CTextFlip = ({
  words = ['better', 'modern', 'beautiful', 'awesome'],
  interval = 6000,
  className,
  textClassName,
  animationDuration = 700,
  direction = 'horizontal',
}: CTextFlipProps) => {
  const id = useId()
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(24)
  const textRef = useRef<HTMLDivElement>(null)

  const updateSizeForWord = () => {
    if (textRef.current) {
      setWidth(textRef.current.scrollWidth + 30)
      setHeight(textRef.current.scrollHeight)
    }
  }

  useEffect(() => {
    updateSizeForWord()
  }, [currentWordIndex])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, interval)

    return () => clearInterval(intervalId)
  }, [words, interval])

  const currentKey = useMemo(
    () => words[currentWordIndex],
    [words, currentWordIndex],
  )
  const isVertical = direction === 'vertical'

  return (
    <motion.div
      layout
      layoutId={`words-here-${id}`}
      animate={isVertical ? {width, height} : {width}}
      transition={{duration: transitionDuration(animationDuration) / 2}}
      className={cn(
        'relative inline-block overflow-hidden rounded-lg tracking-tight text-center text-4xl font-tek font-bold text-background',
        isVertical && 'flex flex-col justify-center',
        '_[background:linear-gradient(to_bottom,#f3f4f6,#e5e7eb)]',
        '_shadow-[inset_0_-1px_#d1d5db,inset_0_0_0_1px_#d1d5db,_0_4px_8px_#d1d5db]',
        '_dark:[background:linear-gradient(to_bottom,#374151,#1f2937)]',
        '_dark:shadow-[inset_0_-1px_#10171e,inset_0_0_0_1px_hsla(205,89%,46%,.24),_0_4px_8px_#00000052]',
        'drop-shadow-xs bg-linear-120',
        className,
      )}
      key={isVertical ? undefined : currentKey}>
      {isVertical ? (
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={words[currentWordIndex]}
            ref={textRef}
            initial={{y: 24, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: -24, opacity: 0}}
            transition={{
              duration: transitionDuration(animationDuration),
              ease: 'easeInOut',
            }}
            className={cn('inline-block', textClassName)}
            layoutId={undefined}>
            {words[currentWordIndex].split('').map((letter, index) => (
              <motion.span
                key={index}
                initial={{opacity: 0, filter: 'blur(6px)'}}
                animate={{opacity: 1, filter: 'blur(0px)'}}
                transition={{delay: index * 0.03}}>
                {letter}
              </motion.span>
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <motion.div
          transition={{
            duration: transitionDuration(animationDuration),
            ease: 'easeInOut',
          }}
          className={cn('inline-block', textClassName)}
          ref={textRef}
          layoutId={`word-div-${words[currentWordIndex]}-${id}`}>
          <motion.div className='inline-block'>
            {words[currentWordIndex].split('').map((letter, index) => (
              <motion.span
                key={index}
                initial={{opacity: 0, filter: 'blur(6px)'}}
                animate={{opacity: 1, filter: 'blur(0px)'}}
                transition={{delay: index * 0.03}}>
                {letter}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

export const TextFlip = ({
  words = ['better', 'modern', 'beautiful', 'awesome'],
  interval = 6000,
  className,
  textClassName,
  animationDuration = 700,
  direction = 'horizontal',
}: CTextFlipProps) => {
  const id = useId()
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [width, setWidth] = useState(100)
  const [height, setHeight] = useState(24)
  const textRef = useRef<HTMLDivElement>(null)

  const updateSizeForWord = () => {
    if (textRef.current) {
      setWidth(textRef.current.scrollWidth + 30)
      setHeight(textRef.current.scrollHeight)
    }
  }

  useEffect(() => {
    updateSizeForWord()
  }, [currentWordIndex])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length)
    }, interval)

    return () => clearInterval(intervalId)
  }, [words, interval])

  const isVertical = direction === 'vertical'

  return (
    <motion.div
      layout
      layoutId={`words-here-${id}`}
      animate={isVertical ? {height} : {width}}
      transition={{duration: transitionDuration(animationDuration) / 2}}
      className={cn(
        'relative inline-block overflow-hidden text-right rounded-lg _dark:bg-zinc-300 text-foreground',
        isVertical && 'flex flex-col justify-end',
        className,
      )}
      key={isVertical ? undefined : words[currentWordIndex]}>
      {isVertical ? (
        <AnimatePresence mode='wait' initial={false}>
          <motion.div
            key={words[currentWordIndex]}
            ref={textRef}
            initial={{y: 24, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            exit={{y: -24, opacity: 0}}
            transition={{
              duration: transitionDuration(animationDuration),
              ease: 'easeInOut',
            }}
            className={cn('inline-block', textClassName)}
            layoutId={undefined}>
            {words[currentWordIndex].split('').map((letter, index) => (
              <motion.span
                key={index}
                initial={{opacity: 0, filter: 'blur(2px)'}}
                animate={{opacity: 1, filter: 'blur(0px)'}}
                transition={{delay: index * 0.01}}>
                {letter}
              </motion.span>
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <motion.div
          transition={{
            duration: transitionDuration(animationDuration),
            ease: 'easeInOut',
          }}
          className={cn('inline-block', textClassName)}
          ref={textRef}
          layoutId={`word-div-${words[currentWordIndex]}-${id}`}>
          <motion.div className='inline-block'>
            {words[currentWordIndex].split('').map((letter, index) => (
              <motion.span
                key={index}
                initial={{opacity: 0, filter: 'blur(2px)'}}
                animate={{opacity: 1, filter: 'blur(0px)'}}
                transition={{delay: index * 0.01}}>
                {letter}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
