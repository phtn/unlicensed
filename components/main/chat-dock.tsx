'use client'

import {CHAT_DOCK_TOGGLE_EVENT} from '@/lib/chat-dock'
import {useWindow} from '@/hooks/use-window'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Tooltip} from '@heroui/react'
import dynamic from 'next/dynamic'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {Dock, DockIcon} from '../ui/dock'

const ChatWindow = dynamic(
  () => import('./chat-window').then((module) => module.ChatWindow),
  {ssr: false},
)

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
            className='pointer-events-auto bg-sidebar dark:bg-dark-table'>
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
                    aria-label={nav.label}
                    aria-haspopup='dialog'
                    aria-expanded={isWindowOpen}
                    className={cn(
                      'flex size-full items-center justify-center rounded-full transition-colors',
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
