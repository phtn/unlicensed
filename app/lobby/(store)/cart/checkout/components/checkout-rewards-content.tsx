'use client'

import {memo} from 'react'

/**
 * Wrapper for the rewards panel slot in the checkout sidebar.
 * Swap the panel by passing different children (e.g. CheckoutRewardsSummary,
 * RewardsSummary, or custom content). Renders nothing when children are null/undefined.
 */
export const CheckoutRewardsContent = memo(function CheckoutRewardsContent({
  children,
}: {
  children?: React.ReactNode
}) {
  if (children == null) return null
  return (
    <div className='w-full' data-slot='checkout-rewards'>
      {children}
    </div>
  )
})
