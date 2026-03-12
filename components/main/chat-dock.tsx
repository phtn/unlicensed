'use client'

import {useWindow} from '@/hooks/use-window'
import {CHAT_DOCK_TOGGLE_EVENT} from '@/lib/chat-dock'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Tooltip} from '@heroui/react'
import dynamic from 'next/dynamic'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {Dock, DockIcon} from '../ui/dock'

const loadChatWindow = () =>
  import('./chat-window').then((module) => module.ChatWindow)

let chatWindowPreloadPromise: Promise<unknown> | null = null

const preloadChatWindow = () => {
  if (!chatWindowPreloadPromise) {
    chatWindowPreloadPromise = loadChatWindow()
  }
  return chatWindowPreloadPromise
}

const ChatWindow = dynamic(loadChatWindow, {
  ssr: false,
  loading: () => (
    <div className='fixed right-4 top-14 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-9100 w-[min(calc(100vw-2.5rem),34rem)] rounded-3xl border border-sidebar/50 bg-background/95 shadow-2xl backdrop-blur-xl md:right-8 md:bottom-[calc(env(safe-area-inset-bottom)+8rem)] lg:top-16 xl:top-20 2xl:top-24'>
      <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
        Loading chat...
      </div>
    </div>
  ),
})

interface DockNav {
  id: string
  onClick: VoidFunction
  icon: IconName
  label: string
}
interface ChatDockProps {
  hidden?: boolean
}

export const ChatDock = ({hidden = false}: ChatDockProps) => {
  const [isWindowOpen, setIsWindowOpen] = useState(false)
  const [hasOpenedWindow, setHasOpenedWindow] = useState(false)

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      setHasOpenedWindow(true)
    }
    setIsWindowOpen(open)
  }, [])

  const {toggle} = useWindow({
    isOpen: isWindowOpen,
    onOpenChange: handleOpenChange,
    hotkey: 'k',
  })

  useEffect(() => {
    const handleToggle = () => {
      toggle()
    }

    window.addEventListener(CHAT_DOCK_TOGGLE_EVENT, handleToggle)
    return () => {
      window.removeEventListener(CHAT_DOCK_TOGGLE_EVENT, handleToggle)
    }
  }, [toggle])

  useEffect(() => {
    if (hidden) return

    if (typeof window === 'undefined') return

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => {
        void preloadChatWindow()
      })

      return () => {
        window.cancelIdleCallback(idleId)
      }
    }

    const timeoutId = globalThis.setTimeout(() => {
      void preloadChatWindow()
    }, 1200)

    return () => {
      globalThis.clearTimeout(timeoutId)
    }
  }, [hidden])

  const navs = useMemo<DockNav[]>(
    () => [
      {
        id: 'chat',
        label: 'Chat',
        icon: 'chat',
        onClick: toggle,
      },
    ],
    [toggle],
  )

  return (
    <>
      {hasOpenedWindow && (
        <ChatWindow open={isWindowOpen} onOpenChange={handleOpenChange} />
      )}

      {!hidden && (
        <div className='pointer-events-none fixed bottom-4 right-4 z-9000 md:bottom-8 md:right-8'>
          <Dock
            direction='middle'
            className='pointer-events-auto bg-sidebar/90 dark:bg-dark-table/20 backdrop-blur-2xl'>
            {navs.map((nav) => (
              <Tooltip
                key={nav.id}
                content='Open Chat'
                offset={14}
                radius='none'
                className='rounded-lg bg-dark-table text-white'>
                <DockIcon>
                  <button
                    type='button'
                    onClick={nav.onClick}
                    onPointerEnter={() => {
                      void preloadChatWindow()
                    }}
                    onFocus={() => {
                      void preloadChatWindow()
                    }}
                    onTouchStart={() => {
                      void preloadChatWindow()
                    }}
                    aria-label={nav.label}
                    aria-haspopup='dialog'
                    aria-expanded={isWindowOpen}
                    className={cn(
                      'flex size-full items-center justify-center transition-colors',
                      isWindowOpen && 'bg-dark-table/10',
                    )}>
                    <Icon name={nav.icon} className='size-8' />
                  </button>
                </DockIcon>
              </Tooltip>
            ))}
          </Dock>
        </div>
      )}
    </>
  )
}
