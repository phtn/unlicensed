import {query} from '../_generated/server'
import {v} from 'convex/values'

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
    const currentTier = userRewards.currentTierId
      ? await ctx.db.get(userRewards.currentTierId)
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
    
    const tier = await ctx.db.get(userRewards.currentTierId)
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
    
    const tier = await ctx.db.get(userRewards.currentTierId)
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
      const tier = await ctx.db.get(userRewards.currentTierId)
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

