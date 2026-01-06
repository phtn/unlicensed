'use client'

import {
  MainTab,
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
      <MainTab href='/admin/payments/paygate?tabId=affiliate'>
        <PageTitle>Affiliate</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            {
              'bg-indigo-500 dark:bg-indigo-500 text-white': isAffiliateRoute,
            },
          )}>
          <AnimatedNumber value={affiliates?.length ?? 0} />
        </span>
      </MainTab>
      {isAffiliateRoute && (
        <ToolbarButtonWrapper>
          <SecondaryTab
            id='new'
            icon='plus'
            label='New Affiliate'
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
