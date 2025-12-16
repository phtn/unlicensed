import {Infer, v} from 'convex/values'

/**
 * Reward tier schema - defines different loyalty tiers with discounts
 */
export const rewardTierSchema = v.object({
  name: v.string(), // e.g., "Bronze", "Silver", "Gold", "Platinum"
  level: v.number(), // Numeric level for sorting (1 = lowest, higher = better)
  discountPercentage: v.number(), // Discount percentage (0-100)
  description: v.optional(v.string()), // Description of tier benefits
  
  // Requirements to achieve this tier
  minimumSpendingCents: v.optional(v.number()), // Lifetime spending required
  minimumOrders: v.optional(v.number()), // Minimum number of orders
  minimumPoints: v.optional(v.number()), // Minimum points required (if using points)
  
  // Additional benefits
  freeShipping: v.optional(v.boolean()), // Free shipping for this tier
  earlyAccess: v.optional(v.boolean()), // Early access to new products
  exclusiveProducts: v.optional(v.boolean()), // Access to exclusive products
  birthdayReward: v.optional(v.boolean()), // Birthday reward
  
  // Visual/display
  color: v.optional(v.string()), // Hex color for UI display
  icon: v.optional(v.string()), // Icon identifier
  
  // Status
  active: v.boolean(), // Whether this tier is currently active
  isDefault: v.optional(v.boolean()), // Default tier for new customers
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})

/**
 * User rewards schema - tracks each user's loyalty status
 */
export const userRewardsSchema = v.object({
  userId: v.id('users'),
  
  // Current tier
  currentTierId: v.optional(v.id('rewardTiers')), // Current reward tier
  
  // Lifetime statistics
  lifetimeSpendingCents: v.number(), // Total amount spent across all orders
  totalOrders: v.number(), // Total number of completed orders
  totalPoints: v.optional(v.number()), // Total points earned (if using points)
  
  // Tier progression
  tierJoinedAt: v.optional(v.number()), // When user joined current tier
  tierUpgradedAt: v.optional(v.number()), // Last time tier was upgraded
  
  // Points system (optional)
  availablePoints: v.optional(v.number()), // Points available to redeem
  redeemedPoints: v.optional(v.number()), // Total points redeemed
  
  // Special flags
  isVIP: v.optional(v.boolean()), // Manually flagged as VIP by admin
  vipNotes: v.optional(v.string()), // Admin notes about VIP status
  freeShippingOverride: v.optional(v.boolean()), // Manual free shipping override (admin set)
  
  // Points tracking
  lastPaymentDate: v.optional(v.number()), // Timestamp of most recent payment completion
  
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})

export type RewardTierType = Infer<typeof rewardTierSchema>
export type UserRewardsType = Infer<typeof userRewardsSchema>

