'use client'

import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'
import {PanelContainer} from './panel-container'
import type {MonitorStat} from './types'

const ADMIN_STATS_ARGS = {}
const ACTIVITY_STATS_ARGS = {days: 7}

export const StatsGridPanel = ({enabled}: {enabled: boolean}) => {
  const adminStats = useQuery(
    api.orders.q.getAdminStats,
    enabled ? ADMIN_STATS_ARGS : 'skip',
  )
  const activityStats = useQuery(
    api.activities.q.getActivityStats,
    enabled ? ACTIVITY_STATS_ARGS : 'skip',
  )

  const stats = useMemo<MonitorStat[]>(() => {
    const deliveredLabel =
      adminStats === undefined
        ? 'Loading'
        : `${adminStats.deliveredOrdersCount}/${adminStats.totalOrdersCount}`
    const cancelledLabel =
      adminStats === undefined ? '...' : String(adminStats.cancelledOrdersCount)
    const totalOrdersLabel =
      adminStats === undefined ? '...' : String(adminStats.totalOrdersCount)
    const activityValue =
      activityStats === undefined ? '...' : String(activityStats.totalActivities)

    return [
      {
        label: 'Pending Orders',
        value:
          adminStats === undefined
            ? '...'
            : String(adminStats.pendingOrdersCount),
        description: 'Orders waiting for payment or action',
        toneClassName:
          'border-orange-500/20 bg-orange-500/10 dark:bg-orange-800/10 text-orange-700 dark:text-orange-200',
      },
      {
        label: 'Total Orders',
        value: totalOrdersLabel,
        description:
          adminStats === undefined
            ? 'All recorded orders'
            : `${cancelledLabel} cancelled orders`,
        toneClassName:
          'border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-200',
      },
      {
        label: 'Revenue Today',
        value:
          adminStats === undefined
            ? '...'
            : formatPrice(adminStats.salesTodayCents),
        description: 'Completed payments since local midnight',
        toneClassName:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      },
      {
        label: 'Revenue Week',
        value:
          adminStats === undefined
            ? '...'
            : formatPrice(adminStats.salesThisWeekCents),
        description: 'Completed payments this week',
        toneClassName:
          'border-lime-500/20 bg-lime-500/10 text-lime-700 dark:text-lime-300',
      },
      {
        label: 'Revenue Month',
        value:
          adminStats === undefined
            ? '...'
            : formatPrice(adminStats.salesThisMonthCents),
        description: 'Completed payments this month',
        toneClassName:
          'border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300',
      },
      {
        label: 'Total Revenue',
        value:
          adminStats === undefined
            ? '...'
            : formatPrice(adminStats.totalRevenueCents),
        description: 'Completed payments across all orders',
        toneClassName:
          'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300',
      },
      {
        label: 'Avg Order',
        value:
          adminStats === undefined
            ? '...'
            : formatPrice(adminStats.averageOrderValueCents),
        description: 'Average value across recorded orders',
        toneClassName:
          'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300',
      },
      {
        label: 'Deliveries',
        value: deliveredLabel,
        description:
          adminStats === undefined
            ? 'Delivered vs total orders'
            : `${adminStats.ongoingDeliveriesCount} ongoing deliveries`,
        toneClassName:
          'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
      },
      {
        label: 'Customers',
        value:
          adminStats === undefined
            ? '...'
            : String(adminStats.totalUsersCount),
        description: 'Registered customer accounts',
        toneClassName:
          'border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
      },
      {
        label: 'Products',
        value:
          adminStats === undefined
            ? '...'
            : String(adminStats.totalProductsCount),
        description: 'Products in the catalog',
        toneClassName:
          'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
      },
      {
        label: 'Activity 7d',
        value: activityValue,
        description:
          activityStats === undefined
            ? 'Recent operational activity'
            : `${activityStats.ordersCreated} orders created, ${activityStats.paymentsCompleted} payments completed`,
        toneClassName:
          'border-light-brand/20 bg-light-brand/10 text-light-brand dark:text-light-brand',
      },
      {
        label: 'Signups 7d',
        value:
          activityStats === undefined
            ? '...'
            : String(activityStats.userSignups),
        description: 'New customer activity records',
        toneClassName:
          'border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
      },
      {
        label: 'Delivered 7d',
        value:
          activityStats === undefined
            ? '...'
            : String(activityStats.ordersDelivered),
        description: 'Delivery completion activity records',
        toneClassName:
          'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
      },
    ]
  }, [activityStats, adminStats])

  return (
    <PanelContainer tabValue='overview'>
      <div className='grid sm:grid-cols-2 lg:grid-cols-3'>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              'border border-border/60 bg-background/75 p-2',
              stat.toneClassName,
            )}>
            <div
              className={cn(
                'flex items-center space-x-3 px-2.5 text-[11px] font-medium',
              )}>
              <p className='font-clash text-xl tracking-tight dark:text-white'>
                {stat.value}
              </p>
              <span>{stat.label}</span>
            </div>

            <p className='mt-1 text-xs leading-5 text-muted-foreground'>
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </PanelContainer>
  )
}
