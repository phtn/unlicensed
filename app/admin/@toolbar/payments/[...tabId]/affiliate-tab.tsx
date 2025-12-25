'use client'

import {
  SecondaryTab,
  ToolbarButtonWrapper,
} from '@/app/admin/@toolbar/components'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Suspense} from 'react'

const AffiliateTabInner = () => {
  const affiliates = useQuery(api.affiliateAccounts.q.listAffiliates)
  const [tabId] = useAdminTabId()
  const isAffiliateRoute = tabId === 'affiliate' || tabId?.startsWith('affiliate')

  return (
    <>
      <Link
        href='/admin/payments?tabId=affiliate'
        prefetch
        className='flex items-center space-x-4 group'>
        <span
          className={cn(
            'group-hover:underline underline-offset-4 decoration-dashed decoration-[0.5px] tracking-tighter font-medium',
            {
              'underline decoration-indigo-500': isAffiliateRoute,
            },
          )}>
          Affiliate
        </span>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            {
              'bg-indigo-500 dark:bg-indigo-500 text-white': isAffiliateRoute,
            },
          )}>
          <AnimatedNumber value={affiliates?.length ?? 0} />
        </span>
      </Link>
      {isAffiliateRoute && (
        <ToolbarButtonWrapper>
          <SecondaryTab
            id='new'
            icon='plus'
            label='New Affiliate'
            href='/admin/payments?tabId=affiliate&subTabId=new'
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

