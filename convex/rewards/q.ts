import {query} from '../_generated/server'
import {v} from 'convex/values'
import {
  calculateRecencyMultiplier,
  getDaysSinceLastPayment,
} from './utils'
import {safeGet} from '../utils/id_validation'

/**
 * Get all reward tiers (active only by default)
 */
export const getRewardTiers = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let tiers = await ctx.db.query('rewardTiers').collect()
    
    if (!args.includeInactive) {
      tiers = tiers.filter((tier) => tier.active)
    }
    
    // Sort by level (ascending - lowest tier first)
    return tiers.sort((a, b) => a.level - b.level)
  },
})

/**
 * Get a specific reward tier
 */
export const getRewardTier = query({
  args: {
    tierId: v.id('rewardTiers'),
  },
  handler: async (ctx, args) => {
    const tier = await ctx.db.get(args.tierId)
    return tier
  },
})

/**
 * Get default reward tier
 */
export const getDefaultTier = query({
  handler: async (ctx) => {
    const tier = await ctx.db
      .query('rewardTiers')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .filter((q) => q.eq(q.field('active'), true))
      .first()
    
    return tier
  },
})

/**
 * Get user's rewards status
 */
export const getUserRewards = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    
    if (!userRewards) {
      return null
    }
    
    // Get current tier details
    // Validate currentTierId from database before using in get()
    const currentTier = userRewards.currentTierId
      ? await safeGet(ctx.db, 'rewardTiers', userRewards.currentTierId)
      : null
    
    // Get next tier (if applicable)
    let nextTier = null
    if (currentTier) {
      const allTiers = await ctx.db
        .query('rewardTiers')
        .filter((q) => q.eq(q.field('active'), true))
        .collect()
      
      const higherTiers = allTiers.filter(
        (tier) => tier.level > currentTier.level,
      )
      
      if (higherTiers.length > 0) {
        nextTier = higherTiers.sort((a, b) => a.level - b.level)[0]
      }
    }
    
    return {
      ...userRewards,
      currentTier,
      nextTier,
    }
  },
})

/**
 * Get user's discount percentage based on their tier
 */
export const getUserDiscount = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    
    if (!userRewards || !userRewards.currentTierId) {
      return 0
    }
    
    const tier = await ctx.db.get(userRewards.currentTierId)
    if (!tier || !tier.active) {
      return 0
    }
    
    return tier.discountPercentage
  },
})

/**
 * Get user's tier benefits
 */
export const getUserTierBenefits = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    
    if (!userRewards || !userRewards.currentTierId) {
      // Check if user has free shipping override even without tier
      if (userRewards?.freeShippingOverride === true) {
        return {
          discountPercentage: 0,
          freeShipping: true,
          earlyAccess: false,
          exclusiveProducts: false,
          birthdayReward: false,
        }
      }
      return null
    }
    
    // Validate currentTierId from database before using in get()
    const tier = await safeGet(ctx.db, 'rewardTiers', userRewards.currentTierId)
    if (!tier || !tier.active) {
      // Check if user has free shipping override even without active tier
      if (userRewards.freeShippingOverride === true) {
        return {
          discountPercentage: 0,
          freeShipping: true,
          earlyAccess: false,
          exclusiveProducts: false,
          birthdayReward: false,
        }
      }
      return null
    }
    
    // Free shipping override takes precedence over tier-based free shipping
    const freeShipping =
      userRewards.freeShippingOverride === true
        ? true
        : userRewards.freeShippingOverride === false
          ? false
          : tier.freeShipping ?? false
    
    return {
      discountPercentage: tier.discountPercentage,
      freeShipping,
      earlyAccess: tier.earlyAccess ?? false,
      exclusiveProducts: tier.exclusiveProducts ?? false,
      birthdayReward: tier.birthdayReward ?? false,
    }
  },
})

/**
 * Get all users in a specific tier
 */
export const getUsersByTier = query({
  args: {
    tierId: v.id('rewardTiers'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let users = await ctx.db
      .query('userRewards')
      .filter((q) => q.eq(q.field('currentTierId'), args.tierId))
      .collect()
    
    if (args.limit) {
      users = users.slice(0, args.limit)
    }
    
    return users
  },
})

/**
 * Get VIP users
 */
export const getVIPUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let users = await ctx.db
      .query('userRewards')
      .filter((q) => q.eq(q.field('isVIP'), true))
      .collect()
    
    if (args.limit) {
      users = users.slice(0, args.limit)
    }
    
    return users
  },
})

/**
 * Get top customers by spending
 */
export const getTopCustomers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10
    const users = await ctx.db
      .query('userRewards')
      .order('desc')
      .take(limit)
    
    // Sort by lifetime spending
    return users.sort(
      (a, b) => b.lifetimeSpendingCents - a.lifetimeSpendingCents,
    )
  },
})

/**
 * Calculate discount amount in cents for a user and order total
 */
export const calculateDiscount = query({
  args: {
    userId: v.id('users'),
    subtotalCents: v.number(),
  },
  handler: async (ctx, args) => {
    const userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    
    if (!userRewards || !userRewards.currentTierId) {
      return 0
    }
    
    // Validate currentTierId from database before using in get()
    const tier = await safeGet(ctx.db, 'rewardTiers', userRewards.currentTierId)
    if (!tier || !tier.active) {
      return 0
    }
    
    // Calculate discount amount
    const discountCents = Math.round(
      (args.subtotalCents * tier.discountPercentage) / 100,
    )
    
    return discountCents
  },
})

/**
 * Check if user gets free shipping
 * Returns true if user has free shipping override OR tier-based free shipping
 */
export const getUserFreeShipping = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    
    if (!userRewards) {
      return false
    }
    
    // Check for manual override first (takes precedence)
    if (userRewards.freeShippingOverride === true) {
      return true
    }
    if (userRewards.freeShippingOverride === false) {
      return false
    }
    
    // Check tier-based free shipping
    if (userRewards.currentTierId) {
      // Validate currentTierId from database before using in get()
      const tier = await safeGet(ctx.db, 'rewardTiers', userRewards.currentTierId)
      if (tier && tier.active && tier.freeShipping) {
        return true
      }
    }
    
    return false
  },
})

/**
 * Get all users with free shipping override (admin)
 */
export const getUsersWithFreeShippingOverride = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let users = await ctx.db
      .query('userRewards')
      .filter((q) => q.eq(q.field('freeShippingOverride'), true))
      .collect()
    
    if (args.limit) {
      users = users.slice(0, args.limit)
    }
    
    return users
  },
})

/**
 * Get user's points history (orders with points earned)
 */
export const getUserPointsHistory = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20

    // Get user's orders ordered by creation date (most recent first)
    const orders = await ctx.db
      .query('orders')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit)

    // Filter to only orders with points earned
    const ordersWithPoints = orders.filter(
      (order) => order.pointsEarned !== undefined && order.pointsEarned > 0,
    )

    return ordersWithPoints.map((order) => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      pointsEarned: order.pointsEarned ?? 0,
      pointsMultiplier: order.pointsMultiplier ?? 1.0,
      orderDate: order.createdAt,
      orderStatus: order.orderStatus,
      totalCents: order.totalCents,
    }))
  },
})

/**
 * Get user's current points balance
 */
export const getUserPointsBalance = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()

    if (!userRewards) {
      return {
        availablePoints: 0,
        totalPoints: 0,
        redeemedPoints: 0,
        lastPaymentDate: undefined,
      }
    }

    return {
      availablePoints: userRewards.availablePoints ?? 0,
      totalPoints: userRewards.totalPoints ?? 0,
      redeemedPoints: userRewards.redeemedPoints ?? 0,
      lastPaymentDate: userRewards.lastPaymentDate,
    }
  },
})

/**
 * Get the multiplier the user will receive on their next order
 */
export const getNextVisitMultiplier = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()

    const daysSinceLastPayment = getDaysSinceLastPayment(
      userRewards?.lastPaymentDate,
    )
    const multiplier = calculateRecencyMultiplier(daysSinceLastPayment)

    return {
      multiplier,
      daysSinceLastPayment: daysSinceLastPayment ?? null,
      message: getMultiplierMessage(daysSinceLastPayment, multiplier),
    }
  },
})

/**
 * Helper function to generate a user-friendly message about the multiplier
 */
function getMultiplierMessage(
  daysSinceLastPayment: number | undefined | null,
  multiplier: number,
): string {
  if (daysSinceLastPayment === undefined || daysSinceLastPayment === null) {
    return 'Complete your first order to start earning points!'
  }

  if (multiplier === 3.0) {
    return 'Earning 3x points! Return within 2 weeks to keep this bonus.'
  }

  if (multiplier === 2.0) {
    return 'Earning 2x points! Return within 2 weeks for 3x points.'
  }

  if (multiplier === 1.75) {
    return 'Earning 1.75x points! Return within 2 weeks for 3x points.'
  }

  if (multiplier === 1.5) {
    return 'Earning 1.5x points! Return within 2 weeks for 3x points.'
  }

  return 'Earning standard points. Return within 2 weeks for 3x points!'
}

