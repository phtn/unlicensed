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
        label: 'Activity 7d',
        value:
          activityStats === undefined
            ? '...'
            : String(activityStats.totalActivities),
        description:
          activityStats === undefined
            ? 'Recent operational activity'
            : `${activityStats.ordersCreated} orders created, ${activityStats.paymentsCompleted} payments completed`,
        toneClassName:
          'border-light-brand/20 bg-light-brand/10 text-light-brand dark:text-light-brand',
      },
    ]
  }, [activityStats, adminStats])

  return (
    <PanelContainer tabValue='overview'>
      <div className='grid sm:grid-cols-2'>
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
