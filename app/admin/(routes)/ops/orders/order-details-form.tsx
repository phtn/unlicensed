'use client'

import {HeroAvatarImage} from '@/components/ui/heroui-avatar-image'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {onError, onSuccess} from '@/ctx/toast'
import {
  CRYPTO_PAYMENT_DISCOUNT_PERCENT,
  formatProcessingFeePercent,
  isCryptoPaymentMethod,
  resolveOrderPayableTotalCents,
} from '@/lib/checkout/processing-fee'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {Avatar, Button, Chip, ChipProps, TextArea} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'
import {useSettingsPanelSafe} from '../../../_components/ui/settings'
import {mapNumericFractions} from '../../inventory/product/product-schema'
import {SectionTitle} from './components'
import {useOrderDetailsSafe} from './order-details-context'

type Order = Doc<'orders'>

const statusColorMap: Record<string, ChipProps['color']> = {
  pending_payment: 'warning',
  order_processing: 'default',
  awaiting_courier_pickup: 'default',
  shipping: 'default',
  resend: 'warning',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'danger',
}

interface OrderDetailsFormProps {
  order: Order
  hideHeader?: boolean
}

const panelClassName =
  'w-full rounded-xs border border-dotted border-foreground/15 px-3 pb-3 pt-2 shadow-none'

const topPanelClassName =
  'w-full rounded-none border-b border-dotted border-foreground/15 px-3 pb-3 pt-2 shadow-none'

const getInitials = (value: string) => {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    return '??'
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

const normalizeInternalNotes = (value?: string) =>
  value?.trim().length ? value : undefined

export function OrderDetailsForm({
  order,
  hideHeader = false,
}: OrderDetailsFormProps) {
  const router = useRouter()
  const orderDetailsContext = useOrderDetailsSafe()
  const settingsPanelContext = useSettingsPanelSafe()
  const {user: authUser} = useAuthCtx()
  const updateOrderStatus = useMutation(api.orders.m.updateOrderStatus)

  const [remarks, setRemarks] = useState(order.internalNotes || '')
  const [isSaving, setIsSaving] = useState(false)

  // Sync form state when order changes
  useEffect(() => {
    setRemarks(order.internalNotes || '')
  }, [order._id, order.internalNotes])

  const nextInternalNotes = normalizeInternalNotes(remarks)
  const persistedInternalNotes = normalizeInternalNotes(order.internalNotes)
  const hasUnsavedChanges = nextInternalNotes !== persistedInternalNotes

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      return
    }

    setIsSaving(true)
    try {
      await updateOrderStatus({
        orderId: order._id,
        status: order.orderStatus,
        internalNotes: nextInternalNotes,
        updatedBy: authUser?.uid,
      })
      onSuccess('Order changes saved')
      // If in panel context, close panel; otherwise navigate back
      if (settingsPanelContext) {
        settingsPanelContext.setOpen(false)
        orderDetailsContext?.clearSelectedOrder()
      } else {
        router.push('/admin/ops/orders')
      }
    } catch (error) {
      console.error('Failed to update order:', error)
      onError(error instanceof Error ? error.message : 'Failed to update order')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // If in panel context, close panel; otherwise navigate back
    if (settingsPanelContext) {
      settingsPanelContext.setOpen(false)
      orderDetailsContext?.clearSelectedOrder()
    } else {
      router.push('/admin/ops/orders')
    }
  }

  const customerParticipant = useQuery(
    api.messages.q.getParticipantById,
    (order.chatUserId ?? order.userId)
      ? {id: (order.chatUserId ?? order.userId)!}
      : 'skip',
  )
  const customerProfileFid =
    customerParticipant && 'guestId' in customerParticipant
      ? null
      : (customerParticipant?.fid ?? customerParticipant?.firebaseId ?? null)
  const customerName =
    customerParticipant?.name?.trim() ||
    [order.shippingAddress.firstName, order.shippingAddress.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    order.contactEmail
  const customerEmail = order.contactEmail
  const customerPhone = order.contactPhone || 'No phone provided'
  const customerAvatarUrl = customerParticipant?.photoUrl ?? undefined
  const payableTotalCents = resolveOrderPayableTotalCents({
    paymentMethod: order.payment.method,
    totalCents: order.totalCents,
    processingFeeCents: order.processingFeeCents,
    totalWithCryptoFeeCents: order.totalWithCryptoFeeCents,
  })
  const isCryptoPayment = isCryptoPaymentMethod(order.payment.method)
  const couponCode = order.couponCode?.trim().toUpperCase()
  const couponDiscountCents = order.couponDiscountCents ?? 0
  const paymentMethodDiscountCents = order.paymentMethodDiscountCents ?? 0
  const redeemedStoreCreditCents = order.redeemedStoreCreditCents ?? 0
  const additionalDiscountCents = Math.max(
    0,
    (order.discountCents ?? 0) -
      couponDiscountCents -
      paymentMethodDiscountCents -
      redeemedStoreCreditCents,
  )
  const cryptoFeeCents = isCryptoPayment
    ? Math.max(
        0,
        (order.totalWithCryptoFeeCents ??
          order.totalCents + (order.cryptoFeeCents ?? 0)) -
          order.totalCents -
          (order.processingFeeCents ?? 0),
      )
    : 0
  const processingFeeLabel =
    order.payment.method === 'cash_app'
      ? 'Cash App Processing Fee'
      : 'Processing Fee'
  const paymentMethodDiscountLabel = `Crypto Discount (${formatProcessingFeePercent(
    CRYPTO_PAYMENT_DISCOUNT_PERCENT,
  )})`

  return (
    <div className='flex min-h-0 min-w-0 flex-col'>
      {/* Header */}
      {!hideHeader && (
        <div className='mb-4 flex shrink-0 flex-col gap-2 pb-0 sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0'>
            <h2 className='break-all text-lg font-medium'>
              {order.orderNumber}
            </h2>
          </div>
          <Chip
            className='capitalize'
            color={statusColorMap[order.orderStatus] || 'default'}
            size='sm'
            variant='tertiary'>
            {order.orderStatus
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </Chip>
        </div>
      )}

      {/* Order Info */}
      <div className='mb-2 min-w-0 space-y-4 overflow-y-auto'>
        <div className='grid gap-4 md:grid-cols-2 md:gap-4'>
          {/* Customer Info */}
          <div>
            <SectionTitle>Customer</SectionTitle>
            <div className={cn(topPanelClassName)}>
              <div className='flex min-w-0 items-center gap-3'>
                <Avatar
                  size='md'
                  className='shrink-0 border border-foreground/10 bg-background text-foreground dark:border-white/10 dark:bg-dark-table'>
                  <HeroAvatarImage alt={customerName} src={customerAvatarUrl} />
                  <Avatar.Fallback>{getInitials(customerName)}</Avatar.Fallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  {customerProfileFid ? (
                    <Link
                      href={`/admin/ops/customers/${customerProfileFid}`}
                      className='block truncate text-sm font-medium text-foreground underline-offset-4 hover:underline'>
                      {customerName}
                    </Link>
                  ) : (
                    <p className='truncate text-sm font-medium text-foreground'>
                      {customerName}
                    </p>
                  )}
                  <p className='break-all text-sm lowercase text-mac-blue dark:text-blue-400 sm:truncate'>
                    {customerEmail}
                  </p>
                  <p className='truncate text-xs text-muted-foreground'>
                    {customerPhone}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Shipping Address */}
          <div className={panelClassName}>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <h3 className='text-sm font-medium block'>Shipping Address</h3>
              <div className='min-h-16.5 wrap-break-word text-left text-sm text-muted-foreground sm:text-right'>
                <p>{order.shippingAddress.addressLine1}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.zipCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-4'>
          {/* Order Items */}
          <div className='space-y-2'>
            <SectionTitle>Line Items</SectionTitle>
            <div className='h-[35lvh] overflow-y-auto rounded-xl border border-dashed border-neutral-500/80 bg-sidebar dark:bg-dark-table'>
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className='flex items-start justify-between gap-3 border-b-[0.5px] border-dotted border-neutral-500/60 bg-fade p-3 text-sm'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex min-w-0 flex-col gap-1 font-medium sm:flex-row sm:items-center sm:justify-between'>
                      <span className='min-w-0 wrap-break-word'>
                        <span className='font-light font-okxs opacity-80 mr-2'>
                          {idx + 1}
                        </span>
                        {item.productName}
                      </span>
                      <span className='shrink-0 font-light font-okxs text-sm text-muted-foreground'>
                        {item.denomination &&
                          `${mapNumericFractions[item.denomination]} × ${item.quantity}`}
                      </span>
                    </div>
                  </div>
                  <p className='shrink-0 font-medium font-okxs'>
                    <span className='font-light'>$</span>
                    {formatPrice(item.totalPriceCents)}
                  </p>
                </div>
              ))}
              <div className='pb-3'>
                <div className='text-sm'>
                  <div className='px-3 flex min-h-10 items-center justify-between gap-3 border-b-[0.5px] border-dotted border-foreground/15 hover:bg-foreground/5'>
                    <span className='font-medium'>Subtotal</span>
                    <span className='font-okxs font-medium'>
                      <span className='font-light'>$</span>
                      {formatPrice(order.subtotalCents, 2)}
                    </span>
                  </div>

                  <div className='px-3 flex min-h-8 items-center justify-between gap-3 border-b-[0.5px] border-dotted border-foreground/15 hover:bg-foreground/5'>
                    <span className='font-medium'>Shipping</span>
                    <span className='font-okxs'>
                      <span className='font-light'>$</span>
                      {formatPrice(order.shippingCents)}
                    </span>
                  </div>
                  {couponDiscountCents > 0 && (
                    <div className='px-3 flex min-h-8 items-center justify-between gap-3 border-b-[0.5px] border-dotted border-foreground/15 hover:bg-foreground/5'>
                      <span className='font-medium text-brand dark:text-light-brand'>
                        {couponCode ? `Coupon (${couponCode})` : 'Coupon'}
                      </span>
                      <span>-${formatPrice(couponDiscountCents)}</span>
                    </div>
                  )}
                  {paymentMethodDiscountCents > 0 && (
                    <div className='px-3 flex min-h-8 items-center justify-between text-mac-blue gap-3 border-b-[0.5px] border-dotted border-foreground/15 hover:bg-foreground/5'>
                      <span className='font-medium'>
                        {paymentMethodDiscountLabel}
                      </span>
                      <span>-${formatPrice(paymentMethodDiscountCents)}</span>
                    </div>
                  )}
                  {redeemedStoreCreditCents > 0 && (
                    <div className='px-3 flex min-h-8 items-center justify-between gap-3 border-b-[0.5px] border-dotted border-foreground/15 hover:bg-foreground/5'>
                      <span className='font-medium text-emerald-600 dark:text-emerald-400'>
                        Rewards
                      </span>
                      <span className='text-emerald-600 dark:text-emerald-400'>
                        -${formatPrice(redeemedStoreCreditCents)}
                      </span>
                    </div>
                  )}
                  {additionalDiscountCents > 0 && (
                    <div className='px-3 flex min-h-8 items-center justify-between gap-3 border-b-[0.5px] border-dotted border-foreground/15 hover:bg-foreground/5'>
                      <span className='font-medium'>Additional Discount</span>
                      <span>-${formatPrice(additionalDiscountCents)}</span>
                    </div>
                  )}
                  {order.processingFeeCents && order.processingFeeCents > 0 && (
                    <div className='px-3 flex min-h-8 items-center justify-between gap-3 border-b-[0.5px] border-dotted border-foreground/15 hover:bg-foreground/5'>
                      <span className='font-medium'>{processingFeeLabel}</span>
                      <span className='font-okxs font-medium'>
                        <span className='font-light'>$</span>
                        {formatPrice(order.processingFeeCents)}
                      </span>
                    </div>
                  )}
                  {cryptoFeeCents > 0 && (
                    <div className='px-3 flex min-h-8 items-center justify-between gap-3 border-b-[0.5px] border-dotted border-foreground/15 hover:bg-foreground/5'>
                      <span className='font-medium'>Payment Processing</span>
                      <span className='font-okxs font-medium'>
                        <span className='font-light'>$</span>
                        {formatPrice(cryptoFeeCents)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Totals */}
            <div className='flex justify-between p-4 font-okxs font-medium'>
              <h3 className='text-base font-semibold mb-2 block'>Total</h3>
              <span className=''>
                <span className='font-light opacity-80'>$</span>
                {formatPrice(payableTotalCents)}
              </span>
            </div>
            {/* Customer Notes */}
            <div className='space-y-2'>
              <SectionTitle>Customer Notes</SectionTitle>
              <div
                className={cn(
                  'min-h-16 rounded-xs bg-sidebar px-3 py-2 text-sm text-muted-foreground',
                  {'bg-sidebar/20': !order.customerNotes?.trim()},
                )}>
                {order.customerNotes?.trim() || 'No customer notes'}
              </div>
            </div>
          </div>

          {/*RIGHT COLUMN*/}
          <div className='space-y-2'>
            {/*PAYMENT*/}
            <SectionTitle>Payment Details</SectionTitle>
            <div className={panelClassName}>
              <div className='h-80 overflow-auto pb-2'>
                {order.payment &&
                  Object.entries(order.payment).map(([k, v]) => (
                    <div
                      key={k}
                      className='flex min-h-9 flex-col border-b border-dashed border-sidebar pt-2 text-sm sm:flex-row sm:items-start'>
                      <span className='capitalize font-medium sm:min-w-32'>
                        {k}:
                      </span>
                      <span className='min-w-0 wrap-break-word'>
                        {typeof v === 'object'
                          ? Object.entries(v).map(([j, l]) => (
                              <div
                                key={j}
                                className='flex min-h-9 flex-col border-b border-dashed border-sidebar pt-2 text-sm sm:flex-row sm:items-start'>
                                <div className='font-medium sm:mr-3'>{j}:</div>
                                <div className='min-w-0 wrap-break-word'>
                                  {typeof l === 'object'
                                    ? Object.entries(l).map(([m, n]) => (
                                        <div
                                          key={m}
                                          className='flex flex-col sm:flex-row sm:items-center'>
                                          <span className='font-medium sm:mr-3'>
                                            {m}:
                                          </span>
                                          <span className='min-w-0 wrap-break-word'>
                                            {n}
                                          </span>
                                        </div>
                                      ))
                                    : l}
                                </div>
                              </div>
                            ))
                          : v}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            {/*Internal Remarks */}
            <div className='pt-6 px-1'>
              <SectionTitle>Internal Remarks</SectionTitle>
              <TextArea
                rows={8}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder='Add internal notes or remarks...'
                variant='secondary'
                className={
                  'bg-sidebar/20 shadow-none w-full min-h-32 rounded-xs'
                }
              />
            </div>

            <div className='space-y-4 py-3 shrink-0'>
              {/* Actions */}
              <div className='flex flex-col gap-4 sm:flex-row'>
                <Button
                  size='lg'
                  variant='ghost'
                  onPress={handleCancel}
                  className='flex-1 text-base font-medium rounded-md h-12'
                  isDisabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  size='lg'
                  variant='primary'
                  onPress={handleSave}
                  className='flex-1 text-base font-medium rounded-md h-12 bg-dark-table text-white dark:text-dark-table dark:bg-white'
                  isDisabled={isSaving || !hasUnsavedChanges}>
                  <span className='drop-shadow-sm'>Save Changes</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
