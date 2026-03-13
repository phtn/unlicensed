'use client'

import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Suspense} from 'react'
import {PrimaryTab, ToolbarButtonWrapper} from '../../../components'

const GeoInner = () => {
  const stats = useQuery(api.logs.q.getVisitStats, {})
  const [tabId] = useAdminTabId()
  const isGeoRoute = tabId === 'geo'

  return (
    <>
      <Link
        href='/admin/reports/analytics?tabId=geo'
        prefetch
        className='flex items-center space-x-4 group'>
        <PageTitle>Geo</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            {'bg-emerald-500 dark:bg-emerald-500 text-white': isGeoRoute},
          )}>
          <AnimatedNumber value={stats?.totalVisits ?? 0} />
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
        <PrimaryTab
          id='geo'
          href='/admin/reports/analytics?tabId=geo'
          icon='globe-light'
          label='Geo'
        />
      </ToolbarButtonWrapper>
    </>
  )
}

export const GeoTab = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <GeoInner />
    </Suspense>
  )
}
