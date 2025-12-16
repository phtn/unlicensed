import {v} from 'convex/values'
import {mutation, internalMutation} from '../_generated/server'
import {
  calculateRecencyMultiplier,
  calculatePointsEarned,
  getDaysSinceLastPayment,
} from './utils'

/**
 * Create a new reward tier (admin only)
 */
export const createRewardTier = mutation({
  args: {
    name: v.string(),
    level: v.number(),
    discountPercentage: v.number(),
    description: v.optional(v.string()),
    minimumSpendingCents: v.optional(v.number()),
    minimumOrders: v.optional(v.number()),
    minimumPoints: v.optional(v.number()),
    freeShipping: v.optional(v.boolean()),
    earlyAccess: v.optional(v.boolean()),
    exclusiveProducts: v.optional(v.boolean()),
    birthdayReward: v.optional(v.boolean()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    // If this is set as default, unset other defaults
    if (args.isDefault) {
      const existingDefaults = await ctx.db
        .query('rewardTiers')
        .filter((q) => q.eq(q.field('isDefault'), true))
        .collect()
      
      for (const tier of existingDefaults) {
        await ctx.db.patch(tier._id, {
          isDefault: false,
          updatedAt: now,
        })
      }
    }
    
    const tierId = await ctx.db.insert('rewardTiers', {
      name: args.name,
      level: args.level,
      discountPercentage: args.discountPercentage,
      description: args.description,
      minimumSpendingCents: args.minimumSpendingCents,
      minimumOrders: args.minimumOrders,
      minimumPoints: args.minimumPoints,
      freeShipping: args.freeShipping ?? false,
      earlyAccess: args.earlyAccess ?? false,
      exclusiveProducts: args.exclusiveProducts ?? false,
      birthdayReward: args.birthdayReward ?? false,
      color: args.color,
      icon: args.icon,
      active: args.active ?? true,
      isDefault: args.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    })
    
    return tierId
  },
})

/**
 * Update a reward tier (admin only)
 */
export const updateRewardTier = mutation({
  args: {
    tierId: v.id('rewardTiers'),
    name: v.optional(v.string()),
    level: v.optional(v.number()),
    discountPercentage: v.optional(v.number()),
    description: v.optional(v.string()),
    minimumSpendingCents: v.optional(v.number()),
    minimumOrders: v.optional(v.number()),
    minimumPoints: v.optional(v.number()),
    freeShipping: v.optional(v.boolean()),
    earlyAccess: v.optional(v.boolean()),
    exclusiveProducts: v.optional(v.boolean()),
    birthdayReward: v.optional(v.boolean()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    active: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tier = await ctx.db.get(args.tierId)
    if (!tier) {
      throw new Error('Reward tier not found')
    }
    
    const now = Date.now()
    
    // If setting as default, unset other defaults
    if (args.isDefault === true) {
      const existingDefaults = await ctx.db
        .query('rewardTiers')
        .filter((q) => q.eq(q.field('isDefault'), true))
        .collect()
      
      for (const defaultTier of existingDefaults) {
        if (defaultTier._id !== args.tierId) {
          await ctx.db.patch(defaultTier._id, {
            isDefault: false,
            updatedAt: now,
          })
        }
      }
    }
    
    const updates: {
      name?: string
      level?: number
      discountPercentage?: number
      description?: string
      minimumSpendingCents?: number
      minimumOrders?: number
      minimumPoints?: number
      freeShipping?: boolean
      earlyAccess?: boolean
      exclusiveProducts?: boolean
      birthdayReward?: boolean
      color?: string
      icon?: string
      active?: boolean
      isDefault?: boolean
      updatedAt: number
    } = {
      updatedAt: now,
    }
    
    if (args.name !== undefined) updates.name = args.name
    if (args.level !== undefined) updates.level = args.level
    if (args.discountPercentage !== undefined)
      updates.discountPercentage = args.discountPercentage
    if (args.description !== undefined) updates.description = args.description
    if (args.minimumSpendingCents !== undefined)
      updates.minimumSpendingCents = args.minimumSpendingCents
    if (args.minimumOrders !== undefined)
      updates.minimumOrders = args.minimumOrders
    if (args.minimumPoints !== undefined)
      updates.minimumPoints = args.minimumPoints
    if (args.freeShipping !== undefined)
      updates.freeShipping = args.freeShipping
    if (args.earlyAccess !== undefined) updates.earlyAccess = args.earlyAccess
    if (args.exclusiveProducts !== undefined)
      updates.exclusiveProducts = args.exclusiveProducts
    if (args.birthdayReward !== undefined)
      updates.birthdayReward = args.birthdayReward
    if (args.color !== undefined) updates.color = args.color
    if (args.icon !== undefined) updates.icon = args.icon
    if (args.active !== undefined) updates.active = args.active
    if (args.isDefault !== undefined) updates.isDefault = args.isDefault
    
    await ctx.db.patch(args.tierId, updates)
    
    return args.tierId
  },
})

/**
 * Delete a reward tier (admin only)
 */
export const deleteRewardTier = mutation({
  args: {
    tierId: v.id('rewardTiers'),
  },
  handler: async (ctx, args) => {
    const tier = await ctx.db.get(args.tierId)
    if (!tier) {
      throw new Error('Reward tier not found')
    }
    
    // Check if any users are using this tier
    const usersWithTier = await ctx.db
      .query('userRewards')
      .filter((q) => q.eq(q.field('currentTierId'), args.tierId))
      .collect()
    
    if (usersWithTier.length > 0) {
      throw new Error(
        `Cannot delete tier: ${usersWithTier.length} users are currently using it`,
      )
    }
    
    await ctx.db.delete(args.tierId)
    return args.tierId
  },
})

/**
 * Initialize or get user rewards record
 */
export const initializeUserRewards = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Check if user rewards already exists
    const existing = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    
    if (existing) {
      return existing._id
    }
    
    // Find default tier
    const defaultTier = await ctx.db
      .query('rewardTiers')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .filter((q) => q.eq(q.field('active'), true))
      .first()
    
    const now = Date.now()
    
    const rewardsId = await ctx.db.insert('userRewards', {
      userId: args.userId,
      currentTierId: defaultTier?._id,
      lifetimeSpendingCents: 0,
      totalOrders: 0,
      tierJoinedAt: defaultTier ? now : undefined,
      createdAt: now,
      updatedAt: now,
    })
    
    return rewardsId
  },
})

/**
 * Update user rewards after an order (called automatically)
 */
export const updateUserRewardsFromOrder = mutation({
  args: {
    userId: v.id('users'),
    orderTotalCents: v.number(),
  },
  handler: async (ctx, args) => {
    // Get or create user rewards
    let userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    
    if (!userRewards) {
      // Initialize if doesn't exist
      const defaultTier = await ctx.db
        .query('rewardTiers')
        .filter((q) => q.eq(q.field('isDefault'), true))
        .filter((q) => q.eq(q.field('active'), true))
        .first()
      
      const now = Date.now()
      const rewardsId = await ctx.db.insert('userRewards', {
        userId: args.userId,
        currentTierId: defaultTier?._id,
        lifetimeSpendingCents: args.orderTotalCents,
        totalOrders: 1,
        tierJoinedAt: defaultTier ? now : undefined,
        createdAt: now,
        updatedAt: now,
      })
      userRewards = await ctx.db.get(rewardsId)
      if (!userRewards) throw new Error('Failed to create user rewards')
    } else {
      // Update existing rewards
      await ctx.db.patch(userRewards._id, {
        lifetimeSpendingCents:
          userRewards.lifetimeSpendingCents + args.orderTotalCents,
        totalOrders: userRewards.totalOrders + 1,
        updatedAt: Date.now(),
      })
      userRewards = await ctx.db.get(userRewards._id)
      if (!userRewards) throw new Error('Failed to update user rewards')
    }
    
    // Check if user qualifies for a higher tier
    const allTiers = await ctx.db
      .query('rewardTiers')
      .filter((q) => q.eq(q.field('active'), true))
      .collect()
    
    // Sort tiers by level (highest first)
    const sortedTiers = allTiers.sort((a, b) => b.level - a.level)
    
    // Find the highest tier user qualifies for
    let newTierId = userRewards.currentTierId
    for (const tier of sortedTiers) {
      const meetsSpending =
        !tier.minimumSpendingCents ||
        userRewards.lifetimeSpendingCents >= tier.minimumSpendingCents
      const meetsOrders =
        !tier.minimumOrders || userRewards.totalOrders >= tier.minimumOrders
      const meetsPoints =
        !tier.minimumPoints ||
        (userRewards.totalPoints ?? 0) >= tier.minimumPoints
      
      if (meetsSpending && meetsOrders && meetsPoints) {
        newTierId = tier._id
        break
      }
    }
    
    // If tier changed, update it
    if (newTierId && newTierId !== userRewards.currentTierId) {
      await ctx.db.patch(userRewards._id, {
        currentTierId: newTierId,
        tierUpgradedAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
    
    return userRewards._id
  },
})

/**
 * Manually assign a tier to a user (admin only)
 */
export const assignTierToUser = mutation({
  args: {
    userId: v.id('users'),
    tierId: v.id('rewardTiers'),
  },
  handler: async (ctx, args) => {
    const tier = await ctx.db.get(args.tierId)
    if (!tier) {
      throw new Error('Reward tier not found')
    }
    
    if (!tier.active) {
      throw new Error('Cannot assign inactive tier')
    }
    
    // Get or create user rewards
    const userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    
    if (!userRewards) {
      const now = Date.now()
      const rewardsId = await ctx.db.insert('userRewards', {
        userId: args.userId,
        currentTierId: args.tierId,
        lifetimeSpendingCents: 0,
        totalOrders: 0,
        tierJoinedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      return rewardsId
    }
    
    const currentTier = userRewards.currentTierId
      ? await ctx.db.get(userRewards.currentTierId)
      : null
    const wasUpgrade =
      !userRewards.currentTierId ||
      (tier.level > (currentTier?.level ?? 0))
    
    await ctx.db.patch(userRewards._id, {
      currentTierId: args.tierId,
      tierJoinedAt: wasUpgrade ? undefined : userRewards.tierJoinedAt,
      tierUpgradedAt: wasUpgrade ? Date.now() : userRewards.tierUpgradedAt,
      updatedAt: Date.now(),
    })
    
    return userRewards._id
  },
})

/**
 * Add points to user (if using points system)
 */
export const addPoints = mutation({
  args: {
    userId: v.id('users'),
    points: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    
    if (!userRewards) {
      // Initialize user rewards
      const defaultTier = await ctx.db
        .query('rewardTiers')
        .filter((q) => q.eq(q.field('isDefault'), true))
        .filter((q) => q.eq(q.field('active'), true))
        .first()
      
      const now = Date.now()
      const rewardsId = await ctx.db.insert('userRewards', {
        userId: args.userId,
        currentTierId: defaultTier?._id,
        lifetimeSpendingCents: 0,
        totalOrders: 0,
        totalPoints: args.points,
        availablePoints: args.points,
        tierJoinedAt: defaultTier ? now : undefined,
        createdAt: now,
        updatedAt: now,
      })
      return rewardsId
    }
    
    const newTotalPoints = (userRewards.totalPoints ?? 0) + args.points
    const newAvailablePoints = (userRewards.availablePoints ?? 0) + args.points
    
    await ctx.db.patch(userRewards._id, {
      totalPoints: newTotalPoints,
      availablePoints: newAvailablePoints,
      updatedAt: Date.now(),
    })
    
    // Check if points qualify for tier upgrade
    const allTiers = await ctx.db
      .query('rewardTiers')
      .filter((q) => q.eq(q.field('active'), true))
      .collect()
    
    const sortedTiers = allTiers.sort((a, b) => b.level - a.level)
    
    let newTierId = userRewards.currentTierId
    for (const tier of sortedTiers) {
      const meetsSpending =
        !tier.minimumSpendingCents ||
        userRewards.lifetimeSpendingCents >= tier.minimumSpendingCents
      const meetsOrders =
        !tier.minimumOrders || userRewards.totalOrders >= tier.minimumOrders
      const meetsPoints =
        !tier.minimumPoints || newTotalPoints >= tier.minimumPoints
      
      if (meetsSpending && meetsOrders && meetsPoints) {
        newTierId = tier._id
        break
      }
    }
    
    if (newTierId && newTierId !== userRewards.currentTierId) {
      await ctx.db.patch(userRewards._id, {
        currentTierId: newTierId,
        tierUpgradedAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
    
    return userRewards._id
  },
})

/**
 * Set VIP status for a user (admin only)
 */
export const setVIPStatus = mutation({
  args: {
    userId: v.id('users'),
    isVIP: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    
    if (!userRewards) {
      // Initialize user rewards
      const defaultTier = await ctx.db
        .query('rewardTiers')
        .filter((q) => q.eq(q.field('isDefault'), true))
        .filter((q) => q.eq(q.field('active'), true))
        .first()
      
      const now = Date.now()
      const rewardsId = await ctx.db.insert('userRewards', {
        userId: args.userId,
        currentTierId: defaultTier?._id,
        lifetimeSpendingCents: 0,
        totalOrders: 0,
        isVIP: args.isVIP,
        vipNotes: args.notes,
        tierJoinedAt: defaultTier ? now : undefined,
        createdAt: now,
        updatedAt: now,
      })
      return rewardsId
    }
    
    await ctx.db.patch(userRewards._id, {
      isVIP: args.isVIP,
      vipNotes: args.notes,
      updatedAt: Date.now(),
    })
    
    return userRewards._id
  },
})

/**
 * Set free shipping override for a user (admin only)
 * This overrides tier-based free shipping settings
 */
export const setFreeShippingOverride = mutation({
  args: {
    userId: v.id('users'),
    freeShipping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique()
    
    if (!userRewards) {
      // Initialize user rewards
      const defaultTier = await ctx.db
        .query('rewardTiers')
        .filter((q) => q.eq(q.field('isDefault'), true))
        .filter((q) => q.eq(q.field('active'), true))
        .first()
      
      const now = Date.now()
      const rewardsId = await ctx.db.insert('userRewards', {
        userId: args.userId,
        currentTierId: defaultTier?._id,
        lifetimeSpendingCents: 0,
        totalOrders: 0,
        freeShippingOverride: args.freeShipping,
        tierJoinedAt: defaultTier ? now : undefined,
        createdAt: now,
        updatedAt: now,
      })
      return rewardsId
    }
    
    await ctx.db.patch(userRewards._id, {
      freeShippingOverride: args.freeShipping,
      updatedAt: Date.now(),
    })
    
    return userRewards._id
  },
})

/**
 * Award points from an order when payment is completed
 * Calculates points based on eligible products and recency multiplier
 */
export const awardPointsFromOrder = internalMutation({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    // Skip if guest order (no userId)
    if (!order.userId) {
      return { pointsEarned: 0, multiplier: 1.0 }
    }

    // Get or initialize user rewards
    let userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', order.userId!))
      .unique()

    if (!userRewards) {
      // Initialize user rewards if doesn't exist
      const defaultTier = await ctx.db
        .query('rewardTiers')
        .filter((q) => q.eq(q.field('isDefault'), true))
        .filter((q) => q.eq(q.field('active'), true))
        .first()

      const now = Date.now()
      const rewardsId = await ctx.db.insert('userRewards', {
        userId: order.userId,
        currentTierId: defaultTier?._id,
        lifetimeSpendingCents: 0,
        totalOrders: 0,
        totalPoints: 0,
        availablePoints: 0,
        tierJoinedAt: defaultTier ? now : undefined,
        createdAt: now,
        updatedAt: now,
      })
      userRewards = await ctx.db.get(rewardsId)
      if (!userRewards) throw new Error('Failed to create user rewards')
    }

    // Filter order items to only include eligible products
    const eligibleItems = await Promise.all(
      order.items.map(async (item) => {
        const product = await ctx.db.get(item.productId)
        // Product is eligible if eligibleForRewards is not explicitly false
        const isEligible = product?.eligibleForRewards !== false
        return { item, isEligible }
      }),
    )

    // Calculate eligible spending (sum of eligible items)
    const eligibleSpendingCents = eligibleItems.reduce((sum, { item, isEligible }) => {
      return isEligible ? sum + item.totalPriceCents : sum
    }, 0)

    // If no eligible spending, return 0 points
    if (eligibleSpendingCents === 0) {
      await ctx.db.patch(args.orderId, {
        pointsEarned: 0,
        pointsMultiplier: 1.0,
        updatedAt: Date.now(),
      })
      return { pointsEarned: 0, multiplier: 1.0 }
    }

    // Get days since last payment
    const daysSinceLastPayment = getDaysSinceLastPayment(
      userRewards.lastPaymentDate,
    )

    // Calculate multiplier
    const multiplier = calculateRecencyMultiplier(daysSinceLastPayment)

    // Calculate points earned
    const pointsEarned = calculatePointsEarned(eligibleSpendingCents, multiplier)

    // Update user rewards
    const paymentDate = order.payment.paidAt ?? Date.now()
    const newTotalPoints = (userRewards.totalPoints ?? 0) + pointsEarned
    const newAvailablePoints = (userRewards.availablePoints ?? 0) + pointsEarned

    await ctx.db.patch(userRewards._id, {
      totalPoints: newTotalPoints,
      availablePoints: newAvailablePoints,
      lastPaymentDate: paymentDate,
      updatedAt: Date.now(),
    })

    // Update order with points information
    await ctx.db.patch(args.orderId, {
      pointsEarned,
      pointsMultiplier: multiplier,
      updatedAt: Date.now(),
    })

    // Check if points qualify for tier upgrade
    const allTiers = await ctx.db
      .query('rewardTiers')
      .filter((q) => q.eq(q.field('active'), true))
      .collect()

    const sortedTiers = allTiers.sort((a, b) => b.level - a.level)

    let newTierId = userRewards.currentTierId
    for (const tier of sortedTiers) {
      const meetsSpending =
        !tier.minimumSpendingCents ||
        userRewards.lifetimeSpendingCents >= tier.minimumSpendingCents
      const meetsOrders =
        !tier.minimumOrders || userRewards.totalOrders >= tier.minimumOrders
      const meetsPoints =
        !tier.minimumPoints || newTotalPoints >= tier.minimumPoints

      if (meetsSpending && meetsOrders && meetsPoints) {
        newTierId = tier._id
        break
      }
    }

    // If tier changed, update it
    if (newTierId && newTierId !== userRewards.currentTierId) {
      await ctx.db.patch(userRewards._id, {
        currentTierId: newTierId,
        tierUpgradedAt: Date.now(),
        updatedAt: Date.now(),
      })
    }

    return { pointsEarned, multiplier }
  },
})

/**
 * Deduct points when an order is refunded
 * Calculates points to deduct proportionally for partial refunds
 */
export const deductPointsFromRefund = internalMutation({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    // Skip if guest order or no points were earned
    if (!order.userId || !order.pointsEarned || order.pointsEarned === 0) {
      return { pointsDeducted: 0 }
    }

    // Get user rewards
    const userRewards = await ctx.db
      .query('userRewards')
      .withIndex('by_user', (q) => q.eq('userId', order.userId!))
      .unique()

    if (!userRewards) {
      return { pointsDeducted: 0 }
    }

    // Calculate points to deduct
    // For partial refunds, deduct proportionally based on refund amount
    let pointsToDeduct = order.pointsEarned

    if (
      order.payment.status === 'partially_refunded' &&
      order.payment.refundAmountCents
    ) {
      // Calculate proportional deduction
      const refundRatio = order.payment.refundAmountCents / order.totalCents
      pointsToDeduct = Math.round(order.pointsEarned * refundRatio)
    }

    // Ensure we don't deduct more than available points
    const availablePoints = userRewards.availablePoints ?? 0
    const actualDeduction = Math.min(pointsToDeduct, availablePoints)

    if (actualDeduction === 0) {
      return { pointsDeducted: 0 }
    }

    // Update user rewards
    const newAvailablePoints = availablePoints - actualDeduction
    // Note: We don't reduce totalPoints as it represents lifetime earned
    // We only reduce availablePoints which can be redeemed

    await ctx.db.patch(userRewards._id, {
      availablePoints: Math.max(0, newAvailablePoints),
      updatedAt: Date.now(),
    })

    return { pointsDeducted: actualDeduction }
  },
})

