'use client'

import {PrimaryTab, ToolbarButtonWrapper} from '@/app/admin/@toolbar/components'
import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Suspense} from 'react'

const InsightsInner = () => {
  const stats = useQuery(api.logs.q.getVisitStats, {})
  const uniqueVisitors = stats?.uniqueVisitors ?? 0

  return (
    <>
      <Link
        href='/admin/reports/analytics?tabId=insights'
        prefetch
        className='flex items-center space-x-4 group'>
        <PageTitle>Insights</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-10 text-center dark:bg-dark-gray/40 bg-dark-gray/10 rounded-md font-space font-semibold text-white',
          )}>
          <AnimatedNumber value={uniqueVisitors} />
        </span>
      </Link>
      <ToolbarButtonWrapper>
        <PrimaryTab
          id='logs'
          href='/admin/reports/analytics?tabId=logs'
          icon='eye'
          label='Logs'
        />
        <PrimaryTab
          id='insights'
          href='/admin/reports/analytics?tabId=insights'
          icon='strength'
          label='Insights'
        />
      </ToolbarButtonWrapper>
    </>
  )
}

export const InsightsTab = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <InsightsInner />
    </Suspense>
  )
}
