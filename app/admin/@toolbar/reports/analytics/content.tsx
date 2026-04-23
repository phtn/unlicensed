'use client'

import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {ToolbarWrapper} from '../../components'
import {AnalyticsToolbarTabs} from './analytics-tabs'

export const AnalyticsTabContent = () => {
  const stats = useQuery(api.guestTracking.q.getVisitorStats, {})

  return (
    <ToolbarWrapper className='flex-wrap items-start gap-2 md:flex-nowrap md:items-center'>
      <Link
        href='/admin/reports/analytics'
        className='flex min-w-0 flex-1 items-center space-x-4'
      >
        <PageTitle>Visitor Logs</PageTitle>
        {stats ? (
          <div className='w-6 flex items-center justify-center aspect-square bg-neutral-200/0 rounded-md font-space'>
            <AnimatedNumber value={stats?.totalPageViews ?? 0} />
          </div>
        ) : (
          <Icon name='spinners-ring' className='size-4' />
        )}
      </Link>
      <AnalyticsToolbarTabs />
    </ToolbarWrapper>
  )
}
