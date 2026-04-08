'use client'

import {Loader} from '@/components/expermtl/loader'
import {useAccount} from '@/hooks/use-account'
import {Icon, IconName} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {ProfileCard} from './profile-card'
import {RecentOrders} from './recent-orders'
import {RewardPoints} from './reward-points'

type AccountData = ReturnType<typeof useAccount>

interface OverviewProps {
  user: AccountData['user']
  orders: AccountData['orders']
  pointsBalance: AccountData['pointsBalance']
  orderStats: AccountData['orderStats']
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export const Overview = ({
  user,
  orders,
  pointsBalance,
  orderStats,
}: OverviewProps) => {
  if (!user) {
    return (
      <div className='flex min-h-140 w-full items-center justify-center'>
        <Loader className='scale-50' />
      </div>
    )
  }

  const firstName = user.name?.split(' ')[0] ?? user.name

  return (
    <div className='pb-12 pt-1'>
      {/* Greeting */}
      <div className='mb-2 px-4 xl:px-6 2xl:px-2 flex items-center justify-between'>
        <p className='font-clash text-2xl tracking-tight text-foreground/90'>
          {getGreeting()}
        </p>
        <p className='mt-0.5 font-ios text-xs text-default-400'>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats Row */}
      {orderStats && (
        <div className='mb-5 grid grid-cols-3 gap-4 px-4 xl:px-6 2xl:px-0'>
          <StatPill label='Orders' value={orderStats.totalOrders} icon='box' />
          <StatPill
            label='Spent'
            value={`$${formatPrice(orderStats.totalSpent)}`}
            icon='hand-card-fill'
          />
          <StatPill
            label='rewards'
            value={
              pointsBalance
                ? `$${pointsBalance.availablePoints.toLocaleString()}`
                : '—'
            }
            icon='coins'
          />
        </div>
      )}

      {/* Main Grid */}
      <div className='grid grid-cols-1 gap-5 px-4 lg:grid-cols-3 xl:px-6 2xl:px-0'>
        {/* Left: Profile + Rewards */}
        <div className='space-y-5 lg:col-span-1'>
          <ProfileCard user={user} />
          {pointsBalance && <RewardPoints pointsBalance={pointsBalance} />}
        </div>

        {/* Right: Orders */}
        <div className='lg:col-span-2'>
          <RecentOrders orders={orders} />
        </div>
      </div>
    </div>
  )
}

function StatPill({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: IconName
}) {
  return (
    <div className='flex flex-col gap-2 rounded-xs border border-foreground/8 bg-background/60 px-3 py-3 backdrop-blur-sm dark:border-foreground/10 dark:bg-dark-table/30'>
      <div className='flex items-center justify-between'>
        <span className='font-okxs text-[9px] uppercase tracking-widest text-default-400'>
          {label}
        </span>
        <Icon name={icon} className='size-3.5 text-default-300' />
      </div>
      <span className='font-okxs font-medium text-lg leading-none tracking-tight text-foreground'>
        {value}
      </span>
    </div>
  )
}
