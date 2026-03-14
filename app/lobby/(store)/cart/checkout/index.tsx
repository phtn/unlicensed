'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {AddressType} from '@/convex/users/d'
import {useConvex, useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import {useCashBackRedemption} from '../hooks/use-cash-back-redemption'
import {CheckoutModal} from './components/checkout-modal'
import {DevelopmentModal} from './components/development-modal'
import {OrderSummaryCard} from './components/order-summary-card'
import {isCheckoutDevMode} from './config'
import {useOrderForm} from './hooks/use-order-form'
import {computeCashBackAmount} from './lib/rewards'
import {CheckoutProps, FormData} from './types'

const CASH_BACK_REDEMPTION_MINIMUM_ORDER_CENTS = 5000

type AppliedCheckoutCoupon = {
  couponId: Id<'coupons'>
  code: string
  name: string
  description: string | null
  discountCents: number
}

const normalizeAddressValue = (value?: string) =>
  value?.trim().toLowerCase() ?? ''

const normalizeZipCode = (value?: string) =>
  value?.replace(/\s+/g, '').toLowerCase() ?? ''

const doesAddressMatchForm = (address: AddressType, formData: FormData) =>
  normalizeAddressValue(address.firstName) ===
    normalizeAddressValue(formData.firstName) &&
  normalizeAddressValue(address.lastName) ===
    normalizeAddressValue(formData.lastName) &&
  normalizeAddressValue(address.addressLine1) ===
    normalizeAddressValue(formData.addressLine1) &&
  normalizeAddressValue(address.addressLine2) ===
    normalizeAddressValue(formData.addressLine2) &&
  normalizeAddressValue(address.city) ===
    normalizeAddressValue(formData.city) &&
  normalizeAddressValue(address.state) ===
    normalizeAddressValue(formData.state) &&
  normalizeZipCode(address.zipCode) === normalizeZipCode(formData.zipCode) &&
  normalizeAddressValue(address.country || 'US') ===
    normalizeAddressValue(formData.country || 'US')

export function Checkout({
  subtotal,
  tax,
  shipping,
  total,
  showTaxRow = true,
  isAuthenticated,
  onOpen,
  isLoading = false,
  onPlaceOrder,
  userEmail,
  defaultAddress,
  shippingAddresses,
  defaultBillingAddress,
  userPhone,
  cashAppUsername,
  convexUser,
  orderError,
  orderId,
  onCheckoutClose,
  isCheckoutOpen,
  onClearCart,
  pointsBalance,
  paymentMethodFromUrl,
  onPaymentMethodUrlChange,
  minimumOrderCents,
  shippingFeeCents,
  rewardsVariant,
  computedRewards,
  rewardsConfig,
  topUpSuggestions,
  onAddTopUp,
  nextVisitMultiplier,
  estimatedPoints,
}: CheckoutProps) {
  const convex = useConvex()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDevModal, setShowDevModal] = useState(false)
  const hasShownDevModalRef = useRef(false)
  const isDevMode = isCheckoutDevMode()
  const {isCashBackEnabled, setCashBackEnabled} = useCashBackRedemption()
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponHelpText, setCouponHelpText] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCheckoutCoupon | null>(
    null,
  )
  const [isCouponApplying, setIsCouponApplying] = useState(false)
  const cardsProcessingFeeSetting = useQuery(
    api.admin.q.getAdminByIdentStrict,
    {
      identifier: 'cards_processing_fee',
    },
  )

  // Query the order to get the actual payment method stored in the order
  const order = useQuery(api.orders.q.getById, orderId ? {id: orderId} : 'skip')

  // Debug: Log order state
  // useEffect(() => {
  //   if (orderId) {
  //     console.log('[Checkout] OrderId:', orderId)
  //     console.log('[Checkout] Order:', order)
  //     console.log('[Checkout] Order payment method:', order?.payment?.method)
  //   }
  // }, [orderId, order])

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
    cashAppUsername,
    defaultAddress,
    defaultBillingAddress,
    convexUser,
    initialPaymentMethod: paymentMethodFromUrl,
  })
  const processingFeePercent =
    cardsProcessingFeeSetting &&
    typeof cardsProcessingFeeSetting === 'object' &&
    !('error' in cardsProcessingFeeSetting) &&
    typeof cardsProcessingFeeSetting.percent === 'number'
      ? cardsProcessingFeeSetting.percent
      : 0
  const processingFeeEnabled =
    cardsProcessingFeeSetting &&
    typeof cardsProcessingFeeSetting === 'object' &&
    !('error' in cardsProcessingFeeSetting) &&
    typeof cardsProcessingFeeSetting.enabled === 'boolean'
      ? cardsProcessingFeeSetting.enabled
      : false
  const availableCashBackCents = Math.max(
    0,
    Math.round((pointsBalance?.availablePoints ?? 0) * 100),
  )
  const couponDiscountCents = appliedCoupon?.discountCents ?? 0
  const totalBeforeProcessingFee = Math.max(0, total - couponDiscountCents)
  const appliedCashBackCents =
    isCashBackEnabled && subtotal >= CASH_BACK_REDEMPTION_MINIMUM_ORDER_CENTS
      ? Math.min(availableCashBackCents, totalBeforeProcessingFee)
      : 0
  const isCryptoProcessingFeeApplied =
    processingFeeEnabled &&
    (formData.paymentMethod === 'crypto_transfer' ||
      formData.paymentMethod === 'crypto_commerce')
  const discountedSubtotalCents = Math.max(
    0,
    subtotal - couponDiscountCents - appliedCashBackCents,
  )
  const processingFeeCents = isCryptoProcessingFeeApplied
    ? Math.round(discountedSubtotalCents * (processingFeePercent / 100))
    : 0
  const totalWithProcessingFee = totalBeforeProcessingFee + processingFeeCents
  const effectiveComputedRewards = useMemo(() => {
    if (!computedRewards) return computedRewards

    return {
      ...computedRewards,
      cashBackAmount: computeCashBackAmount(
        discountedSubtotalCents / 100,
        computedRewards.cashBackPct,
      ),
    }
  }, [computedRewards, discountedSubtotalCents])

  const applyCoupon = useCallback(
    async (rawCode: string) => {
      if (!convexUser?._id) {
        setCouponError('Sign in to use a coupon code.')
        setCouponHelpText(null)
        setAppliedCoupon(null)
        return null
      }

      const nextCode = rawCode.trim()
      if (!nextCode) {
        setCouponError('Enter a coupon code.')
        setCouponHelpText(null)
        setAppliedCoupon(null)
        return null
      }

      setIsCouponApplying(true)

      try {
        const result = await convex.query(api.coupons.q.validateCouponForCheckout, {
          code: nextCode,
          userId: convexUser._id,
          subtotalCents: subtotal,
        })

        if (!result.ok) {
          setAppliedCoupon(null)
          setCouponError(result.error)
          setCouponHelpText(null)
          return null
        }

        const nextCoupon: AppliedCheckoutCoupon = {
          couponId: result.couponId,
          code: result.code,
          name: result.name,
          description: result.description,
          discountCents: result.discountCents,
        }

        setAppliedCoupon(nextCoupon)
        setCouponCode(result.code)
        setCouponError(null)
        setCouponHelpText(
          result.description || `${result.name} applied successfully.`,
        )
        return nextCoupon
      } catch (error) {
        setAppliedCoupon(null)
        setCouponHelpText(null)
        setCouponError(
          error instanceof Error ? error.message : 'Failed to validate coupon.',
        )
        return null
      } finally {
        setIsCouponApplying(false)
      }
    },
    [convex, convexUser?._id, subtotal],
  )

  const handleCouponApply = useCallback(() => {
    void applyCoupon(couponCode)
  }, [applyCoupon, couponCode])

  const handleCouponRemove = useCallback(() => {
    setAppliedCoupon(null)
    setCouponError(null)
    setCouponHelpText(null)
    setCouponCode('')
  }, [])

  const handleCouponCodeChange = useCallback(
    (value: string) => {
      setCouponCode(value)
      setCouponError(null)
      setCouponHelpText(null)

      if (
        appliedCoupon &&
        value.trim().toUpperCase() !== appliedCoupon.code.toUpperCase()
      ) {
        setAppliedCoupon(null)
      }
    },
    [appliedCoupon],
  )

  useEffect(() => {
    if (!appliedCoupon?.code || !convexUser?._id) {
      return
    }

    let cancelled = false

    const revalidateCoupon = async () => {
      setIsCouponApplying(true)

      try {
        const result = await convex.query(api.coupons.q.validateCouponForCheckout, {
          code: appliedCoupon.code,
          userId: convexUser._id,
          subtotalCents: subtotal,
        })

        if (cancelled) {
          return
        }

        if (!result.ok) {
          setAppliedCoupon(null)
          setCouponHelpText(null)
          setCouponError(result.error)
          return
        }

        setAppliedCoupon({
          couponId: result.couponId,
          code: result.code,
          name: result.name,
          description: result.description,
          discountCents: result.discountCents,
        })
        setCouponCode(result.code)
        setCouponError(null)
        setCouponHelpText(
          result.description || `${result.name} applied successfully.`,
        )
      } catch (error) {
        if (cancelled) {
          return
        }

        setAppliedCoupon(null)
        setCouponHelpText(null)
        setCouponError(
          error instanceof Error ? error.message : 'Failed to validate coupon.',
        )
      } finally {
        if (!cancelled) {
          setIsCouponApplying(false)
        }
      }
    }

    void revalidateCoupon()

    return () => {
      cancelled = true
    }
  }, [appliedCoupon?.code, convex, convexUser?._id, subtotal])

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
          const paymentMethod = String(order.payment.method)
          const isCryptoPaymentMethod =
            paymentMethod === 'crypto_commerce' ||
            paymentMethod === 'crypto-payment'
          console.log('[Checkout] Order payment method:', paymentMethod)
          startTransition(() => {
            // Determine redirect path based on payment method
            let redirectPath: string
            if (paymentMethod === 'cards') {
              redirectPath = `/lobby/order/${orderId}/cards`
            } else if (paymentMethod === 'cash_app') {
              redirectPath = `/lobby/order/${orderId}/cashapp`
            } else if (paymentMethod === 'crypto_transfer') {
              redirectPath = `/lobby/order/${orderId}/send`
            } else if (isCryptoPaymentMethod) {
              redirectPath = `/lobby/order/${orderId}/crypto`
            } else {
              // Default to commerce for crypto and other methods
              redirectPath = `/lobby/order/${orderId}/commerce`
            }
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

  // "Place Order" only opens the checkout modal; payment is triggered by "Proceed to Payment" inside the modal
  const handlePlaceOrderClick = useCallback(() => {
    onOpen()
  }, [onOpen])

  const handleCreateNewShippingAddress = useCallback(() => {
    handleInputChange('firstName', '')
    handleInputChange('lastName', '')
    handleInputChange('addressLine1', '')
    handleInputChange('addressLine2', '')
    handleInputChange('city', '')
    handleInputChange('state', '')
    handleInputChange('zipCode', '')
  }, [handleInputChange])

  const handleSelectShippingAddress = useCallback(
    (addressId: string) => {
      const address = shippingAddresses?.find((item) => item.id === addressId)
      if (!address) return

      handleInputChange('firstName', address.firstName)
      handleInputChange('lastName', address.lastName)
      handleInputChange('addressLine1', address.addressLine1)
      handleInputChange('addressLine2', address.addressLine2 ?? '')
      handleInputChange('city', address.city)
      handleInputChange('state', address.state)
      handleInputChange('zipCode', address.zipCode)
      handleInputChange('country', address.country || 'US')
      if (address.phone) {
        handleInputChange('contactPhone', address.phone)
      }
    },
    [shippingAddresses, handleInputChange],
  )

  const selectedShippingAddressId =
    shippingAddresses?.find((address) =>
      doesAddressMatchForm(address, formData),
    )?.id ?? null

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
        cashAppUsername:
          formData.paymentMethod === 'cash_app'
            ? formData.cashAppUsername
            : undefined,
        couponCode: appliedCoupon?.code,
        subtotalCents: subtotal,
        taxCents: tax,
        shippingCents: shipping,
        processingFeeCents,
        discountCents: appliedCashBackCents,
        redeemedStoreCreditCents: appliedCashBackCents,
        storeCreditCents: effectiveComputedRewards
          ? Math.round(effectiveComputedRewards.cashBackAmount * 100)
          : undefined,
      })
    })
  }, [
    formData,
    validate,
    subtotal,
    tax,
    shipping,
    processingFeeCents,
    appliedCashBackCents,
    effectiveComputedRewards,
    onPlaceOrder,
    appliedCoupon?.code,
  ])

  const handlePaymentMethodChange = useCallback(
    (value: FormData['paymentMethod']) => {
      handleInputChange('paymentMethod', value)
      onPaymentMethodUrlChange?.(value)
    },
    [handleInputChange, onPaymentMethodUrlChange],
  )

  const shouldShowModal = isCheckoutOpen
  return (
    <>
      <OrderSummaryCard
        subtotal={subtotal}
        tax={tax}
        shipping={shipping}
        total={totalWithProcessingFee}
        showTaxRow={showTaxRow}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        isPending={isPending || isFormPending}
        orderId={orderId}
        paymentMethod={formData.paymentMethod}
        onPaymentMethodChange={handlePaymentMethodChange}
        onPlaceOrderClick={handlePlaceOrderClick}
        userId={convexUser?._id}
        pointsBalance={pointsBalance}
        onOpen={onOpen}
        minimumOrderCents={minimumOrderCents}
        shippingFeeCents={shippingFeeCents}
        rewardsVariant={rewardsVariant}
        computedRewards={effectiveComputedRewards}
        rewardsConfig={rewardsConfig}
        topUpSuggestions={topUpSuggestions}
        onAddTopUp={onAddTopUp}
        nextVisitMultiplier={nextVisitMultiplier}
        estimatedPoints={estimatedPoints}
        cashBackBalanceCents={availableCashBackCents}
        appliedCashBackCents={appliedCashBackCents}
        isUsingCashBack={isCashBackEnabled}
        onCashBackToggle={setCashBackEnabled}
        couponCode={couponCode}
        couponDiscountCents={couponDiscountCents}
        couponError={couponError}
        couponHelpText={couponHelpText}
        isCouponApplying={isCouponApplying}
        onCouponCodeChange={handleCouponCodeChange}
        onApplyCoupon={handleCouponApply}
        onRemoveCoupon={handleCouponRemove}
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
        onCreateNewShippingAddress={handleCreateNewShippingAddress}
        shippingAddresses={shippingAddresses}
        selectedShippingAddressId={selectedShippingAddressId}
        onSelectShippingAddress={handleSelectShippingAddress}
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
