'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {resolveOrderPayableTotalCents} from '@/lib/checkout/processing-fee'
import {formatPrice} from '@/utils/formatPrice'
import {Avatar, Button, Chip, ChipProps, TextArea} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'
import {useSettingsPanelSafe} from '../../../_components/ui/settings'
import {mapNumericFractions} from '../../inventory/product/product-schema'
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
  'w-full rounded-xl border border-dotted border-neutral-900/20 bg-white/80 px-3 pb-3 pt-2 dark:border-white/10 dark:bg-purple-100/10'

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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateOrderStatus({
        orderId: order._id,
        status: order.orderStatus,
        internalNotes: remarks || undefined,
        updatedBy: authUser?.uid,
      })
      // If in panel context, close panel; otherwise navigate back
      if (settingsPanelContext) {
        settingsPanelContext.setOpen(false)
        orderDetailsContext?.clearSelectedOrder()
      } else {
        router.push('/admin/ops/orders')
      }
    } catch (error) {
      console.error('Failed to update order:', error)
      alert('Failed to update order. Please try again.')
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
  const processingFeeLabel =
    order.payment.method === 'cash_app'
      ? 'Cash App Processing Fee'
      : 'Processing Fee'

  return (
    <div className='flex flex-col min-h-0'>
      {/* Header */}
      {!hideHeader && (
        <div className='flex items-center justify-between mb-4 pb-0 shrink-0'>
          <div>
            <h2 className='text-lg font-medium'>{order.orderNumber}</h2>
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
      <div className='space-y-4 mb-2 overflow-y-auto'>
        <div className='grid gap-4 md:grid-cols-2 md:gap-8'>
          {/* Customer Info */}
          <div className={panelClassName}>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-space tracking-tight font-medium mb-2'>
                Customer
              </h3>
            </div>
            <div className='flex items-center gap-3'>
              <Avatar
                size='md'
                className='shrink-0 border border-foreground/10 bg-background text-foreground dark:border-white/10 dark:bg-dark-table'>
                <Avatar.Image alt={customerName} src={customerAvatarUrl} />
                <Avatar.Fallback>{getInitials(customerName)}</Avatar.Fallback>
              </Avatar>
              <div className='min-w-0'>
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
                <p className='truncate text-sm lowercase text-mac-blue dark:text-blue-400'>
                  {customerEmail}
                </p>
                <p className='truncate text-xs text-muted-foreground'>
                  {customerPhone}
                </p>
              </div>
            </div>
          </div>
          {/* Shipping Address */}
          <div className={panelClassName}>
            <div className='flex items-start justify-between'>
              <h3 className='text-sm font-medium block'>Shipping Address</h3>
              <div className='text-right text-sm text-muted-foreground min-h-16.5'>
                <p>{order.shippingAddress.addressLine1}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.zipCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='grid md:grid-cols-2 gap-8'>
          {/* Order Items */}
          <div className=''>
            <h3 className='text-sm font-medium mb-2'>Line Items</h3>
            <div className='h-[35lvh] overflow-y-auto rounded-xl border border-dashed border-neutral-500/60 bg-white/80 dark:bg-purple-100/10'>
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className='border-b-[0.5px] border-dotted border-neutral-500/60 flex justify-between items-start text-sm p-3 bg-fade'>
                  <div className='flex-1 pr-4'>
                    <div className='font-medium flex items-center justify-between'>
                      <span>
                        <span className='font-light font-okxs opacity-80 mr-2'>
                          {idx + 1}
                        </span>
                        {item.productName}
                      </span>
                      <span className='font-light font-okxs text-sm text-muted-foreground'>
                        {item.denomination &&
                          `${mapNumericFractions[item.denomination]} × ${item.quantity}`}
                      </span>
                    </div>
                  </div>
                  <p className='font-medium font-okxs'>
                    <span className='font-light'>$</span>
                    {formatPrice(item.totalPriceCents)}
                  </p>
                </div>
              ))}
              <div className='px-3 pb-3'>
                <div className='space-y-1 text-sm'>
                  <div className='flex items-center justify-between border-b border-dotted border-sidebar h-10'>
                    <span className='font-medium'>Subtotal</span>
                    <span className='font-okxs font-medium'>
                      <span className='font-light'>$</span>
                      {formatPrice(order.subtotalCents, 2)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between border-b border-dotted border-sidebar h-8'>
                    <span className='font-medium'>Tax</span>
                    <span className='font-okxs font-medium'>
                      <span className='font-light'>$</span>
                      {formatPrice(order.taxCents)}
                    </span>
                  </div>
                  <div className='flex items-center justify-between border-b border-dotted border-sidebar h-8'>
                    <span className='font-medium'>Shipping</span>
                    <span className='font-okxs font-medium'>
                      <span className='font-light'>$</span>
                      {formatPrice(order.shippingCents)}
                    </span>
                  </div>
                  {order.processingFeeCents && order.processingFeeCents > 0 && (
                    <div className='flex items-center justify-between border-b border-dotted border-sidebar h-8'>
                      <span className='font-medium'>{processingFeeLabel}</span>
                      <span className='font-okxs font-medium'>
                        <span className='font-light'>$</span>
                        {formatPrice(order.processingFeeCents)}
                      </span>
                    </div>
                  )}
                  {order.discountCents && (
                    <div className='flex items-center justify-between border-b border-dotted border-sidebar h-8'>
                      <span className='text-muted-foreground'>Discount</span>
                      <span>-${formatPrice(order.discountCents)}</span>
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

            {/*Internal Remarks */}
            <div className='py-4'>
              <label className='text-sm font-medium mb-2 block'>
                Internal Remarks
              </label>
              <TextArea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder='Add internal notes or remarks...'
                rows={6}
                variant='secondary'
                className={
                  'border border-neutral-500/40 bg-white/80 shadow-none dark:border-white/10 dark:bg-purple-100/10'
                }
              />
            </div>
          </div>

          {/*RIGHT COLUMN*/}
          <div>
            {/*PAYMENT*/}
            <h3 className='text-sm font-medium mb-2'>Payment Details</h3>
            <div className={panelClassName}>
              <div className='h-96 overflow-auto pb-2'>
                {order.payment &&
                  Object.entries(order.payment).map(([k, v]) => (
                    <div
                      key={k}
                      className='flex items-start text-sm border-b border-dashed border-sidebar min-h-9 pt-2'>
                      <span className='min-w-32 capitalize font-medium'>
                        {k}:
                      </span>
                      <span>
                        {typeof v === 'object'
                          ? Object.entries(v).map(([j, l]) => (
                              <div
                                key={j}
                                className='flex items-start text-sm border-b border-dashed border-sidebar min-h-9 pt-2'>
                                <div className='mr-3 font-medium'>{j}:</div>
                                <div>
                                  {typeof l === 'object'
                                    ? Object.entries(l).map(([m, n]) => (
                                        <div
                                          key={m}
                                          className='flex items-center'>
                                          <span className='mr-3 font-medium'>
                                            {m}:
                                          </span>
                                          <span>{n}</span>
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
            {/* Customer Notes */}
            <div className='pt-4'>
              <h3 className='text-sm font-medium mb-2'>Customer Notes</h3>
              <div className='min-h-16 rounded-lg bg-alum/40 px-3 py-2 text-sm text-muted-foreground'>
                {order.customerNotes?.trim() || 'No customer notes'}
              </div>
            </div>
            <div className='space-y-4 pt-6 shrink-0'>
              {/* Actions */}
              <div className='flex gap-2 pt-2'>
                <Button
                  size='lg'
                  variant='tertiary'
                  onPress={handleCancel}
                  className='flex-1 text-base font-medium rounded-lg'
                  isDisabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  size='lg'
                  variant='primary'
                  onPress={handleSave}
                  className='flex-1 text-base font-medium rounded-lg bg-dark-table text-white dark:text-dark-table dark:bg-white'>
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
