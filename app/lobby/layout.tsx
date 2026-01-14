'use client'

import {Footer} from '@/components/ui/footer'
import {NuqsAdapter} from 'nuqs/adapters/next/app'
import {Suspense, type ReactNode} from 'react'
import {RouteProtection} from '../_components/route-protection'

type LobbyLayoutProps = {
  children: ReactNode
  navbar?: ReactNode
}

export default function LobbyLayout({children, navbar}: LobbyLayoutProps) {
  return (
    <RouteProtection>
      <NuqsAdapter>
        <Suspense>
          <div suppressHydrationWarning className='flex min-h-screen flex-col'>
            {navbar}
            <main className='relative flex-1'>{children}</main>
            <Footer />
          </div>
        </Suspense>
      </NuqsAdapter>
    </RouteProtection>
  )
}
