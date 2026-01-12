'use client'

import {api} from '@/convex/_generated/api'
import {AddressType} from '@/convex/users/d'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import {CheckoutModal} from './components/checkout-modal'
import {DevelopmentModal} from './components/development-modal'
import {OrderSummaryCard} from './components/order-summary-card'
import {isCheckoutDevMode} from './config'
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
  const [showDevModal, setShowDevModal] = useState(false)
  const hasShownDevModalRef = useRef(false)
  const isDevMode = isCheckoutDevMode()

  // Query the order to get the actual payment method stored in the order
  const order = useQuery(
    api.orders.q.getById,
    orderId ? {id: orderId} : 'skip',
  )

  // Debug: Log order state
  useEffect(() => {
    if (orderId) {
      console.log('[Checkout] OrderId:', orderId)
      console.log('[Checkout] Order:', order)
      console.log('[Checkout] Order payment method:', order?.payment?.method)
    }
  }, [orderId, order])

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

  useEffect(() => {
    if (isCheckoutOpen && hasAllRequiredInfo) {
      onCheckoutClose()
    }
  }, [isCheckoutOpen, hasAllRequiredInfo, onCheckoutClose])

  useEffect(() => {
    // Wait for both orderId and order to be loaded before redirecting
    // order === undefined means still loading, order === null means not found
    // We need order to be truthy (not null, not undefined) and have payment method
    if (
      orderId &&
      order !== undefined &&
      order !== null &&
      order.payment?.method &&
      !hasShownDevModalRef.current
    ) {
      hasShownDevModalRef.current = true

      let timeoutId: NodeJS.Timeout | null = null

      const handleOrderSuccess = async () => {
        try {
          await onClearCart()
        } catch (error) {
          console.error('[Checkout] Failed to clear cart:', error)
        }

        onCheckoutClose()

        if (isDevMode) {
          timeoutId = setTimeout(() => {
            setShowDevModal(true)
          }, 500)
        } else {
          // Use the order's payment method to determine redirect
          const paymentMethod = order.payment.method
          console.log('[Checkout] Order payment method:', paymentMethod)
          console.log('[Checkout] Redirecting to:', paymentMethod === 'credit_card' ? 'pay' : 'commerce')
          startTransition(() => {
            // Redirect to commerce for non-credit-card payments, otherwise to pay
            const redirectPath =
              paymentMethod === 'credit_card'
                ? `/lobby/order/${orderId}/pay`
                : `/lobby/order/${orderId}/commerce`
            console.log('[Checkout] Redirect path:', redirectPath)
            router.push(redirectPath)
          })
        }
      }

      handleOrderSuccess()

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    }
  }, [orderId, order, onCheckoutClose, onClearCart, router, isDevMode])

  // Also show dev modal when checkout modal closes and we have an orderId (dev mode only)
  useEffect(() => {
    if (
      isDevMode &&
      orderId &&
      !isCheckoutOpen &&
      !showDevModal &&
      hasShownDevModalRef.current
    ) {
      const timeoutId = setTimeout(() => {
        setShowDevModal(true)
      }, 200)
      return () => clearTimeout(timeoutId)
    }
  }, [orderId, isCheckoutOpen, showDevModal, isDevMode])

  // Reset the ref when orderId is cleared (e.g., when starting a new order)
  useEffect(() => {
    if (!orderId) {
      hasShownDevModalRef.current = false
    }
  }, [orderId])

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
      ? shippingAddress
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

      {isDevMode && (
        <DevelopmentModal
          isOpen={showDevModal}
          onClose={() => {
            console.log('[Checkout] DevelopmentModal onClose called')
            setShowDevModal(false)
          }}
        />
      )}
    </>
  )
}
