import {v} from 'convex/values'
import {
  computeOrderTotalCents,
  computePersistedOrderPaymentAmounts,
  getCashAppProcessingFeePercent,
} from '../../lib/checkout/processing-fee'
import {resolveOrderShippingCents} from '../../lib/checkout/shipping'
import {createCouponError} from '../../lib/coupon-errors'
import {applyInventoryDeduction} from '../../lib/inventory-adjustments'
import {
  getSharedInventoryLineQuantity,
  getStockForDenomination,
  normalizeInventoryMode,
  roundStockQuantity,
  usesSharedInventoryPool,
} from '../../lib/productStock'
import {internal} from '../_generated/api'
import type {Doc, Id} from '../_generated/dataModel'
import type {MutationCtx} from '../_generated/server'
import {internalMutation, mutation} from '../_generated/server'
import {isProductCartItem} from '../cart/d'
import {
  getCouponDiscountCents,
  getCouponEligibilityError,
  normalizeCouponCode,
} from '../coupons/lib'
import {insertInventoryMovement} from '../inventoryMovements/lib'
import {getOrCreateGuestUser} from '../messages/guest'
import {addressSchema} from '../users/d'
import {
  orderStatusSchema,
  paymentMethodSchema,
  paymentSchema,
  shippingSchema,
} from './d'
import {
  canAttemptPaymentSuccessEmail,
  canAttemptPendingPaymentEmail,
  createPendingPaymentEmailState,
  createPendingPaymentSuccessEmailState,
  isPaymentSuccessEmailEligibleMethod,
  shouldQueueCashAppPaymentSuccessEmailOnOrderProcessing,
} from './email_delivery'

const CASH_BACK_REDEMPTION_MINIMUM_ORDER_CENTS = 4900
const DEFAULT_SHIPPING_FEE_CENTS = 1299
const DEFAULT_MINIMUM_ORDER_CENTS = 4900
const DEFAULT_TAX_RATE_PERCENT = 10
const DEFAULT_REWARDS_TIERS = [
  {
    minSubtotal: 0,
    maxSubtotal: 98.99,
    shippingCost: 12.99,
    cashBackPct: 1.5,
  },
  {
    minSubtotal: 99,
    maxSubtotal: 148.99,
    shippingCost: 3.99,
    cashBackPct: 2.0,
  },
  {
    minSubtotal: 149,
    maxSubtotal: 248.99,
    shippingCost: 0,
    cashBackPct: 3.0,
  },
  {
    minSubtotal: 249,
    maxSubtotal: null,
    shippingCost: 0,
    cashBackPct: 5.0,
  },
] as const
const DEFAULT_BUNDLE_BONUS = {enabled: true, bonusPct: 0.5, minCategories: 2}
const DEFAULT_FREE_SHIPPING_FIRST_ORDER = 49
const INVENTORY_EPSILON = 0.000001

type ProductDoc = Doc<'products'>

type RewardsTierConfig = {
  minSubtotal: number
  maxSubtotal: number | null
  shippingCost: number
  cashBackPct: number
}

async function getAdminSettingValue(
  ctx: MutationCtx,
  identifier: string,
): Promise<Record<string, unknown> | null> {
  const setting = await ctx.db
    .query('adminSettings')
    .withIndex('by_identifier', (q) => q.eq('identifier', identifier))
    .unique()

  if (!setting?.value || typeof setting.value !== 'object') {
    return null
  }

  return setting.value as Record<string, unknown>
}

function normalizePaymentReference(
  reference: string | undefined,
): string | null {
  if (!reference) {
    return null
  }

  const trimmed = reference.trim()
  if (!trimmed) {
    return null
  }

  const maybeHash = trimmed.replace(/^0x/i, '')
  if (/^[0-9a-fA-F]{64}$/.test(maybeHash)) {
    return maybeHash.toLowerCase()
  }

  return trimmed
}

async function findOrderUsingPaymentReference(
  ctx: MutationCtx,
  reference: string | undefined,
  excludeOrderId: Id<'orders'>,
) {
  const normalizedReference = normalizePaymentReference(reference)
  if (!normalizedReference) {
    return null
  }

  const orders = await ctx.db.query('orders').collect()

  return (
    orders.find((candidateOrder) => {
      if (candidateOrder._id === excludeOrderId) {
        return false
      }

      return (
        normalizePaymentReference(candidateOrder.payment.transactionId) ===
          normalizedReference ||
        normalizePaymentReference(
          candidateOrder.payment.gateway?.transactionId,
        ) === normalizedReference
      )
    }) ?? null
  )
}

function getProductUnitPriceCents(
  product: {
    priceCents?: number
    priceByDenomination?: Record<string, number>
  },
  denomination: number | undefined,
): number {
  const denom = denomination ?? 1
  const byDenom = product.priceByDenomination
  if (byDenom && Object.keys(byDenom).length > 0) {
    const direct = byDenom[String(denom)]
    if (typeof direct === 'number' && direct >= 0) {
      return Math.round(direct)
    }
  }

  return (product.priceCents ?? 0) * denom
}

function getBundleTotalCents(
  products: Array<{
    priceCents?: number
    priceByDenomination?: Record<string, number>
  }>,
  denom: number,
  bundleAmount: number,
): number {
  if (products.length === 0) {
    return 0
  }

  let sumCents = 0
  for (const product of products) {
    const direct = getProductUnitPriceCents(product, bundleAmount)
    const derived =
      denom > 0
        ? getProductUnitPriceCents(product, denom) * (bundleAmount / denom)
        : 0
    sumCents += direct > 0 ? direct : derived
  }

  return Math.ceil(sumCents / products.length / 500) * 500
}

async function buildOrderItems(
  ctx: MutationCtx,
  cartItems: Array<
    | {
        productId: Id<'products'>
        quantity: number
        denomination?: number
      }
    | {
        bundleType: string
        variationIndex: number
        bundleItems: Array<{
          productId: Id<'products'>
          quantity: number
          denomination: number
        }>
      }
  >,
) {
  const orderItems: Array<{
    productId: Id<'products'>
    productName: string
    productSlug: string
    productImage: string
    quantity: number
    denomination: number | undefined
    unitPriceCents: number
    totalPriceCents: number
  }> = []
  const categorySlugs = new Set<string>()

  for (const cartItem of cartItems) {
    if (isProductCartItem(cartItem)) {
      const product = await ctx.db.get(cartItem.productId)
      if (!product) {
        throw new Error(`Product ${cartItem.productId} not found`)
      }

      const unitPriceCents = getProductUnitPriceCents(
        product,
        cartItem.denomination,
      )
      const totalPriceCents = unitPriceCents * cartItem.quantity
      const productImage = product.image
        ? ((await ctx.storage.getUrl(product.image)) ?? '')
        : ''

      if (product.categorySlug) {
        categorySlugs.add(product.categorySlug)
      }

      orderItems.push({
        productId: cartItem.productId,
        productName: product.name ?? '',
        productSlug: product.slug ?? '',
        productImage,
        quantity: cartItem.quantity,
        denomination: cartItem.denomination,
        unitPriceCents,
        totalPriceCents,
      })
      continue
    }

    const deal = await ctx.db
      .query('deals')
      .withIndex('by_deal_slug', (q) => q.eq('id', cartItem.bundleType))
      .unique()
    const variation = deal?.variations[cartItem.variationIndex]

    if (!deal || !deal.enabled || !variation) {
      throw new Error(
        'Bundle configuration is no longer available. Please rebuild your cart.',
      )
    }

    const bundleAmount = variation.totalUnits * variation.denominationPerUnit
    const lineItems = await Promise.all(
      cartItem.bundleItems.map(async (bundleItem) => {
        const product = await ctx.db.get(bundleItem.productId)
        if (!product) {
          throw new Error(`Product ${bundleItem.productId} not found`)
        }

        if (product.categorySlug) {
          categorySlugs.add(product.categorySlug)
        }

        const productImage = product.image
          ? ((await ctx.storage.getUrl(product.image)) ?? '')
          : ''
        const lineUnitQtyCents =
          getProductUnitPriceCents(product, bundleItem.denomination) *
          bundleItem.quantity

        return {
          product,
          productImage,
          bundleItem,
          lineUnitQtyCents,
        }
      }),
    )

    const bundleTotalCents = getBundleTotalCents(
      lineItems.map(({product}) => product),
      variation.denominationPerUnit,
      bundleAmount,
    )
    const lineUnitQtyTotal = lineItems.reduce(
      (sum, lineItem) => sum + lineItem.lineUnitQtyCents,
      0,
    )
    let remainingBundleCents = bundleTotalCents

    lineItems.forEach((lineItem, index) => {
      const totalPriceCents =
        index === lineItems.length - 1
          ? remainingBundleCents
          : lineUnitQtyTotal > 0
            ? Math.round(
                (bundleTotalCents * lineItem.lineUnitQtyCents) /
                  lineUnitQtyTotal,
              )
            : 0
      remainingBundleCents -= totalPriceCents

      orderItems.push({
        productId: lineItem.bundleItem.productId,
        productName: lineItem.product.name ?? '',
        productSlug: lineItem.product.slug ?? '',
        productImage: lineItem.productImage,
        quantity: lineItem.bundleItem.quantity,
        denomination: lineItem.bundleItem.denomination,
        unitPriceCents:
          lineItem.bundleItem.quantity > 0
            ? Math.round(totalPriceCents / lineItem.bundleItem.quantity)
            : 0,
        totalPriceCents,
      })
    })
  }

  return {orderItems, categorySlugs}
}

function getProductStockForOrder(
  product: ProductDoc,
  denomination: number | undefined,
): number {
  return getStockForDenomination(product, denomination)
}

function getRequestedInventoryQuantity(
  product: ProductDoc,
  quantity: number,
  denomination: number | undefined,
): number {
  return (
    getSharedInventoryLineQuantity(product, denomination, quantity) ?? quantity
  )
}

function getInventoryAvailabilityKey(
  product: ProductDoc,
  denomination: number | undefined,
): string {
  if (usesSharedInventoryPool(product)) {
    return String(product._id)
  }

  return `${product._id}:${denomination ?? 'default'}`
}

async function getHeldQuantityForOrder(
  ctx: MutationCtx,
  product: ProductDoc,
  denomination: number | undefined,
): Promise<number> {
  const holds = usesSharedInventoryPool(product)
    ? await ctx.db
        .query('productHolds')
        .withIndex('by_product', (q) => q.eq('productId', product._id))
        .collect()
    : await ctx.db
        .query('productHolds')
        .withIndex('by_product_denom', (q) =>
          q.eq('productId', product._id).eq('denomination', denomination),
        )
        .collect()
  const now = Date.now()
  return roundStockQuantity(
    holds
      .filter((h) => h.expiresAt > now)
      .reduce(
        (sum, h) =>
          sum +
          getRequestedInventoryQuantity(product, h.quantity, h.denomination),
        0,
      ),
  )
}

async function getOurHoldForOrder(
  ctx: MutationCtx,
  cartId: Id<'carts'>,
  product: ProductDoc,
  denomination: number | undefined,
): Promise<number> {
  const holds = await ctx.db
    .query('productHolds')
    .withIndex('by_cart', (q) => q.eq('cartId', cartId))
    .collect()
  const relevantHolds = usesSharedInventoryPool(product)
    ? holds.filter((h) => h.productId === product._id)
    : holds.filter(
        (h) => h.productId === product._id && h.denomination === denomination,
      )

  return roundStockQuantity(
    relevantHolds.reduce(
      (sum, h) =>
        sum +
        getRequestedInventoryQuantity(product, h.quantity, h.denomination),
      0,
    ),
  )
}

/**
 * Create a new order from a cart
 */
export const createOrder = mutation({
  args: {
    userId: v.optional(v.union(v.id('users'), v.null())),
    cartId: v.optional(v.id('carts')),
    orderNumber: v.string(),
    uuid: v.string(),
    shippingAddress: addressSchema,
    billingAddress: v.optional(addressSchema),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    guestChatId: v.optional(v.string()),
    paymentMethod: paymentMethodSchema,
    customerNotes: v.optional(v.string()),
    // Optional: override calculated totals
    subtotalCents: v.optional(v.number()),
    taxCents: v.optional(v.number()),
    shippingCents: v.optional(v.number()),
    discountCents: v.optional(v.number()),
    couponCode: v.optional(v.string()),
    storeCreditCents: v.optional(v.number()), // Store credit (cash back) from checkout; added to user rewards when payment completes
    redeemedStoreCreditCents: v.optional(v.number()), // Cash back redeemed on this order; deducted from availablePoints when payment completes
    // Optional: client-provided item prices (unitPriceCents, totalPriceCents = quantity × unitPriceCents × denomination)
    itemPriceOverrides: v.optional(
      v.array(
        v.object({
          productId: v.id('products'),
          denomination: v.optional(v.number()),
          unitPriceCents: v.number(),
          totalPriceCents: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    let cart = null
    if (args.cartId) {
      cart = await ctx.db.get(args.cartId)
    } else if (args.userId !== undefined && args.userId !== null) {
      cart = await ctx.db
        .query('carts')
        .withIndex('by_user', (q) => q.eq('userId', args.userId ?? null))
        .unique()
    }

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty or not found')
    }

    if (
      args.userId !== undefined &&
      args.userId !== null &&
      cart.userId !== null &&
      cart.userId !== args.userId
    ) {
      throw new Error('Cart does not belong to the requested user')
    }

    // Flatten cart items: product items as-is, bundle items expanded to their line items
    const flatItems: Array<{
      productId: Id<'products'>
      quantity: number
      denomination?: number
    }> = []
    for (const item of cart.items) {
      if (isProductCartItem(item)) {
        flatItems.push({
          productId: item.productId,
          quantity: item.quantity,
          denomination: item.denomination,
        })
      } else if ('bundleItems' in item && Array.isArray(item.bundleItems)) {
        for (const bi of item.bundleItems) {
          flatItems.push({
            productId: bi.productId,
            quantity: bi.quantity,
            denomination: bi.denomination,
          })
        }
      }
    }

    const products = new Map<Id<'products'>, ProductDoc>()
    for (const item of flatItems) {
      if (!products.has(item.productId)) {
        const product = await ctx.db.get(item.productId)
        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }
        products.set(item.productId, product)
      }
    }

    const requiredByKey = new Map<
      string,
      {
        product: ProductDoc
        denomination: number | undefined
        required: number
      }
    >()

    for (const item of flatItems) {
      const product = products.get(item.productId)
      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      const key = getInventoryAvailabilityKey(product, item.denomination)
      const required = getRequestedInventoryQuantity(
        product,
        item.quantity,
        item.denomination,
      )
      const existing = requiredByKey.get(key)
      requiredByKey.set(key, {
        product,
        denomination: item.denomination,
        required: roundStockQuantity((existing?.required ?? 0) + required),
      })
    }

    for (const {product, denomination, required} of requiredByKey.values()) {
      const stock = getProductStockForOrder(product, denomination)
      const heldTotal = await getHeldQuantityForOrder(
        ctx,
        product,
        denomination,
      )
      const ourHold = await getOurHoldForOrder(
        ctx,
        cart._id,
        product,
        denomination,
      )
      const available = stock - heldTotal + ourHold

      if (available + INVENTORY_EPSILON < required) {
        const name = product?.name ?? 'Product'
        throw new Error(
          `${name} is no longer available in the requested quantity. Please update your cart.`,
        )
      }
    }

    const {orderItems, categorySlugs} = await buildOrderItems(ctx, cart.items)
    const subtotalCents = orderItems.reduce(
      (sum, item) => sum + item.totalPriceCents,
      0,
    )

    const taxConfig = await getAdminSettingValue(ctx, 'tax_config')
    const taxRatePercent =
      taxConfig && typeof taxConfig.taxRatePercent === 'number'
        ? taxConfig.taxRatePercent
        : DEFAULT_TAX_RATE_PERCENT
    const isTaxActive =
      taxConfig && typeof taxConfig.active === 'boolean'
        ? taxConfig.active
        : true
    const taxCents = isTaxActive
      ? Math.round(subtotalCents * (taxRatePercent / 100))
      : 0

    const rewardsConfig = await getAdminSettingValue(ctx, 'rewards_config')
    const tiers =
      rewardsConfig && Array.isArray(rewardsConfig.tiers)
        ? rewardsConfig.tiers
            .map((tier) =>
              tier && typeof tier === 'object'
                ? (tier as Partial<RewardsTierConfig>)
                : null,
            )
            .filter(
              (tier): tier is RewardsTierConfig =>
                tier !== null &&
                typeof tier.minSubtotal === 'number' &&
                (tier.maxSubtotal === null ||
                  typeof tier.maxSubtotal === 'number') &&
                typeof tier.shippingCost === 'number' &&
                typeof tier.cashBackPct === 'number',
            )
        : []
    const rewardTiers = tiers.length > 0 ? tiers : [...DEFAULT_REWARDS_TIERS]
    const bundleBonus =
      rewardsConfig &&
      rewardsConfig.bundleBonus &&
      typeof rewardsConfig.bundleBonus === 'object'
        ? (rewardsConfig.bundleBonus as {
            enabled?: boolean
            bonusPct?: number
            minCategories?: number
          })
        : undefined
    const subtotalDollars = subtotalCents / 100
    const orderUserId = args.userId ?? null
    const orderChatUser =
      !orderUserId && args.guestChatId
        ? await getOrCreateGuestUser(ctx, args.guestChatId, {
            displayName:
              `${args.shippingAddress.firstName} ${args.shippingAddress.lastName}`.trim(),
            contactEmail: args.contactEmail,
            contactPhone: args.contactPhone,
          })
        : null
    const isFirstOrder = orderUserId
      ? !(
          await ctx.db
            .query('orders')
            .withIndex('by_user', (q) => q.eq('userId', orderUserId))
            .collect()
        ).some((order) => order.payment.status === 'completed')
      : false
    const currentTier =
      rewardTiers.find(
        (tier) =>
          subtotalDollars >= tier.minSubtotal &&
          (tier.maxSubtotal === null || subtotalDollars <= tier.maxSubtotal),
      ) ?? rewardTiers[0]
    const isBundleBonusActive =
      (bundleBonus?.enabled ?? DEFAULT_BUNDLE_BONUS.enabled) &&
      categorySlugs.size >=
        (bundleBonus?.minCategories ?? DEFAULT_BUNDLE_BONUS.minCategories)
    const cashBackPct =
      currentTier.cashBackPct +
      (isBundleBonusActive
        ? (bundleBonus?.bonusPct ?? DEFAULT_BUNDLE_BONUS.bonusPct)
        : 0)
    const freeShippingFirstOrder =
      rewardsConfig && typeof rewardsConfig.freeShippingFirstOrder === 'number'
        ? rewardsConfig.freeShippingFirstOrder
        : DEFAULT_FREE_SHIPPING_FIRST_ORDER
    const shippingConfig = await getAdminSettingValue(ctx, 'shipping_config')
    const fallbackShippingFeeCents =
      shippingConfig && typeof shippingConfig.shippingFeeCents === 'number'
        ? shippingConfig.shippingFeeCents
        : DEFAULT_SHIPPING_FEE_CENTS
    const fallbackMinimumOrderCents =
      shippingConfig && typeof shippingConfig.minimumOrderCents === 'number'
        ? shippingConfig.minimumOrderCents
        : DEFAULT_MINIMUM_ORDER_CENTS
    const shippingCents = resolveOrderShippingCents({
      subtotalCents,
      isFirstOrder,
      freeShippingFirstOrderDollars: freeShippingFirstOrder,
      rewardTierShippingCostDollars: currentTier?.shippingCost,
      fallbackMinimumOrderCents,
      fallbackShippingFeeCents,
    })

    let appliedCoupon: Doc<'coupons'> | null = null
    let couponDiscountCents = 0
    if (args.couponCode) {
      if (!orderUserId) {
        throw createCouponError('Coupon codes require a signed-in account.')
      }

      const normalizedCouponCode = normalizeCouponCode(args.couponCode)
      if (!normalizedCouponCode) {
        throw createCouponError('Coupon code is required.')
      }

      const coupon = await ctx.db
        .query('coupons')
        .withIndex('by_code', (q) => q.eq('code', normalizedCouponCode))
        .unique()

      if (!coupon) {
        throw createCouponError('Coupon code not found.')
      }

      const userOrders = await ctx.db
        .query('orders')
        .withIndex('by_user', (q) => q.eq('userId', orderUserId))
        .collect()
      const userUses = userOrders.filter(
        (order) =>
          order.couponId === coupon._id && order.orderStatus !== 'cancelled',
      ).length

      const couponError = getCouponEligibilityError(coupon, {
        subtotalCents,
        userUses,
      })
      if (couponError) {
        throw createCouponError(couponError)
      }

      couponDiscountCents = getCouponDiscountCents(coupon, subtotalCents)
      appliedCoupon = coupon
    }

    let redeemedStoreCreditCents = 0
    const subtotalAfterCouponCents = Math.max(
      0,
      subtotalCents - couponDiscountCents,
    )
    if (
      orderUserId &&
      (args.redeemedStoreCreditCents ?? 0) > 0 &&
      subtotalCents >= CASH_BACK_REDEMPTION_MINIMUM_ORDER_CENTS
    ) {
      const userRewards = await ctx.db
        .query('userRewards')
        .withIndex('by_user', (q) => q.eq('userId', orderUserId))
        .unique()
      const availableBalanceCents = Math.max(
        0,
        Math.round((userRewards?.availablePoints ?? 0) * 100),
      )
      redeemedStoreCreditCents = Math.min(
        Math.max(0, args.redeemedStoreCreditCents ?? 0),
        availableBalanceCents,
        subtotalAfterCouponCents + taxCents + shippingCents,
      )
    }

    const cardsProcessingFeeConfig = await getAdminSettingValue(
      ctx,
      'cards_processing_fee',
    )
    const paymentMethodsConfig = await getAdminSettingValue(
      ctx,
      'payment_methods',
    )

    const isProcessingFeeEnabled =
      cardsProcessingFeeConfig &&
      typeof cardsProcessingFeeConfig.enabled === 'boolean'
        ? cardsProcessingFeeConfig.enabled
        : false
    const processingFeePercent =
      cardsProcessingFeeConfig &&
      typeof cardsProcessingFeeConfig.percent === 'number'
        ? cardsProcessingFeeConfig.percent
        : 0
    const cryptoProcessingFeeConfig = await getAdminSettingValue(
      ctx,
      'crypto_processing_fee',
    )
    const isCryptoFeeEnabled =
      cryptoProcessingFeeConfig &&
      typeof cryptoProcessingFeeConfig.enabled === 'boolean'
        ? cryptoProcessingFeeConfig.enabled
        : false
    const cryptoFeeAcc =
      cryptoProcessingFeeConfig &&
      typeof cryptoProcessingFeeConfig.acc === 'number' &&
      cryptoProcessingFeeConfig.acc > 0
        ? cryptoProcessingFeeConfig.acc
        : 1
    const cashAppPercent = getCashAppProcessingFeePercent(paymentMethodsConfig)
    const totalDiscountCents = couponDiscountCents + redeemedStoreCreditCents
    const discountedSubtotalCents = Math.max(
      0,
      subtotalCents - totalDiscountCents,
    )
    const storeCreditCents = Math.round(
      (((discountedSubtotalCents / 100) * cashBackPct) / 100) * 100,
    )
    const totalCents = computeOrderTotalCents({
      subtotalCents,
      taxCents,
      shippingCents,
      discountCents: totalDiscountCents,
    })
    const {processingFeeCents, cryptoFeeCents, totalWithCryptoFeeCents} =
      computePersistedOrderPaymentAmounts({
        paymentMethod: args.paymentMethod,
        discountedSubtotalCents,
        totalCents,
        taxCents,
        shippingCents,
        processingFeeEnabled: isProcessingFeeEnabled,
        processingFeePercent,
        cashAppPercent,
        cryptoFeeEnabled: isCryptoFeeEnabled,
        cryptoFeeAcc,
      })
    // Create payment object
    const payment = {
      method: args.paymentMethod,
      status: 'pending' as const,
    }

    // Create order
    const orderId = await ctx.db.insert('orders', {
      userId: orderUserId,
      ...(orderChatUser ? {chatUserId: orderChatUser._id} : {}),
      orderNumber: args.orderNumber,
      uuid: args.uuid,
      orderStatus: 'pending_payment',
      items: orderItems,
      subtotalCents,
      taxCents,
      shippingCents,
      processingFeeCents,
      discountCents: totalDiscountCents > 0 ? totalDiscountCents : undefined,
      couponId: appliedCoupon?._id,
      couponCode: appliedCoupon?.code,
      couponDiscountCents:
        couponDiscountCents > 0 ? couponDiscountCents : undefined,
      totalCents,
      ...(cryptoFeeCents !== undefined ? {cryptoFeeCents} : {}),
      ...(totalWithCryptoFeeCents !== undefined
        ? {totalWithCryptoFeeCents}
        : {}),
      shippingAddress: args.shippingAddress,
      billingAddress: args.billingAddress,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      payment,
      customerNotes: args.customerNotes,
      ...(storeCreditCents > 0 ? {storeCreditCents} : {}),
      ...(redeemedStoreCreditCents > 0 ? {redeemedStoreCreditCents} : {}),
      pendingPaymentEmail: createPendingPaymentEmailState(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    if (appliedCoupon && couponDiscountCents > 0) {
      await ctx.db.patch(appliedCoupon._id, {
        timesRedeemed: appliedCoupon.timesRedeemed + 1,
        updatedAt: Date.now(),
      })
    }

    // Delete all holds for this cart (items are now in the order)
    const holds = await ctx.db
      .query('productHolds')
      .withIndex('by_cart', (q) => q.eq('cartId', cart._id))
      .collect()
    for (const hold of holds) {
      await ctx.db.delete(hold._id)
    }

    // Log order created activity
    await ctx.scheduler.runAfter(0, internal.activities.m.logOrderCreated, {
      orderId,
    })
    await ctx.scheduler.runAfter(
      0,
      internal.orders.a.sendPendingPaymentForOrder,
      {
        orderId,
      },
    )

    return orderId
  },
})

/**
 * Update order status
 */
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id('orders'),
    status: orderStatusSchema,
    internalNotes: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    const now = Date.now()
    const enteredOrderProcessing =
      args.status === 'order_processing' &&
      order.orderStatus !== 'order_processing'
    const shouldSyncCashAppPayment =
      enteredOrderProcessing && order.payment.method === 'cash_app'
    const shouldMarkCashAppPaymentCompleted =
      shouldSyncCashAppPayment &&
      order.payment.status !== 'completed' &&
      order.payment.status !== 'refunded' &&
      order.payment.status !== 'partially_refunded'
    const shouldQueueCashAppPaymentSuccessEmail =
      shouldQueueCashAppPaymentSuccessEmailOnOrderProcessing({
        enteredOrderProcessing,
        hasCompletedCashAppPayment:
          shouldMarkCashAppPaymentCompleted ||
          order.payment.status === 'completed',
        paymentMethod: order.payment.method,
        paymentSuccessEmail: order.paymentSuccessEmail,
      })

    const updates: {
      orderStatus: typeof args.status
      updatedAt: number
      cancelledAt?: number
      internalNotes?: string
      shipping?: typeof order.shipping
      payment?: typeof order.payment
      paymentSuccessEmail?: typeof order.paymentSuccessEmail
    } = {
      orderStatus: args.status,
      updatedAt: now,
    }

    if (args.status === 'cancelled' && order.orderStatus !== 'cancelled') {
      updates.cancelledAt = now

      if (
        order.payment.status !== 'completed' &&
        order.couponId &&
        (order.couponDiscountCents ?? 0) > 0
      ) {
        const coupon = await ctx.db.get(order.couponId)
        if (coupon && coupon.timesRedeemed > 0) {
          await ctx.db.patch(order.couponId, {
            timesRedeemed: coupon.timesRedeemed - 1,
            updatedAt: Date.now(),
          })
        }
      }
    }

    if (args.internalNotes) {
      updates.internalNotes = args.internalNotes
    }

    if (args.status === 'delivered' && !order.shipping?.deliveredAt) {
      updates.shipping = {
        ...order.shipping,
        deliveredAt: now,
      }
    }

    if (shouldSyncCashAppPayment) {
      updates.payment = {
        ...order.payment,
        status: shouldMarkCashAppPaymentCompleted
          ? 'completed'
          : order.payment.status,
        paidAt:
          shouldMarkCashAppPaymentCompleted && !order.payment.paidAt
            ? now
            : order.payment.paidAt,
        updatedBy: args.updatedBy ?? order.payment.updatedBy,
      }
    }

    if (shouldQueueCashAppPaymentSuccessEmail) {
      updates.paymentSuccessEmail = createPendingPaymentSuccessEmailState()
    }

    await ctx.db.patch(args.orderId, updates)

    if (shouldMarkCashAppPaymentCompleted && order.userId) {
      await ctx.scheduler.runAfter(0, internal.rewards.m.awardPointsFromOrder, {
        orderId: args.orderId,
      })
    }

    if (shouldMarkCashAppPaymentCompleted) {
      await ctx.scheduler.runAfter(0, internal.orders.m.deductStockForOrder, {
        orderId: args.orderId,
      })
    }

    if (shouldQueueCashAppPaymentSuccessEmail) {
      await ctx.scheduler.runAfter(
        0,
        internal.orders.a.sendPaymentSuccessForOrder,
        {
          orderId: args.orderId,
        },
      )
      await ctx.scheduler.runAfter(
        0,
        internal.activities.m.logPaymentStatusChange,
        {
          orderId: args.orderId,
          previousStatus: order.payment.status,
          newStatus: 'completed',
          transactionId: order.payment.transactionId,
        },
      )
    } else if (shouldMarkCashAppPaymentCompleted) {
      await ctx.scheduler.runAfter(
        0,
        internal.activities.m.logPaymentStatusChange,
        {
          orderId: args.orderId,
          previousStatus: order.payment.status,
          newStatus: 'completed',
          transactionId: order.payment.transactionId,
        },
      )
    }

    // Log order status change activity
    await ctx.scheduler.runAfter(
      0,
      internal.activities.m.logOrderStatusChange,
      {
        orderId: args.orderId,
        previousStatus: order.orderStatus,
        newStatus: args.status,
        notes: args.internalNotes,
      },
    )

    return args.orderId
  },
})

/**
 * Update payment information
 */
export const updatePayment = mutation({
  args: {
    orderId: v.id('orders'),
    payment: paymentSchema,
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    const conflictingOrder = await findOrderUsingPaymentReference(
      ctx,
      args.payment.transactionId,
      args.orderId,
    )
    if (conflictingOrder) {
      throw new Error(
        `This transaction hash has already been used for order ${conflictingOrder.orderNumber}.`,
      )
    }

    const didPaymentStatusChange = order.payment.status !== args.payment.status

    // If payment is completed, update order status to order_processing
    let orderStatus = order.orderStatus
    const wasPaymentCompleted =
      args.payment.status === 'completed' &&
      order.payment.status !== 'completed'

    if (wasPaymentCompleted && order.orderStatus === 'pending_payment') {
      orderStatus = 'order_processing'
    }

    // Update payment with paidAt timestamp if completing
    const paymentUpdate = {
      ...args.payment,
      paidAt:
        wasPaymentCompleted && !args.payment.paidAt
          ? Date.now()
          : args.payment.paidAt,
    }

    const nextPaymentSuccessEmail =
      wasPaymentCompleted &&
      isPaymentSuccessEmailEligibleMethod(args.payment.method) &&
      order.paymentSuccessEmail?.status !== 'sent'
        ? createPendingPaymentSuccessEmailState()
        : order.paymentSuccessEmail

    await ctx.db.patch(args.orderId, {
      payment: paymentUpdate,
      orderStatus,
      paymentSuccessEmail: nextPaymentSuccessEmail,
      updatedAt: Date.now(),
    })

    // Award points when payment is completed (only if it wasn't already completed)
    if (wasPaymentCompleted && order.userId) {
      await ctx.scheduler.runAfter(0, internal.rewards.m.awardPointsFromOrder, {
        orderId: args.orderId,
      })
    }

    // Deduct stock when payment is completed (only on paid orders)
    if (wasPaymentCompleted) {
      await ctx.scheduler.runAfter(0, internal.orders.m.deductStockForOrder, {
        orderId: args.orderId,
      })
    }

    if (
      wasPaymentCompleted &&
      isPaymentSuccessEmailEligibleMethod(args.payment.method)
    ) {
      await ctx.scheduler.runAfter(
        0,
        internal.orders.a.sendPaymentSuccessForOrder,
        {
          orderId: args.orderId,
        },
      )
    }

    // Deduct points when payment is refunded
    const wasRefunded =
      (args.payment.status === 'refunded' ||
        args.payment.status === 'partially_refunded') &&
      order.payment.status !== 'refunded' &&
      order.payment.status !== 'partially_refunded'

    if (wasRefunded && order.userId && order.pointsEarned) {
      await ctx.scheduler.runAfter(
        0,
        internal.rewards.m.deductPointsFromRefund,
        {
          orderId: args.orderId,
        },
      )
    }

    // Log payment status change activity only when status actually changed
    if (didPaymentStatusChange) {
      await ctx.scheduler.runAfter(
        0,
        internal.activities.m.logPaymentStatusChange,
        {
          orderId: args.orderId,
          previousStatus: order.payment.status,
          newStatus: args.payment.status,
          transactionId: args.payment.transactionId,
        },
      )
    }

    return args.orderId
  },
})

export const preparePaymentSuccessEmailAttempt = internalMutation({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      return null
    }

    if (
      order.payment.status !== 'completed' ||
      !isPaymentSuccessEmailEligibleMethod(order.payment.method)
    ) {
      return null
    }

    const now = Date.now()
    if (!canAttemptPaymentSuccessEmail(order.paymentSuccessEmail, now)) {
      return null
    }

    const attempts = (order.paymentSuccessEmail?.attempts ?? 0) + 1

    await ctx.db.patch(args.orderId, {
      paymentSuccessEmail: {
        status: 'sending',
        attempts,
        lastAttemptAt: now,
        sentAt: order.paymentSuccessEmail?.sentAt,
        lastError: undefined,
        providerMessageId: order.paymentSuccessEmail?.providerMessageId,
      },
      updatedAt: now,
    })

    return order
  },
})

export const preparePendingPaymentEmailAttempt = internalMutation({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      return null
    }

    if (
      order.orderStatus !== 'pending_payment' ||
      order.payment.status === 'completed' ||
      !order.contactEmail.trim()
    ) {
      return null
    }

    const now = Date.now()
    if (!canAttemptPendingPaymentEmail(order.pendingPaymentEmail, now)) {
      return null
    }

    const attempts = (order.pendingPaymentEmail?.attempts ?? 0) + 1

    await ctx.db.patch(args.orderId, {
      pendingPaymentEmail: {
        status: 'sending',
        attempts,
        lastAttemptAt: now,
        sentAt: order.pendingPaymentEmail?.sentAt,
        lastError: undefined,
        providerMessageId: order.pendingPaymentEmail?.providerMessageId,
      },
      updatedAt: now,
    })

    return order
  },
})

export const markPaymentSuccessEmailSent = internalMutation({
  args: {
    orderId: v.id('orders'),
    providerMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      return null
    }

    const now = Date.now()
    await ctx.db.patch(args.orderId, {
      paymentSuccessEmail: {
        status: 'sent',
        attempts: order.paymentSuccessEmail?.attempts ?? 1,
        lastAttemptAt: order.paymentSuccessEmail?.lastAttemptAt ?? now,
        sentAt: now,
        lastError: undefined,
        providerMessageId:
          args.providerMessageId ??
          order.paymentSuccessEmail?.providerMessageId,
      },
      updatedAt: now,
    })

    return args.orderId
  },
})

export const markPendingPaymentEmailSent = internalMutation({
  args: {
    orderId: v.id('orders'),
    providerMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      return null
    }

    const now = Date.now()
    await ctx.db.patch(args.orderId, {
      pendingPaymentEmail: {
        status: 'sent',
        attempts: order.pendingPaymentEmail?.attempts ?? 1,
        lastAttemptAt: order.pendingPaymentEmail?.lastAttemptAt ?? now,
        sentAt: now,
        lastError: undefined,
        providerMessageId:
          args.providerMessageId ??
          order.pendingPaymentEmail?.providerMessageId,
      },
      updatedAt: now,
    })

    return args.orderId
  },
})

export const markPaymentSuccessEmailFailed = internalMutation({
  args: {
    orderId: v.id('orders'),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      return null
    }

    const now = Date.now()
    await ctx.db.patch(args.orderId, {
      paymentSuccessEmail: {
        status: 'failed',
        attempts: order.paymentSuccessEmail?.attempts ?? 1,
        lastAttemptAt: order.paymentSuccessEmail?.lastAttemptAt ?? now,
        sentAt: order.paymentSuccessEmail?.sentAt,
        lastError: args.error,
        providerMessageId: order.paymentSuccessEmail?.providerMessageId,
      },
      updatedAt: now,
    })

    return args.orderId
  },
})

export const markPendingPaymentEmailFailed = internalMutation({
  args: {
    orderId: v.id('orders'),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      return null
    }

    const now = Date.now()
    await ctx.db.patch(args.orderId, {
      pendingPaymentEmail: {
        status: 'failed',
        attempts: order.pendingPaymentEmail?.attempts ?? 1,
        lastAttemptAt: order.pendingPaymentEmail?.lastAttemptAt ?? now,
        sentAt: order.pendingPaymentEmail?.sentAt,
        lastError: args.error,
        providerMessageId: order.pendingPaymentEmail?.providerMessageId,
      },
      updatedAt: now,
    })

    return args.orderId
  },
})

/**
 * Update shipping information
 */
export const updateShipping = mutation({
  args: {
    orderId: v.id('orders'),
    shipping: shippingSchema,
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    // Keep order status in sync with shipping milestones.
    let orderStatus = order.orderStatus
    if (args.shipping.deliveredAt && order.orderStatus !== 'delivered') {
      orderStatus = 'delivered'
    } else if (
      args.shipping.shippedAt &&
      order.orderStatus !== 'shipped' &&
      order.orderStatus !== 'delivered'
    ) {
      orderStatus = 'shipped'
    }

    await ctx.db.patch(args.orderId, {
      shipping: args.shipping,
      orderStatus,
      updatedAt: Date.now(),
    })

    // Log shipping update activity
    await ctx.scheduler.runAfter(0, internal.activities.m.logShippingUpdate, {
      orderId: args.orderId,
      trackingNumber: args.shipping.trackingNumber,
      carrier: args.shipping.carrier,
      shippingMethod: args.shipping.method,
    })

    return args.orderId
  },
})

/**
 * Add internal notes to an order
 */
export const addInternalNotes = mutation({
  args: {
    orderId: v.id('orders'),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    const existingNotes = order.internalNotes || ''
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${new Date().toISOString()}: ${args.notes}`
      : `${new Date().toISOString()}: ${args.notes}`

    await ctx.db.patch(args.orderId, {
      internalNotes: updatedNotes,
      updatedAt: Date.now(),
    })

    return args.orderId
  },
})

/**
 * Update order courier
 */
export const updateCourier = mutation({
  args: {
    orderId: v.id('orders'),
    courierId: v.optional(v.union(v.id('couriers'), v.null())),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    let nextCourierAccountId = order.courierAccountId

    // Validate courier exists if provided and keep account id only if valid for that courier
    if (args.courierId) {
      const courier = await ctx.db.get(args.courierId)
      if (!courier) {
        throw new Error('Courier not found')
      }

      const accountIds = new Set(
        (courier.accounts ?? []).map((account) => account.id),
      )
      if (!nextCourierAccountId || !accountIds.has(nextCourierAccountId)) {
        nextCourierAccountId = undefined
      }
    } else {
      nextCourierAccountId = undefined
    }

    await ctx.db.patch(args.orderId, {
      courier: args.courierId ?? undefined,
      courierAccountId: nextCourierAccountId,
      updatedAt: Date.now(),
    })

    return args.orderId
  },
})

/**
 * Update order courier account
 */
export const updateCourierAccount = mutation({
  args: {
    orderId: v.id('orders'),
    courierAccountId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    if (!args.courierAccountId) {
      await ctx.db.patch(args.orderId, {
        courierAccountId: undefined,
        updatedAt: Date.now(),
      })
      return args.orderId
    }

    if (!order.courier) {
      throw new Error('Assign a courier before selecting an account')
    }

    const courier = await ctx.db.get(order.courier)
    if (!courier) {
      throw new Error('Assigned courier not found')
    }

    const accountExists = (courier.accounts ?? []).some(
      (account) => account.id === args.courierAccountId,
    )

    if (!accountExists) {
      throw new Error('Courier account not found for assigned courier')
    }

    await ctx.db.patch(args.orderId, {
      courierAccountId: args.courierAccountId,
      updatedAt: Date.now(),
    })

    return args.orderId
  },
})

/**
 * Cancel an order
 */
export const cancelOrder = mutation({
  args: {
    orderId: v.id('orders'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) {
      throw new Error('Order not found')
    }

    if (order.orderStatus === 'cancelled') {
      throw new Error('Order is already cancelled')
    }

    if (order.orderStatus === 'shipped' || order.orderStatus === 'delivered') {
      throw new Error('Cannot cancel a shipped or delivered order')
    }

    const notes = args.reason ? `Cancelled: ${args.reason}` : 'Order cancelled'
    const existingNotes = order.internalNotes || ''
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${new Date().toISOString()}: ${notes}`
      : `${new Date().toISOString()}: ${notes}`

    await ctx.db.patch(args.orderId, {
      orderStatus: 'cancelled',
      cancelledAt: Date.now(),
      internalNotes: updatedNotes,
      updatedAt: Date.now(),
    })

    return args.orderId
  },
})

/**
 * Internal: deduct product stock for a paid order. Called when payment is completed.
 */
export const deductStockForOrder = internalMutation({
  args: {
    orderId: v.id('orders'),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId)
    if (!order) return

    const productDocs = new Map<Id<'products'>, ProductDoc>()
    const movementLinesByProduct = new Map<
      Id<'products'>,
      Array<{
        denomination?: number
        previousQuantity: number
        quantityDelta: number
        nextQuantity: number
        unit?: string
      }>
    >()
    const sharedWeightDeductions = new Map<Id<'products'>, number>()
    const denominationDeductions = new Map<string, number>()

    for (const item of order.items) {
      const product = await ctx.db.get(item.productId)
      if (!product) continue
      productDocs.set(item.productId, product)

      if (normalizeInventoryMode(product.inventoryMode) === 'shared') {
        const deduction = getRequestedInventoryQuantity(
          product,
          item.quantity,
          item.denomination,
        )
        sharedWeightDeductions.set(
          item.productId,
          roundStockQuantity(
            (sharedWeightDeductions.get(item.productId) ?? 0) + deduction,
          ),
        )
        continue
      }

      const denomKey =
        item.denomination !== undefined ? String(item.denomination) : null
      const key = `${item.productId}:${denomKey ?? 'default'}`
      denominationDeductions.set(
        key,
        (denominationDeductions.get(key) ?? 0) + item.quantity,
      )
    }

    for (const [productId, deduction] of sharedWeightDeductions) {
      const product = productDocs.get(productId)
      if (!product) continue

      const current = roundStockQuantity(product.masterStockQuantity ?? 0)
      const change = applyInventoryDeduction({
        currentQuantity: current,
        deductionQuantity: deduction,
      })
      const next = roundStockQuantity(change.nextQuantity)
      await ctx.db.patch(productId, {
        masterStockQuantity: next,
      })
      movementLinesByProduct.set(productId, [
        ...(movementLinesByProduct.get(productId) ?? []),
        {
          previousQuantity: current,
          quantityDelta: roundStockQuantity(change.quantityDelta),
          nextQuantity: next,
          unit:
            product.masterStockUnit?.trim() ||
            product.unit?.trim() ||
            undefined,
        },
      ])
      productDocs.set(productId, {
        ...product,
        masterStockQuantity: next,
      })
    }

    for (const [key, deduction] of denominationDeductions) {
      const separatorIndex = key.indexOf(':')
      const productId = key.slice(0, separatorIndex) as Id<'products'>
      const denomKeyRaw = key.slice(separatorIndex + 1)
      const denomKey = denomKeyRaw === 'default' ? null : denomKeyRaw
      const product = productDocs.get(productId)
      if (!product) continue

      if (product.stockByDenomination != null && denomKey != null) {
        const current = roundStockQuantity(
          product.stockByDenomination[denomKey] ?? 0,
        )
        const change = applyInventoryDeduction({
          currentQuantity: current,
          deductionQuantity: deduction,
        })
        const next = roundStockQuantity(change.nextQuantity)
        const nextStockByDenomination = {
          ...product.stockByDenomination,
          [denomKey]: next,
        }
        await ctx.db.patch(productId, {
          stockByDenomination: nextStockByDenomination,
        })
        movementLinesByProduct.set(productId, [
          ...(movementLinesByProduct.get(productId) ?? []),
          {
            denomination: Number(denomKey),
            previousQuantity: current,
            quantityDelta: roundStockQuantity(change.quantityDelta),
            nextQuantity: next,
            unit: product.unit?.trim() || undefined,
          },
        ])
        productDocs.set(productId, {
          ...product,
          stockByDenomination: nextStockByDenomination,
        })
        continue
      }

      const current = roundStockQuantity(product.stock ?? 0)
      const change = applyInventoryDeduction({
        currentQuantity: current,
        deductionQuantity: deduction,
      })
      const next = roundStockQuantity(change.nextQuantity)
      await ctx.db.patch(productId, {
        stock: next,
      })
      movementLinesByProduct.set(productId, [
        ...(movementLinesByProduct.get(productId) ?? []),
        {
          previousQuantity: current,
          quantityDelta: roundStockQuantity(change.quantityDelta),
          nextQuantity: next,
          unit: product.unit?.trim() || undefined,
        },
      ])
      productDocs.set(productId, {
        ...product,
        stock: next,
      })
    }

    for (const [productId, lines] of movementLinesByProduct) {
      const product = productDocs.get(productId)
      if (!product || lines.length === 0) continue

      await insertInventoryMovement(ctx, {
        product,
        type: 'order_deduction',
        inventoryMode: normalizeInventoryMode(product.inventoryMode),
        lines,
        note: 'Inventory deducted after payment was completed.',
        reference: order.orderNumber,
        sourceOrderId: order._id,
        sourceOrderNumber: order.orderNumber,
      })

      await ctx.scheduler.runAfter(
        0,
        internal.lowStockAlerts.m.evaluateProductAlertState,
        {
          productId,
        },
      )
    }
  },
})
