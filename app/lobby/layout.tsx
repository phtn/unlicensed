'use client'

import {ChatDock} from '@/components/main/chat-dock'
import {NewFooter} from '@/components/main/new-footer'
import {usePathname} from 'next/navigation'
import {NuqsAdapter} from 'nuqs/adapters/next/app'
import type {ReactNode} from 'react'

type LobbyLayoutProps = {
  children: ReactNode
  navbar?: ReactNode
}

export default function LobbyLayout({children, navbar}: LobbyLayoutProps) {
  const pathname = usePathname()
  const hideChatDock = pathname.includes('/cashapp')

  return (
    <NuqsAdapter>
      <div suppressHydrationWarning className='flex min-h-screen flex-col'>
        {navbar}
        <main className='relative flex-1'>
          {children}
          <ChatDock hidden={hideChatDock} />
        </main>
        <NewFooter />
      </div>
    </NuqsAdapter>
  )
}
