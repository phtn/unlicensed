'use client'

import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {PrimaryTab, ToolbarButtonWrapper, ToolbarWrapper} from '../../components'

export const AnalyticsTabContent = () => {
  const stats = useQuery(api.logs.q.getVisitStats, {})
  
  return (
    <ToolbarWrapper>
      <Link
        href='/admin/reports/analytics'
        className='flex items-center w-full space-x-4'>
        <h1
          className={cn(
            'group-hover:underline underline-offset-4 decoration-dotted decoration-[0.5px] decoration-foreground/60 tracking-tighter font-medium text-base',
          )}>
          Analytics
        </h1>
        {stats ? (
          <div className='w-6 flex items-center justify-center aspect-square bg-neutral-200/40 rounded-md font-space'>
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

