'use client'

import {
  MainTab,
  PrimaryTab,
  SecondaryTab,
  ToolbarButtonWrapper,
} from '@/app/admin/@toolbar/components'
import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'

const PaymentsTabInner = () => {
  return (
    <>
      {/* Payments Main Tab */}
      <MainTab href='/admin/payments'>
        <PageTitle>Payments</PageTitle>
      </MainTab>
    </>
  )
}

export const PaymentsTab = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <PaymentsTabInner />
    </Suspense>
  )
}
