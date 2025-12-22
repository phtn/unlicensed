'use client'

import {AddressType} from '@/convex/users/d'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useMemo, useTransition} from 'react'
import {CheckoutModal} from './components/checkout-modal'
import {OrderSummaryCard} from './components/order-summary-card'
import {useOrderForm} from './hooks/use-order-form'
import {CheckoutProps, FormData} from './types'

export function Checkout({
  subtotal,
  tax,
  shipping,
  total,
  isAuthenticated,
  onOpen,
  isLoading = false,
  onPlaceOrder,
  userEmail,
  defaultAddress,
  defaultBillingAddress,
  userPhone,
  convexUser,
  orderError,
  orderId,
  onCheckoutClose,
  isCheckoutOpen,
  onClearCart,
  pointsBalance,
}: CheckoutProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    formData,
    formErrors,
    isPending: isFormPending,
    handleInputChange,
    validate,
  } = useOrderForm({
    isAuthenticated,
    userEmail,
    userPhone,
    defaultAddress,
    defaultBillingAddress,
    convexUser,
  })

  // Check if we have all required info to auto-place order
  const hasAllRequiredInfo = useMemo(() => {
    return !!(
      userEmail &&
      userPhone &&
      defaultAddress &&
      defaultAddress.firstName &&
      defaultAddress.lastName &&
      defaultAddress.addressLine1 &&
      defaultAddress.city &&
      defaultAddress.state &&
      defaultAddress.zipCode
    )
  }, [userEmail, userPhone, defaultAddress])

  // Auto-close modal if all required data becomes available
  useEffect(() => {
    if (isCheckoutOpen && hasAllRequiredInfo) {
      // If modal is open but user now has all required data, close it
      // They can place order directly without the modal
      onCheckoutClose()
    }
  }, [isCheckoutOpen, hasAllRequiredInfo, onCheckoutClose])

  // Handle successful order
  useEffect(() => {
    if (orderId) {
      // Clear the cart after successful order placement
      const clearCartAndRedirect = async () => {
        try {
          await onClearCart()
          if (process.env.NODE_ENV === 'development') {
            console.log('[OrderSummary] Cart cleared after successful order')
          }
        } catch (error) {
          console.error('[OrderSummary] Failed to clear cart:', error)
          // Continue with redirect even if cart clearing fails
        }

        // Redirect to payment page for PayGate payments, otherwise to order page
        startTransition(() => {
          setTimeout(() => {
            // Check if order uses PayGate payment method
            // For credit_card or crypto, redirect to payment page
            const paymentMethod = formData.paymentMethod
            if (paymentMethod === 'credit_card' || paymentMethod === 'crypto') {
              router.push(`/order/${orderId}/pay`)
            } else {
              router.push(`/account/orders/${orderId}`)
            }
            onCheckoutClose()
          }, 1500)
        })
      }

      clearCartAndRedirect()
    }
  }, [orderId, router, onCheckoutClose, onClearCart, formData.paymentMethod])

  // Auto-place order if we have all required info
  const handlePlaceOrderClick = useCallback(async () => {
    if (hasAllRequiredInfo && defaultAddress) {
      // Auto-place order with saved info
      const shippingAddress: AddressType = {
        ...defaultAddress,
        id: defaultAddress.id ?? `shipping-${Date.now()}`,
        type: 'shipping',
        firstName: defaultAddress.firstName,
        lastName: defaultAddress.lastName,
        country: defaultAddress.country || 'US', // Ensure country is set to US
      }

      startTransition(async () => {
        await onPlaceOrder({
          shippingAddress,
          contactEmail: userEmail,
          contactPhone: userPhone,
          paymentMethod: formData.paymentMethod,
          subtotalCents: subtotal,
          taxCents: tax,
          shippingCents: shipping,
        })
      })
    } else {
      // Show form if info is missing
      onOpen()
    }
  }, [
    hasAllRequiredInfo,
    defaultAddress,
    userEmail,
    userPhone,
    formData.paymentMethod,
    subtotal,
    tax,
    shipping,
    onPlaceOrder,
    onOpen,
  ])

  const handlePlaceOrder = useCallback(async () => {
    // Validate form
    if (!validate()) {
      return
    }

    const shippingAddress: AddressType = {
      id: `shipping-${Date.now()}`,
      type: 'shipping',
      firstName: formData.firstName,
      lastName: formData.lastName,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2 || undefined,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country || 'US', // Default to US if not set
      phone: formData.contactPhone || undefined,
    }

    const billingAddress: AddressType | undefined = formData.useSameBilling
      ? undefined
      : {
          id: `billing-${Date.now()}`,
          type: 'billing',
          firstName: formData.billingFirstName,
          lastName: formData.billingLastName,
          addressLine1: formData.billingAddressLine1,
          addressLine2: formData.billingAddressLine2 || undefined,
          city: formData.billingCity,
          state: formData.billingState,
          zipCode: formData.billingZipCode,
          country: formData.billingCountry || 'US', // Default to US if not set
        }

    startTransition(async () => {
      await onPlaceOrder({
        shippingAddress,
        billingAddress,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone || undefined,
        paymentMethod: formData.paymentMethod,
        subtotalCents: subtotal,
        taxCents: tax,
        shippingCents: shipping,
      })
    })
  }, [formData, validate, subtotal, tax, shipping, onPlaceOrder])

  const handlePaymentMethodChange = useCallback(
    (value: FormData['paymentMethod']) => {
      handleInputChange('paymentMethod', value)
    },
    [handleInputChange],
  )

  // Only allow modal to open if required data is missing
  // This ensures the modal never opens for users who have all data on file
  const shouldShowModal = isCheckoutOpen && !hasAllRequiredInfo

  return (
    <>
      <OrderSummaryCard
        subtotal={subtotal}
        tax={tax}
        shipping={shipping}
        total={total}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        isPending={isPending || isFormPending}
        orderId={orderId}
        paymentMethod={formData.paymentMethod}
        onPaymentMethodChange={handlePaymentMethodChange}
        onPlaceOrderClick={handlePlaceOrderClick}
        userId={convexUser?._id}
        pointsBalance={pointsBalance}
      />

      <CheckoutModal
        isOpen={shouldShowModal}
        onClose={onCheckoutClose}
        formData={formData}
        formErrors={formErrors}
        isPending={isPending || isFormPending}
        isLoading={isLoading}
        orderError={orderError}
        orderId={orderId}
        onInputChange={handleInputChange}
        onPlaceOrder={handlePlaceOrder}
      />
    </>
  )
}
