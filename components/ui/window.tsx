'use client'

import {type Keys, useWindow} from '@/hooks/use-window'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {AnimatePresence, motion} from 'motion/react'
import {ReactNode, useEffect, useId, useRef} from 'react'

interface DialogWindowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  hotkey?: Keys
  className?: string
  children: ReactNode
}

export const DialogWindow = ({
  open,
  onOpenChange,
  title,
  description,
  actions,
  hotkey,
  className,
  children,
}: DialogWindowProps) => {
  const {isOpen, close} = useWindow({
    isOpen: open,
    onOpenChange,
    hotkey,
  })

  const headingId = useId()
  const descriptionId = useId()
  const windowRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isOpen) return
    windowRef.current?.focus()
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.section
          ref={windowRef}
          tabIndex={-1}
          role='dialog'
          aria-modal='false'
          aria-labelledby={title ? headingId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          initial={{opacity: 0, y: 20, scale: 0.97}}
          animate={{opacity: 1, y: 0, scale: 1}}
          exit={{opacity: 0, y: 12, scale: 0.98}}
          transition={{duration: 0.2, ease: 'easeOut'}}
          className={cn(
            'fixed left-1/2 z-[9100] flex h-[min(70vh,36rem)] w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-sidebar/50 bg-background/95 shadow-2xl backdrop-blur-xl',
            'bottom-[calc(env(safe-area-inset-bottom)+5.5rem)]',
            className,
          )}
          style={{touchAction: 'manipulation'}}>
          {(title || description || actions) && (
            <header className='flex items-start justify-between gap-2 border-b border-sidebar/30 bg-background/80 px-3 py-2.5'>
              <div className='min-w-0 flex-1'>
                {title && (
                  <h2 id={headingId} className='truncate text-sm font-semibold'>
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id={descriptionId}
                    className='mt-0.5 truncate text-xs text-muted-foreground'>
                    {description}
                  </p>
                )}
              </div>

              <div className='flex items-center gap-1'>
                {actions}
                <button
                  type='button'
                  onClick={close}
                  className='rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-sidebar hover:text-foreground'
                  aria-label='Close chat window'>
                  <Icon name='x' className='size-4' />
                </button>
              </div>
            </header>
          )}

          <div className='min-h-0 flex-1'>{children}</div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
