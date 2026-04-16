'use client'

import {cn} from '@/lib/utils'
import {usePathname} from 'next/navigation'
import {NuqsAdapter} from 'nuqs/adapters/next/app'
import type {ReactNode} from 'react'
import {UserRequiredGuard} from '../../_components/user-required-guard'

// RouteProtection (PIN gate) is intentionally NOT used here.
// The /account route is for authenticated users only — access is enforced by:
//   1. Server layout: getFirebaseServerSession() → redirect('/lobby') if no session
//   2. UserRequiredGuard: client-side Firebase auth state check
// The rf-ac PIN cookie is a lobby/store gate and has no role in account access.

type AccountClientLayoutProps = {
  children: ReactNode
}

export function AccountClientLayout({children}: AccountClientLayoutProps) {
  const pathname = usePathname()
  const isChatRoute = pathname.startsWith('/account/chat')

  return (
    <NuqsAdapter>
      <UserRequiredGuard>
        <div className='min-h-dvh overflow-x-hidden bg-white dark:bg-black'>
          <div
            className={cn(
              'mx-auto 2xl:max-w-7xl [--account-navbar-offset:3.5rem] lg:[--account-navbar-offset:4rem] xl:[--account-navbar-offset:5rem] 2xl:[--account-navbar-offset:6rem]',
              isChatRoute
                ? 'mt-(--account-navbar-offset) h-[calc(100dvh-var(--account-navbar-offset))] overflow-hidden'
                : 'mt-(--account-navbar-offset) min-h-[calc(100dvh-var(--account-navbar-offset))]',
            )}>
            {children}
          </div>
        </div>
      </UserRequiredGuard>
    </NuqsAdapter>
  )
}
