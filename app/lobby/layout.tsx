'use client'

import {ChatDock} from '@/components/main/chat-dock'
import {NewFooter} from '@/components/main/new-footer'
import {usePathname} from 'next/navigation'
import {NuqsAdapter} from 'nuqs/adapters/next/app'
import {Children, type ReactNode} from 'react'

type LobbyLayoutProps = {
  children: ReactNode
  navbar?: ReactNode
}

export default function LobbyLayout({children, navbar}: LobbyLayoutProps) {
  const pathname = usePathname()
  const hideChatDock = pathname.includes('/cashapp')
  const navbarChildren = Children.toArray(navbar)
  const mainChildren = Children.toArray(children)

  return (
    <NuqsAdapter>
      <div suppressHydrationWarning className='flex min-h-screen flex-col'>
        {navbarChildren}
        <main className='relative flex-1'>
          {mainChildren}
          <ChatDock hidden={hideChatDock} />
        </main>
        <NewFooter />
      </div>
    </NuqsAdapter>
  )
}
