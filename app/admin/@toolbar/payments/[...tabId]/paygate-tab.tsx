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
import {AffiliateTab} from './affiliate-tab'

const PayGateTabInner = () => {
  const accounts = useQuery(api.paygateAccounts.q.listAccounts, {
    gateway: 'paygate',
  })
  // const isPayGateRoute =
  //   tabId === 'paygate' ||
  //   !tabId ||
  //   (tabId !== 'affiliate' &&
  //     !tabId.startsWith('affiliate') &&
  //     tabId !== 'utilities' &&
  //     !tabId.startsWith('utilities'))

  return (
    <>
      <MainTab href='/admin/payments/paygate'>
        <PageTitle>PayGate</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            'bg-sidebar/50 dark:bg-sidebar/40 text-indigo-500',
          )}>
          <AnimatedNumber value={accounts?.length ?? 0} />
        </span>
      </MainTab>
      <ToolbarButtonWrapper>
        <SecondaryTab
          id='utilities'
          icon='bolt'
          label='Utilities'
          href='/admin/payments/paygate?tabId=utilities'
        />
        <SecondaryTab
          id='affiliate'
          icon='user'
          label='Affiliates'
          href='/admin/payments/paygate?tabId=affiliate'
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

export const PayGateTab = () => {
  const [tabId] = useAdminTabId()

  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      {tabId === 'affiliate' || tabId?.startsWith('affiliate') ? (
        <AffiliateTab />
      ) : (
        <PayGateTabInner />
      )}
    </Suspense>
  )
}
