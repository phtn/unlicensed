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
  const paygateAccounts = useQuery(api.paygateAccounts.q.listAccounts)
  const [tabId] = useAdminTabId()

  // Determine which tab is active
  const isPayGateRoute =
    tabId !== 'affiliate' && !tabId?.startsWith('affiliate')

  return (
    <>
      {/* PayGate Tab */}
      <MainTab href='/admin/payments'>
        <PageTitle>PayGate</PageTitle>

        <div
          className={cn(
            'px-1 h-5.5 md:h-6 flex items-center justify-center w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            {
              'bg-sidebar/50 dark:bg-white/5 dark:text-indigo-400 text-indigo-500':
                isPayGateRoute,
            },
          )}>
          <AnimatedNumber value={paygateAccounts?.length ?? 0} />
        </div>
      </MainTab>

      {/* Buttons on the right - show based on active tab */}
      <ToolbarButtonWrapper>
        <SecondaryTab
          id='utilities'
          icon='cloud'
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
