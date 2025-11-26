'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {AddressType} from '@/convex/users/d'
import {getLocalStorageCartItems} from '@/lib/localStorageCart'
import {clearLocalStorageCart} from '@/lib/localStorageCart'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useMemo, useState} from 'react'
import {useAuth} from './use-auth'
import {useCart} from './use-cart'

export type PaymentMethod =
  | 'credit_card'
  | 'debit_card'
  | 'paypal'
  | 'apple_pay'
  | 'google_pay'
  | 'bank_transfer'
  | 'cash'
  | 'other'

export interface PlaceOrderParams {
  shippingAddress: AddressType
  billingAddress?: AddressType
  contactEmail: string
  contactPhone?: string
  paymentMethod: PaymentMethod
  customerNotes?: string
  // Optional: override calculated totals (useful for discounts, etc.)
  subtotalCents?: number
  taxCents?: number
  shippingCents?: number
  discountCents?: number
}

export interface UsePlaceOrderResult {
  placeOrder: (params: PlaceOrderParams) => Promise<Id<'orders'> | null>
  isLoading: boolean
  error: Error | null
  orderId: Id<'orders'> | null
  reset: () => void
}

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

  // Get Convex user ID if authenticated (same pattern as use-cart)
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    user ? {firebaseId: user.uid} : 'skip',
  )

  const userId = useMemo(() => convexUser?._id, [convexUser?._id])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [orderId, setOrderId] = useState<Id<'orders'> | null>(null)

  const placeOrder = useCallback(
    async (params: PlaceOrderParams): Promise<Id<'orders'> | null> => {
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

      setIsLoading(true)
      setError(null)
      setOrderId(null)

      try {
        let cartIdToUse: Id<'carts'> | undefined
        let userIdToUse: Id<'users'> | undefined

        // If user is not authenticated and has local storage items, sync them to Convex
        if (!isAuthenticated) {
          const localStorageItems = getLocalStorageCartItems()
          if (localStorageItems.length > 0) {
            // Create a temporary cart in Convex with local storage items
            let tempCartId: Id<'carts'> | null = null
            for (const item of localStorageItems) {
              if (!tempCartId) {
                // Create cart with first item
                tempCartId = await addToCartMutation({
                  userId: null,
                  productId: item.productId,
                  quantity: item.quantity,
                  denomination: item.denomination,
                })
              } else {
                // Add remaining items to the cart
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
              // Clear local storage after successful sync
              clearLocalStorageCart()
              if (process.env.NODE_ENV === 'development') {
                console.log(
                  '[usePlaceOrder] Local storage cart synced to Convex before checkout:',
                  {
                    itemsCount: localStorageItems.length,
                    cartId: tempCartId,
                  },
                )
              }
            } else {
              throw new Error('Failed to create cart from local storage items')
            }
          } else {
            // This shouldn't happen as cart validation should catch empty carts
            throw new Error('No items in local storage cart')
          }
        } else if (isAuthenticated && userId) {
          userIdToUse = userId
        }

        // Use userId from Convex if authenticated, otherwise use cartId
        // The createOrder mutation accepts either userId or cartId
        const orderArgs =
          userIdToUse !== undefined
            ? {
                userId: userIdToUse,
                shippingAddress: params.shippingAddress,
                billingAddress: params.billingAddress,
                contactEmail: params.contactEmail,
                contactPhone: params.contactPhone,
                paymentMethod: params.paymentMethod,
                customerNotes: params.customerNotes,
                subtotalCents: params.subtotalCents,
                taxCents: params.taxCents,
                shippingCents: params.shippingCents,
                discountCents: params.discountCents,
              }
            : {
                cartId: cartIdToUse!,
                shippingAddress: params.shippingAddress,
                billingAddress: params.billingAddress,
                contactEmail: params.contactEmail,
                contactPhone: params.contactPhone,
                paymentMethod: params.paymentMethod,
                customerNotes: params.customerNotes,
                subtotalCents: params.subtotalCents,
                taxCents: params.taxCents,
                shippingCents: params.shippingCents,
                discountCents: params.discountCents,
              }

        // Create order
        const newOrderId = await createOrderMutation(orderArgs)
        setOrderId(newOrderId)

        // Update user info if authenticated (save contact info and address)
        if (isAuthenticated && user && userId && convexUser) {
          try {
            // Check if shipping address already exists
            const existingAddresses = convexUser.addresses || []
            const addressExists = existingAddresses.some(
              (addr) =>
                addr.addressLine1 === params.shippingAddress.addressLine1 &&
                addr.city === params.shippingAddress.city &&
                addr.zipCode === params.shippingAddress.zipCode,
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
                firebaseId: user.uid,
                address: shippingAddressToSave,
              })

              if (process.env.NODE_ENV === 'development') {
                console.log('[usePlaceOrder] Shipping address saved to user profile')
              }
            }

            // Add billing address if different from shipping and doesn't exist
            if (
              params.billingAddress &&
              params.billingAddress.addressLine1 !==
                params.shippingAddress.addressLine1
            ) {
              const billingAddressExists = existingAddresses.some(
                (addr) =>
                  addr.addressLine1 === params.billingAddress!.addressLine1 &&
                  addr.city === params.billingAddress!.city &&
                  addr.zipCode === params.billingAddress!.zipCode,
              )

              if (!billingAddressExists) {
                const billingAddressToSave: AddressType = {
                  ...params.billingAddress,
                  id: `addr-${Date.now()}-billing`,
                  type: 'billing',
                }

                await addAddressMutation({
                  firebaseId: user.uid,
                  address: billingAddressToSave,
                })

                if (process.env.NODE_ENV === 'development') {
                  console.log('[usePlaceOrder] Billing address saved to user profile')
                }
              }
            }

            // Update contact info (phone) if provided
            if (params.contactPhone) {
              const existingContact = convexUser?.contact || {}
              const hasPhoneChanged =
                existingContact.phone !== params.contactPhone

              if (hasPhoneChanged) {
                await updateContactMutation({
                  firebaseId: user.uid,
                  contact: {
                    ...existingContact,
                    phone: params.contactPhone,
                  },
                })

                if (process.env.NODE_ENV === 'development') {
                  console.log('[usePlaceOrder] Contact phone updated in user profile')
                }
              }
            }

            // Update email if different from current
            if (params.contactEmail && convexUser.email !== params.contactEmail) {
              await createOrUpdateUserMutation({
                email: params.contactEmail,
                name: convexUser.name,
                firebaseId: user.uid,
                photoUrl: convexUser.photoUrl,
              })

              if (process.env.NODE_ENV === 'development') {
                console.log('[usePlaceOrder] Email updated in user profile')
              }
            }
          } catch (userUpdateError) {
            // Log error but don't fail the order placement
            console.error(
              '[usePlaceOrder] Failed to update user info:',
              userUpdateError,
            )
          }
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('[usePlaceOrder] Order placed successfully:', {
            orderId: newOrderId,
            userId,
            cartId: cart._id,
            isAuthenticated,
          })
        }

        return newOrderId
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to place order')
        setError(error)
        console.error('[usePlaceOrder] Error placing order:', error)
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
      createOrderMutation,
      addAddressMutation,
      updateContactMutation,
      createOrUpdateUserMutation,
      addToCartMutation,
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
    reset,
  }
}

