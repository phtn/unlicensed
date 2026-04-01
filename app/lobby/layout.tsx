import {NewFooter} from '@/components/main/new-footer'
import {NuqsAdapter} from 'nuqs/adapters/next/app'
import {Suspense, type ReactNode} from 'react'
import {LobbyClientChrome} from './_components/lobby-client-chrome'

type LobbyLayoutProps = {
  children: ReactNode
  navbar?: ReactNode
}

export default function LobbyLayout({children, navbar}: LobbyLayoutProps) {
  return (
    <NuqsAdapter>
      <div suppressHydrationWarning className='flex min-h-screen flex-col'>
        {navbar}
        <main className='relative flex-1'>
          <Suspense fallback={null}>{children}</Suspense>
          <LobbyClientChrome />
        </main>
        <NewFooter />
      </div>
    </NuqsAdapter>
  )
}
