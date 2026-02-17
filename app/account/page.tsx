'use client'

import {Loader} from '@/components/expermtl/loader'
import {useAccount} from '@/hooks/use-account'
import {useMemo} from 'react'
import {AccountNav} from './_components/account-nav'
import {ProfileCard} from './_components/profile-card'
import {RecentOrders} from './_components/recent-orders'
import {RewardPoints} from './_components/reward-points'

export default function AccountPage() {
  const {
    user,
    orders,
    rewards,
    tierBenefits,
    pointsBalance,
    nextVisitMultiplier,
  } = useAccount()

  // Loading State (Initial page load only)
  const isLoading = !user

  // Calculate Progress to Next Tier
  const nextTierProgress = useMemo(() => {
    if (!rewards || !rewards.nextTier) return 100
    const currentSpend = rewards.lifetimeSpendingCents
    const nextTierSpend = rewards.nextTier.minimumSpendingCents || 0
    if (nextTierSpend === 0) return 100
    return Math.min(100, (currentSpend / nextTierSpend) * 100)
  }, [rewards])

  const spendToNextTier = useMemo(() => {
    if (!rewards || !rewards.nextTier) return 0
    const currentSpend = rewards.lifetimeSpendingCents
    const nextTierSpend = rewards.nextTier.minimumSpendingCents || 0
    return Math.max(0, nextTierSpend - currentSpend)
  }, [rewards])

  if (isLoading) {
    return (
      <div className='min-h-140 w-full flex'>
        <Loader className='scale-50' />
      </div>
    )
  }

  return (
    <div className='h-[calc(100lvh-140px)]'>
      {/* Header Section */}
      <AccountNav />
      <div className='px-4 xl:px-6 2xl:px-0 pb-10'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column: Profile & Rewards (1/3 width) */}
          <div className='space-y-6 lg:col-span-1'>
            {/* Profile Card */}
            <ProfileCard user={user} />
            {/* Points Balance Card */}
            {pointsBalance && <RewardPoints pointsBalance={pointsBalance} />}
            {/* Loyalty Progress Card */}
            {/* Benefits Summary */}
          </div>

          {/* Right Column: Orders (2/3 width) */}
          <div className='lg:col-span-2'>
            {/* Recent Orders Section */}
            <RecentOrders orders={orders} />
          </div>
        </div>
      </div>
    </div>
  )
}
