'use client'

import {Icon} from '@/lib/icons'
import {useCallback, useEffect, useState} from 'react'
import {createPortal} from 'react-dom'

const SCROLL_THRESHOLD_PX = 1000
const VIEWPORT_SELECTOR = '[data-slot="scroll-area-viewport"]'

function getDistanceFromBottom(viewport: Element): number {
  const {scrollTop, scrollHeight, clientHeight} = viewport
  return scrollHeight - scrollTop - clientHeight
}

interface ScrollToBottomButtonProps {
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
  scrollButtonAnchorRef: React.RefObject<HTMLDivElement | null>
  onScrollToBottom: () => void
  scrollThreshold?: number
}

export function ScrollToBottomButton({
  scrollAreaRef,
  scrollButtonAnchorRef,
  onScrollToBottom,
  scrollThreshold = SCROLL_THRESHOLD_PX,
}: ScrollToBottomButtonProps) {
  const [showButton, setShowButton] = useState(false)

  const updateVisibility = useCallback(() => {
    if (!scrollAreaRef.current) return
    const viewport = scrollAreaRef.current.querySelector(VIEWPORT_SELECTOR)
    if (!viewport) return
    const distance = getDistanceFromBottom(viewport)
    setShowButton(distance >= scrollThreshold)
  }, [scrollAreaRef, scrollThreshold])

  useEffect(() => {
    if (!scrollAreaRef.current) return
    const viewport = scrollAreaRef.current.querySelector(VIEWPORT_SELECTOR)
    if (!viewport) return

    updateVisibility()
    viewport.addEventListener('scroll', updateVisibility, {passive: true})
    return () => viewport.removeEventListener('scroll', updateVisibility)
  }, [updateVisibility, scrollAreaRef])

  const handleClick = useCallback(() => {
    onScrollToBottom()
  }, [onScrollToBottom])

  const anchor = scrollButtonAnchorRef.current
  if (!showButton || !anchor) return null

  const button = (
    <div className='flex justify-center pb-2'>
      <button
        type='button'
        onClick={handleClick}
        className='flex items-center justify-center size-10 rounded-full bg-sidebar dark:bg-dark-table border border-border shadow-md hover:bg-sidebar/90 dark:hover:bg-dark-table/90 transition-colors active:scale-95'
        aria-label='Scroll to bottom'>
        <Icon name='chevron-down' className='size-5 text-foreground' />
      </button>
    </div>
  )

  return createPortal(button, anchor)
}
