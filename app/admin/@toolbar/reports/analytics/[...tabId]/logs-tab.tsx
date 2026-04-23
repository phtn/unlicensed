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

const LogsInner = () => {
  const pageViews = useQuery(api.guestTracking.q.getRecentEvents, {
    limit: 1,
    type: 'page_view',
  })
  const [tabId] = useAdminTabId()
  const isLogsRoute = tabId === 'logs' || !tabId

  return (
    <>
      <Link
        href='/admin/reports/analytics?tabId=logs'
        prefetch
        className='flex items-center space-x-4 group'
      >
        <PageTitle>Logs</PageTitle>

        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            {'bg-blue-500 dark:bg-blue-500 text-white': isLogsRoute},
          )}
        >
          <AnimatedNumber value={pageViews?.length ?? 0} />
        </span>
      </Link>
      <AnalyticsToolbarTabs />
    </>
  )
}

export const LogsTab = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }
    >
      <LogsInner />
    </Suspense>
  )
}
