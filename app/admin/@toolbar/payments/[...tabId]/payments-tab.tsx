'use client'

import {
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
import Link from 'next/link'
import {Suspense} from 'react'

const PaymentsTabInner = () => {
  const paygateAccounts = useQuery(api.paygateAccounts.q.listAccounts)
  const [tabId] = useAdminTabId()

  // Determine which tab is active
  const isPayGateRoute =
    tabId !== 'affiliate' && !tabId?.startsWith('affiliate')

  return (
    <>
      {/* PayGate Tab */}
      <Link
        href='/admin/payments'
        prefetch
        className='flex items-center space-x-4 group'>
        <PageTitle>PayGate Accounts</PageTitle>

        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            {
              'bg-indigo-500 dark:bg-indigo-500 text-white': isPayGateRoute,
            },
          )}>
          <AnimatedNumber value={paygateAccounts?.length ?? 0} />
        </span>
      </Link>

      {/* Buttons on the right - show based on active tab */}
      <ToolbarButtonWrapper>
        <SecondaryTab
          id='utilities'
          icon='wrench'
          label='Utilities'
          href='/admin/payments/paygate?tabId=utilities'
        />
        <SecondaryTab
          id='affiliate'
          icon='plus'
          label='Affiliate'
          href='/admin/payments/paygate?tabId=affiliate&subTabId=new'
        />
        <PrimaryTab
          id='new'
          icon='plus'
          label='Wallet'
          href='/admin/payments/paygate?tabId=new'
        />
      </ToolbarButtonWrapper>
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
