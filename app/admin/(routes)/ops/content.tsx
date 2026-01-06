'use client'

import {api} from '@/convex/_generated/api'
import {useBreakpoint} from '@/hooks/use-breakpoint'
import {useMobile} from '@/hooks/use-mobile'
import {useToggle} from '@/hooks/use-toggle'
import {useQuery} from 'convex/react'
import {Suspense, useState} from 'react'
import {RecentActivities} from './recent-activities'
import {Stats} from './stats'

export const Content = () => {
  const isMobile = useMobile()
  const breakpoint = useBreakpoint()
  const adminStats = useQuery(api.orders.q.getAdminStats)
  const chartData = useQuery(api.orders.q.getAdminChartData)
  const [visibleStatsCount, setVisibleStatsCount] = useState(0)
  const [statsHeight, setStatsHeight] = useState(0)

  const defaultStats = {
    salesTodayCents: 0,
    salesThisWeekCents: 0,
    salesThisMonthCents: 0,
    totalRevenueCents: 0,
    pendingOrdersCount: 0,
    cancelledOrdersCount: 0,
    ongoingDeliveriesCount: 0,
    deliveredOrdersCount: 0,
    totalOrdersCount: 0,
    totalUsersCount: 0,
    totalProductsCount: 0,
    averageOrderValueCents: 0,
  }

  const {on: fullTable, toggle: toggleFullTable} = useToggle()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className='md:px-4'>
        <div className='space-y-4'>
          <Stats
            stats={adminStats ?? defaultStats}
            salesData={chartData?.salesData}
            ordersData={chartData?.ordersData}
            deliveriesData={chartData?.deliveriesData}
            aovData={chartData?.aovData}
            fullTable={fullTable}
            onVisibleStatsChange={setVisibleStatsCount}
            onStatsHeightChange={setStatsHeight}
          />
          <RecentActivities
            fullTable={fullTable}
            toggleFullTable={toggleFullTable}
            isMobile={isMobile}
            visibleStatsCount={visibleStatsCount}
            breakpoint={breakpoint}
            statsHeight={statsHeight}
          />
        </div>
      </main>
    </Suspense>
  )
}
