'use client'

import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {
  PrimaryTab,
  ToolbarButtonWrapper,
  ToolbarWrapper,
} from '../../components'

export const AnalyticsTabContent = () => {
  const stats = useQuery(api.logs.q.getVisitStats, {})

  return (
    <ToolbarWrapper>
      <Link
        href='/admin/reports/analytics'
        className='flex items-center w-full space-x-4'>
        <PageTitle>Visitor Logs</PageTitle>
        {stats ? (
          <div className='w-6 flex items-center justify-center aspect-square bg-neutral-200/0 rounded-md font-space'>
            <AnimatedNumber value={stats?.totalVisits ?? 0} />
          </div>
        ) : (
          <Icon name='spinners-ring' className='size-4' />
        )}
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
    </ToolbarWrapper>
  )
}
