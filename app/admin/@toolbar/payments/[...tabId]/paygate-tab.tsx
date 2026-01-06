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

const PayGateTabInner = () => {
  const accounts = useQuery(api.paygateAccounts.q.listAccounts)
  const [tabId] = useAdminTabId()
  const isPayGateRoute =
    tabId === 'paygate' ||
    !tabId ||
    (tabId !== 'affiliate' &&
      !tabId.startsWith('affiliate') &&
      tabId !== 'utilities' &&
      !tabId.startsWith('utilities'))

  return (
    <>
      <MainTab href='/admin/payments/paygate'>
        <PageTitle>PayGate</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            {
              'bg-sidebar/50 dark:bg-white text-indigo-500': isPayGateRoute,
            },
          )}>
          <AnimatedNumber value={accounts?.length ?? 0} />
        </span>
      </MainTab>
      {isPayGateRoute && (
        <ToolbarButtonWrapper>
          <SecondaryTab
            id='utilities'
            icon='bolt'
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
      )}
    </>
  )
}

export const PayGateTab = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <PayGateTabInner />
    </Suspense>
  )
}
