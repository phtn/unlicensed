'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {PaymentMethod} from '@/convex/orders/d'
import {AddressType} from '@/convex/users/d'
import {getCouponErrorMessage} from '@/lib/coupon-errors'
import {
  clearLocalStorageCart,
  getLocalStorageCartItems,
} from '@/lib/localStorageCart'
import {addToCartHistory} from '@/lib/localStorageCartHistory'
import {useMutation, useQuery} from 'convex/react'
import {ConvexError} from 'convex/values'
import {useCallback, useMemo, useState} from 'react'
import {useAuth} from './use-auth'
import {useCart} from './use-cart'
import {useRefGen} from './use-ref-gen'

/** Item price snapshot for order creation: unitPriceCents and totalPriceCents (quantity × unitPriceCents per sellable unit). */
export type OrderItemPriceOverride = {
  productId: Id<'products'>
  denomination?: number
  unitPriceCents: number
  totalPriceCents: number
}

/** Match Convex createOrder logic: use priceByDenomination when available (cents), else priceCents base price. */
function computeItemPricesFromCart(cart: {
  items: Array<{
    productId: Id<'products'>
    quantity: number
    denomination?: number
    product: {
      priceCents?: number
      priceByDenomination?: Record<string, number>
    }
  }>
}): OrderItemPriceOverride[] {
  return cart.items.map((item) => {
    const denomination = item.denomination ?? 1
    const denomKey = String(denomination)
    const byDenom = item.product.priceByDenomination
    const priceFromDenom =
      byDenom &&
      Object.keys(byDenom).length > 0 &&
      typeof byDenom[denomKey] === 'number'
        ? byDenom[denomKey]
        : null
    let unitPriceCents: number
    let totalPriceCents: number
    if (priceFromDenom != null && priceFromDenom >= 0) {
      unitPriceCents = priceFromDenom
      totalPriceCents = unitPriceCents * item.quantity
    } else {
      unitPriceCents = item.product.priceCents ?? 0
      totalPriceCents = unitPriceCents * denomination * item.quantity
    }
    return {
      productId: item.productId,
      denomination: item.denomination,
      unitPriceCents,
      totalPriceCents,
    }
  })
}

export interface PlaceOrderParams {
  shippingAddress: AddressType
  billingAddress?: AddressType
  contactEmail: string
  contactPhone?: string
  paymentMethod: PaymentMethod
  customerNotes?: string
  cashAppUsername?: string
  couponCode?: string
  // Optional: override calculated totals (useful for discounts, etc.)
  subtotalCents?: number
  taxCents?: number
  shippingCents?: number
  discountCents?: number
  /** Store credit (cash back) from checkout; added to user rewards when payment completes */
  storeCreditCents?: number
  /** Cash back redeemed on this order; deducted from available balance when payment completes */
  redeemedStoreCreditCents?: number
}

export interface UsePlaceOrderResult {
  placeOrder: (params: PlaceOrderParams) => Promise<Id<'orders'> | null>
  isLoading: boolean
  error: Error | null
  orderId: Id<'orders'> | null
  orderNumber: string | null
  reset: VoidFunction
}

const supportsShippingAddress = (type: AddressType['type']) =>
  type === 'shipping' || type === 'both'

const supportsBillingAddress = (type: AddressType['type']) =>
  type === 'billing' || type === 'both'

const normalizeAddressPart = (value?: string) =>
  value?.trim().toLowerCase() ?? ''

const normalizeZipCode = (value?: string) =>
  value?.replace(/\s+/g, '').toLowerCase() ?? ''

const isSameAddress = (left: AddressType, right: AddressType) =>
  normalizeAddressPart(left.addressLine1) ===
    normalizeAddressPart(right.addressLine1) &&
  normalizeAddressPart(left.addressLine2) ===
    normalizeAddressPart(right.addressLine2) &&
  normalizeAddressPart(left.city) === normalizeAddressPart(right.city) &&
  normalizeAddressPart(left.state) === normalizeAddressPart(right.state) &&
  normalizeZipCode(left.zipCode) === normalizeZipCode(right.zipCode) &&
  normalizeAddressPart(left.country || 'US') ===
    normalizeAddressPart(right.country || 'US')

/**
 * Custom hook for placing orders from the cart/checkout page.
 *
 * Features:
 * - Handles both authenticated and anonymous users
 * - Automatically uses cart from useCart hook
 * - Manages loading and error states
 * - Returns order ID on success
 *
 * @example
 * ```tsx
 * const { placeOrder, isLoading, error, orderId } = usePlaceOrder()
 *
 * const handleCheckout = async () => {
 *   const orderId = await placeOrder({
 *     shippingAddress: {...},
 *     contactEmail: 'user@example.com',
 *     paymentMethod: 'credit_card',
 *   })
 *   if (orderId) {
 *     router.push(`/orders/${orderId}`)
 *   }
 * }
 * ```
 */
export const usePlaceOrder = (): UsePlaceOrderResult => {
  const {user} = useAuth()
  const {cart, isAuthenticated} = useCart()
  const createOrderMutation = useMutation(api.orders.m.createOrder)
  const addAddressMutation = useMutation(api.users.m.addAddress)
  const updateContactMutation = useMutation(api.users.m.updateContact)
  const createOrUpdateUserMutation = useMutation(api.users.m.createOrUpdateUser)
  const addToCartMutation = useMutation(api.cart.m.addToCart)
  const {generateRefPair} = useRefGen()

  // Get Convex user ID if authenticated (same pattern as use-cart)
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    user ? {fid: user.uid} : 'skip',
  )
  const savedAddresses = useQuery(
    api.users.q.getUserAddresses,
    user ? {fid: user.uid} : 'skip',
  )

  const userId = useMemo(() => convexUser?._id, [convexUser?._id])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [orderId, setOrderId] = useState<Id<'orders'> | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  const placeOrder = useCallback(
    async (params: PlaceOrderParams): Promise<Id<'orders'> | null> => {
      const {uuid, refNum} = generateRefPair()
      // Validate cart exists and has items
      if (!cart || cart.items.length === 0) {
        const error = new Error('Cart is empty')
        setError(error)
        return null
      }

      // Validate required fields
      if (!params.shippingAddress) {
        const error = new Error('Shipping address is required')
        setError(error)
        return null
      }

      if (!params.contactEmail) {
        const error = new Error('Contact email is required')
        setError(error)
        return null
      }

      if (!params.paymentMethod) {
        const error = new Error('Payment method is required')
        setError(error)
        return null
      }

      // When we have cart with products, ensure each item has unitPriceCents and totalPriceCents (totalPriceCents = quantity × unitPriceCents × denomination)
      let itemPriceOverrides: OrderItemPriceOverride[] | undefined
      if (
        cart?.items?.length &&
        cart.items.every((i) => 'product' in i && i.product)
      ) {
        itemPriceOverrides = computeItemPricesFromCart(
          cart as Parameters<typeof computeItemPricesFromCart>[0],
        )
        const hasInvalid = itemPriceOverrides.some(
          (o) =>
            typeof o.unitPriceCents !== 'number' ||
            typeof o.totalPriceCents !== 'number',
        )
        if (hasInvalid) {
          setError(
            new Error(
              'Cart item prices are invalid; please refresh and try again.',
            ),
          )
          return null
        }
      }

      setIsLoading(true)
      setError(null)
      setOrderId(null)

      try {
        let cartIdToUse: Id<'carts'> | undefined
        let userIdToUse: Id<'users'> | undefined

        // If user is not authenticated and has guest cart items (localStorage), sync them to Convex
        if (!isAuthenticated) {
          const guestCartItems = getLocalStorageCartItems()
          if (guestCartItems.length > 0) {
            // Create a temporary cart in Convex with guest cart items
            let tempCartId: Id<'carts'> | null = null
            for (const item of guestCartItems) {
              if (!tempCartId) {
                tempCartId = await addToCartMutation({
                  userId: null,
                  productId: item.productId,
                  quantity: item.quantity,
                  denomination: item.denomination,
                })
              } else {
                await addToCartMutation({
                  cartId: tempCartId,
                  productId: item.productId,
                  quantity: item.quantity,
                  denomination: item.denomination,
                })
              }
            }
            if (tempCartId) {
              cartIdToUse = tempCartId
              // Add guest cart items to history before clearing so "Previously in cart" shows
              const seen = new Set<string>()
              for (const item of guestCartItems) {
                const key = `${item.productId}-${item.denomination ?? 'default'}`
                if (seen.has(key)) continue
                seen.add(key)
                addToCartHistory(item.productId, item.denomination)
              }
              clearLocalStorageCart()
            } else {
              throw new Error('Failed to create cart from guest cart items')
            }
          } else {
            throw new Error('No items in guest cart')
          }
        } else if (isAuthenticated && userId) {
          userIdToUse = userId
        }

        // Use userId from Convex if authenticated, otherwise use cartId
        // The createOrder mutation accepts either userId or cartId

        if (!uuid || !refNum) return null

        const orderArgs =
          userIdToUse !== undefined
            ? {
                uuid,
                orderNumber: refNum,
                userId: userIdToUse,
                shippingAddress: params.shippingAddress,
                billingAddress: params.billingAddress,
                contactEmail: params.contactEmail,
                contactPhone: params.contactPhone,
                paymentMethod: params.paymentMethod,
                customerNotes: params.customerNotes,
                couponCode: params.couponCode,
                subtotalCents: params.subtotalCents,
                taxCents: params.taxCents,
                shippingCents: params.shippingCents,
                discountCents: params.discountCents,
                storeCreditCents: params.storeCreditCents,
                redeemedStoreCreditCents: params.redeemedStoreCreditCents,
                itemPriceOverrides,
              }
            : {
                uuid,
                orderNumber: refNum,
                cartId: cartIdToUse!,
                shippingAddress: params.shippingAddress,
                billingAddress: params.billingAddress,
                contactEmail: params.contactEmail,
                contactPhone: params.contactPhone,
                paymentMethod: params.paymentMethod,
                customerNotes: params.customerNotes,
                couponCode: params.couponCode,
                subtotalCents: params.subtotalCents,
                taxCents: params.taxCents,
                shippingCents: params.shippingCents,
                discountCents: params.discountCents,
                storeCreditCents: params.storeCreditCents,
                redeemedStoreCreditCents: params.redeemedStoreCreditCents,
                itemPriceOverrides,
              }

        // Create order
        const newOrderId = await createOrderMutation(orderArgs)
        setOrderId(newOrderId)
        setOrderNumber(refNum)

        // For PayGate payments (credit_card or crypto), redirect to payment page
        // Note: We'll handle the redirect in the checkout component after order is created

        // Update user info if authenticated (save contact info and address)
        if (isAuthenticated && user) {
          try {
            const normalizedCashAppUsername = params.cashAppUsername?.trim()
            const shouldUpdateCashAppUsername =
              params.paymentMethod === 'cash_app' &&
              !!normalizedCashAppUsername &&
              convexUser?.cashAppUsername !== normalizedCashAppUsername

            const nextEmail =
              params.contactEmail || convexUser?.email || user.email || ''
            const nextName =
              convexUser?.name ||
              user.displayName ||
              user.email?.split('@')[0] ||
              'Customer'
            const nextPhotoUrl = convexUser?.photoUrl || user.photoURL

            // Ensure the Convex user exists before saving addresses/contact updates.
            if (
              nextEmail &&
              (!convexUser ||
                convexUser.email !== nextEmail ||
                shouldUpdateCashAppUsername)
            ) {
              await createOrUpdateUserMutation({
                email: nextEmail,
                name: nextName,
                firebaseId: user.uid,
                ...(nextPhotoUrl ? {photoUrl: nextPhotoUrl} : {}),
                ...(shouldUpdateCashAppUsername && normalizedCashAppUsername
                  ? {cashAppUsername: normalizedCashAppUsername}
                  : {}),
              })
            }

            // Check if shipping address already exists
            const existingAddresses = savedAddresses || []
            const addressExists = existingAddresses.some(
              (addr) =>
                supportsShippingAddress(addr.type) &&
                isSameAddress(addr, params.shippingAddress),
            )

            // Add shipping address if it doesn't exist
            if (!addressExists) {
              const shippingAddressToSave: AddressType = {
                ...params.shippingAddress,
                id: `addr-${Date.now()}`,
                type: 'shipping',
                isDefault: existingAddresses.length === 0, // Set as default if it's the first address
              }

              await addAddressMutation({
                fid: user.uid,
                address: shippingAddressToSave,
              })
            }

            // Add billing address if different from shipping and doesn't exist
            if (
              params.billingAddress &&
              !isSameAddress(params.billingAddress, params.shippingAddress)
            ) {
              const billingAddress = params.billingAddress
              const billingAddressExists = existingAddresses.some(
                (addr) =>
                  supportsBillingAddress(addr.type) &&
                  isSameAddress(addr, billingAddress),
              )

              if (!billingAddressExists) {
                const billingAddressToSave: AddressType = {
                  ...billingAddress,
                  id: `addr-${Date.now()}-billing`,
                  type: 'billing',
                }

                await addAddressMutation({
                  fid: user.uid,
                  address: billingAddressToSave,
                })
              }
            }

            // Update contact info (phone) if provided
            if (params.contactPhone) {
              const existingContact = convexUser?.contact || {}
              const hasPhoneChanged =
                existingContact.phone !== params.contactPhone

              if (hasPhoneChanged) {
                await updateContactMutation({
                  fid: user.uid,
                  contact: {
                    ...existingContact,
                    phone: params.contactPhone,
                  },
                })
              }
            }
          } catch (userUpdateError) {
            // Log error but don't fail the order placement
            console.error(userUpdateError)
          }
        }

        return newOrderId
      } catch (err) {
        const couponErrorMessage = getCouponErrorMessage(err)
        const error = couponErrorMessage
          ? new Error(couponErrorMessage)
          : params.couponCode && err instanceof ConvexError
            ? new Error('We could not apply that coupon code right now.')
            : err instanceof Error
              ? err
              : new Error('Failed to place order')
        setError(error)
        console.error('[usePlaceOrder] Error placing order:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [
      cart,
      isAuthenticated,
      userId,
      user,
      convexUser,
      savedAddresses,
      createOrderMutation,
      addAddressMutation,
      updateContactMutation,
      createOrUpdateUserMutation,
      addToCartMutation,
      generateRefPair,
    ],
  )

  const reset = useCallback(() => {
    setError(null)
    setOrderId(null)
    setIsLoading(false)
  }, [])

  return {
    placeOrder,
    isLoading,
    error,
    orderId,
    orderNumber,
    reset,
  }
}
