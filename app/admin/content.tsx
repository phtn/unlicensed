'use client'

import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {Stats} from './_components/stats'
import {RecentActivities} from './_components/recent-activities'

export const Content = () => {
  const adminStats = useQuery(api.orders.q.getAdminStats)
  const chartData = useQuery(api.orders.q.getAdminChartData)

  return (
    <main className='min-h-screen px-4 pb-16'>
      <div className='space-y-6'>
        <Stats
          salesTodayCents={adminStats?.salesTodayCents ?? 0}
          pendingOrdersCount={adminStats?.pendingOrdersCount ?? 0}
          ongoingDeliveriesCount={adminStats?.ongoingDeliveriesCount ?? 0}
          deliveredOrdersCount={adminStats?.deliveredOrdersCount ?? 0}
          totalOrdersCount={adminStats?.totalOrdersCount ?? 0}
          salesData={chartData?.salesData}
          ordersData={chartData?.ordersData}
          deliveriesData={chartData?.deliveriesData}
        />
        <RecentActivities />
      </div>
    </main>
  )
}
