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

  return (
    <div className='pb-12 pt-1'>
      {/* Greeting */}
      <div className='mb-2 px-2 md:px-4 xl:px-6 2xl:px-2 flex items-center justify-between'>
        <p className='font-polysans font-medium text-2xl tracking-tight text-foreground/90 flex items-center space-x-2'>
          <span>{getGreeting()}</span>
          <Icon
            name='chevron-double-left'
            className='rotate-90 text-light-brand/80 size-8 mt-0.5'
          />
        </p>
        <p className='mt-0.5 font-okxs text-xs tracking-wider opacity-80'>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats Row */}
      {orderStats && (
        <div className='mb-2 md:mb-4 grid grid-cols-3 gap-2 md:gap-4 px-2 md:px-4 xl:px-6 2xl:px-0'>
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
      <div className='grid grid-cols-1 gap-2 md:gap-4 px-2 md:px-4 lg:grid-cols-3 xl:px-6 2xl:px-0'>
        {/* Left: Profile + Rewards */}
        <div className='space-y-2 md:space-y-4 lg:col-span-1'>
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
    <div className='flex flex-col gap-2 rounded-xs bg-background/40 p-3 backdrop-blur-sm dark:border-foreground/10 dark:bg-dark-table/30'>
      <div className='flex items-center justify-between relative'>
        <span className='font-okxs text-[8px] md:text-[9px] uppercase tracking-widest opacity-70'>
          {label}
        </span>
        <Icon
          name={icon}
          className='size-8 opacity-20 absolute -top-1 -right-1'
        />
      </div>
      <span className='font-clash font-medium text-base md:text-lg leading-none'>
        {value}
      </span>
    </div>
  )
}
