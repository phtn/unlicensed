'use client'

import {ChatDock} from '@/components/main/chat-dock'
import {Footer} from '@/components/ui/footer'
import {NuqsAdapter} from 'nuqs/adapters/next/app'
import {usePathname} from 'next/navigation'
import type {ReactNode} from 'react'
import {RouteProtection} from '../_components/route-protection'

type LobbyLayoutProps = {
  children: ReactNode
  navbar?: ReactNode
}

export default function LobbyLayout({children, navbar}: LobbyLayoutProps) {
  const pathname = usePathname()
  const hideChatDock = pathname.includes('/cashapp')

  return (
    <RouteProtection>
      <NuqsAdapter>
        <div suppressHydrationWarning className='flex min-h-screen flex-col'>
          {navbar}
          <main className='relative flex-1'>
            {children}
            <ChatDock hidden={hideChatDock} />
          </main>
          <Footer />
        </div>
      </NuqsAdapter>
    </RouteProtection>
  )
}
