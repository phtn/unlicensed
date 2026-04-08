'use client'

import {cn} from '@/lib/utils'
import {usePathname} from 'next/navigation'
import {NuqsAdapter} from 'nuqs/adapters/next/app'
import type {ReactNode} from 'react'
import {RouteProtection} from '../_components/route-protection'
import {UserRequiredGuard} from '../_components/user-required-guard'

type AccountLayoutProps = {
  children: ReactNode
}

export default function AccountLayout({children}: AccountLayoutProps) {
  const pathname = usePathname()
  const isChatRoute = pathname.startsWith('/account/chat')

  return (
    <NuqsAdapter>
    <RouteProtection>
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
    </RouteProtection>
    </NuqsAdapter>
  )
}
