'use client'

import {api} from '@/convex/_generated/api'
import {useToggle} from '@/hooks/use-toggle'
import {useQuery} from 'convex/react'
import {RecentActivities} from './_components/recent-activities'
import {Stats} from './_components/stats'

export const Content = () => {
  const adminStats = useQuery(api.orders.q.getAdminStats)
  const chartData = useQuery(api.orders.q.getAdminChartData)

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
    <main className='px-4'>
      <div className='space-y-4'>
        <Stats
          stats={adminStats ?? defaultStats}
          salesData={chartData?.salesData}
          ordersData={chartData?.ordersData}
          deliveriesData={chartData?.deliveriesData}
          aovData={chartData?.aovData}
          fullTable={fullTable}
        />
        <RecentActivities
          fullTable={fullTable}
          toggleFullTable={toggleFullTable}
        />
      </div>
    </main>
  )
}
