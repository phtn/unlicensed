'use client'

import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {useGuestChatCtx} from '@/ctx/guest-chat'
import {useWindow} from '@/hooks/use-window'
import {CHAT_DOCK_OPEN_EVENT, CHAT_DOCK_TOGGLE_EVENT} from '@/lib/chat-dock'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Badge, Tooltip} from '@heroui/react'
import {useQuery} from 'convex/react'
import dynamic from 'next/dynamic'
import {usePathname} from 'next/navigation'
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
    <div className='fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-9100 h-[min(700px,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-5rem))] max-h-[700.01px] min-h-48 w-[min(calc(100vw-2.5rem),34rem)] md:right-8 md:bottom-[calc(env(safe-area-inset-bottom)+8rem)] md:h-[min(700px,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-7rem))] md:w-[min(calc(100vw-4rem),34rem)] min-[384px]:min-w-[21.51rem] rounded-3xl border border-sidebar/50 bg-background/95 shadow-2xl backdrop-blur-xl'>
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
  const pathname = usePathname()
  const {user} = useAuthCtx()
  const guestChat = useGuestChatCtx()
  const isHidden = hidden || pathname.includes('/cashapp')
  const [isWindowOpen, setIsWindowOpen] = useState(false)
  const [hasOpenedWindow, setHasOpenedWindow] = useState(false)
  const [conversationFid, setConversationFid] = useState<string | null>(null)
  const [conversationSelectionKey, setConversationSelectionKey] = useState(0)
  const guestParticipant = useQuery(
    api.guests.q.getByGuestId,
    !user?.uid && guestChat.guestId ? {guestId: guestChat.guestId} : 'skip',
  )
  const unreadFid = user?.uid ?? guestChat.guestFid ?? guestParticipant?.fid
  const unreadCount = useQuery(
    api.messages.q.getUnreadCount,
    unreadFid ? {fid: unreadFid} : 'skip',
  )

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      setHasOpenedWindow(true)
    } else {
      setConversationFid(null)
    }
    setIsWindowOpen(open)
  }, [])

  const {open, toggle} = useWindow({
    isOpen: isWindowOpen,
    onOpenChange: handleOpenChange,
    hotkey: 'k',
  })

  useEffect(() => {
    const handleToggle = () => {
      toggle()
    }
    const handleOpen = (event: Event) => {
      const customEvent = event as CustomEvent<{
        conversationFid?: string | null
      }>
      setConversationFid(customEvent.detail?.conversationFid ?? null)
      setConversationSelectionKey((current) => current + 1)
      open()
    }

    window.addEventListener(CHAT_DOCK_TOGGLE_EVENT, handleToggle)
    window.addEventListener(CHAT_DOCK_OPEN_EVENT, handleOpen)
    return () => {
      window.removeEventListener(CHAT_DOCK_TOGGLE_EVENT, handleToggle)
      window.removeEventListener(CHAT_DOCK_OPEN_EVENT, handleOpen)
    }
  }, [open, toggle])

  useEffect(() => {
    if (isHidden) return

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
  }, [isHidden])

  const navs = useMemo<DockNav[]>(
    () => [
      {
        id: 'chat',
        label: 'Chat',
        icon: 'message-filled',
        onClick: toggle,
      },
    ],
    [toggle],
  )

  return (
    <>
      {hasOpenedWindow && (
        <ChatWindow
          open={isWindowOpen}
          onOpenChange={handleOpenChange}
          conversationFid={conversationFid}
          conversationSelectionKey={conversationSelectionKey}
        />
      )}

      {!isHidden && (
        <div className='pointer-events-none fixed bottom-4 right-4 z-9000 md:bottom-8 md:right-8'>
          <Dock
            direction='middle'
            className='pointer-events-auto bg-sidebar/90 dark:bg-dark-table/20 backdrop-blur-2xl flex items-center'>
            {navs.map((nav) => (
              <Tooltip
                key={nav.id}
                content={isWindowOpen ? 'Minimize' : 'Open Chat'}
                offset={14}
                radius='none'
                className='rounded-lg bg-dark-table text-white'>
                <DockIcon>
                  <Badge
                    size='sm'
                    key={`chat-dock-badge-${unreadCount ?? 0}`}
                    content={
                      (unreadCount ?? 0) > 0 ? (
                        <span className='font-clash font-medium text-white leading-none'>
                          {(unreadCount ?? 0) > 99 ? '99+' : unreadCount}
                        </span>
                      ) : undefined
                    }
                    isInvisible={(unreadCount ?? 0) === 0}
                    classNames={{
                      badge:
                        'absolute top-1 right-1 min-w-5 h-5 w-auto flex items-center justify-center aspect-square rounded-full border-1 border-foreground shadow-sm bg-brand',
                    }}>
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
                        'flex size-full items-center justify-center bg-transparent! mt-1.5',
                        isWindowOpen && 'bg-dark-table/10',
                      )}>
                      <Icon name={nav.icon} className='size-7' />
                    </button>
                  </Badge>
                </DockIcon>
              </Tooltip>
            ))}
          </Dock>
        </div>
      )}
    </>
  )
}
