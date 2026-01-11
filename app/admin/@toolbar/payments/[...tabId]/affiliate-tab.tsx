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

const AffiliateTabInner = () => {
  const affiliates = useQuery(api.affiliateAccounts.q.listAffiliates)
  const [tabId] = useAdminTabId()
  const isAffiliateRoute =
    tabId === 'affiliate' || tabId?.startsWith('affiliate')

  return (
    <>
      <MainTab href='/admin/payments/paygate'>
        <PageTitle>PayGate</PageTitle>
      </MainTab>
      <MainTab href='/admin/payments/paygate?tabId=affiliate'>
        <PageTitle>Affiliates</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            'bg-sidebar/50 dark:bg-white text-indigo-500',
          )}>
          <AnimatedNumber value={affiliates?.length ?? 0} />
        </span>
      </MainTab>
      {isAffiliateRoute && (
        <ToolbarButtonWrapper>
          <SecondaryTab
            id='accounts'
            icon='wallet'
            label='Accounts'
            href='/admin/payments/paygate?tabId=affiliate'
          />
          <PrimaryTab
            id='new'
            icon='plus'
            label='New'
            href='/admin/payments/paygate?tabId=affiliate&subTabId=new'
          />
        </ToolbarButtonWrapper>
      )}
    </>
  )
}

export const AffiliateTab = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <AffiliateTabInner />
    </Suspense>
  )
}
