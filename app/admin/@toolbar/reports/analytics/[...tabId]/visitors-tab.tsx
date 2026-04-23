'use client'

import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Suspense} from 'react'
import {AnalyticsToolbarTabs} from '../analytics-tabs'

const VisitorsInner = () => {
  const visitors = useQuery(api.guestTracking.q.getRecentVisitors, {
    limit: 500,
  })
  const [tabId] = useAdminTabId()
  const isVisitorsRoute = tabId === 'visitors'

  return (
    <>
      <Link
        href='/admin/reports/analytics?tabId=visitors'
        prefetch
        className='flex items-center space-x-4 group'
      >
        <PageTitle>Visitors</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            {
              'bg-blue-500 dark:bg-blue-500 text-white': isVisitorsRoute,
            },
          )}
        >
          <AnimatedNumber value={visitors?.length ?? 0} />
        </span>
      </Link>
      <AnalyticsToolbarTabs />
    </>
  )
}

export const VisitorsTab = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }
    >
      <VisitorsInner />
    </Suspense>
  )
}
