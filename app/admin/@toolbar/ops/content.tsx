'use client'

import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {Suspense} from 'react'
import {PageTitle} from '../../_components/ui/page-title'
import {SecondaryTab, ToolbarWrapper} from '../components'

const ToolbarTabs = () => {
  return (
    <div className='flex items-center space-x-1 md:space-x-4 text-base'>
      <SecondaryTab
        id='stats'
        href='/admin/ops/stats'
        label='Stats'
        icon='toggle-off-sm'
      />
      {/*<PrimaryTab id='new' href={newHref} icon='plus' label='New' />*/}
    </div>
  )
}

export const OpsContent = () => {
  const orders = useQuery(api.orders.q.getRecentOrders, {limit: 50})
  const pathname = usePathname()
  const route = pathname.split('/').pop()
  // For ops, we still use pathname since it navigates to different routes
  // But we can use tabId for consistency if needed in the future
  const isOpsRoute = route === 'ops' || pathname === '/admin/ops'

  return (
    <ToolbarWrapper>
      <Link
        href='/admin/ops'
        prefetch
        className='flex items-center space-x-4 group'>
        <PageTitle>
          {route === 'ops'
            ? 'Activity'
            : pathname.includes('customers')
              ? 'Customers'
              : route}
        </PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            {
              'bg-blue-500 dark:bg-blue-500 text-white': isOpsRoute,
              'w-8': (orders?.length ?? 0) > 19,
            },
          )}>
          <AnimatedNumber value={orders?.length ?? 0} />
        </span>
      </Link>
      <Suspense
        fallback={
          <div className='flex items-center space-x-1 md:space-x-4 px-4 text-base' />
        }>
        <ToolbarTabs />
      </Suspense>
    </ToolbarWrapper>
  )
}
