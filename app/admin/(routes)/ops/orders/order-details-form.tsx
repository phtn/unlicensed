'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Chip, ChipProps, Textarea, User} from '@heroui/react'
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
  order_processing: 'primary',
  awaiting_courier_pickup: 'secondary',
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

export function OrderDetailsForm({
  order,
  hideHeader = false,
}: OrderDetailsFormProps) {
  const router = useRouter()
  const orderDetailsContext = useOrderDetailsSafe()
  const settingsPanelContext = useSettingsPanelSafe()
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
      })
      // If in panel context, close panel; otherwise navigate back
      if (settingsPanelContext) {
        settingsPanelContext.setOpen(false)
        orderDetailsContext?.clearSelectedOrder()
      } else {
        router.push('/admin/orders')
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
      router.push('/admin/orders')
    }
  }

  const user = useQuery(
    api.messages.q.getParticipantById,
    (order.chatUserId ?? order.userId)
      ? {id: (order.chatUserId ?? order.userId)!}
      : 'skip',
  )
  const customerProfileFid =
    user && 'guestId' in user ? null : (user?.fid ?? user?.firebaseId ?? null)

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
            variant='flat'
          >
            {order.orderStatus
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </Chip>
        </div>
      )}

      {/* Order Info */}
      <div className='space-y-4 mb-2 overflow-y-auto'>
        <div className='flex items-center w-full gap-8'>
          {/* Customer Info */}
          <div className='rounded-xl border border-neutral-900/20 bg-white/80 dark:bg-purple-100/10 border-dotted px-3 pb-3 pt-2 w-full'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-space tracking-tight font-medium mb-2'>
                Customer
              </h3>
            </div>
            <User
              name={
                customerProfileFid ? (
                  <Link href={`/admin/ops/customers/${customerProfileFid}`}>
                    {order.contactEmail}
                  </Link>
                ) : (
                  order.contactEmail
                )
              }
              description={order.contactPhone}
              avatarProps={{
                fallback: order.contactEmail.slice(0, 2),
                size: 'sm',
              }}
              classNames={{
                name: 'lowercase',
                description:
                  'font-space text-mac-blue dark:text-blue-400 lowercase',
                base: 'uppercase',
              }}
            />
          </div>
          {/* Shipping Address */}
          <div className='rounded-xl border border-neutral-900/20 bg-white/80 dark:bg-purple-100/10 border-dotted px-3 pb-3 pt-2 w-full'>
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
            <div className='h-[35lvh] overflow-y-scroll border border-neutral-500/60 border-dashed bg-white/80 dark:bg-purple-100/10 rounded-xl'>
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className='border-b-[0.5px] border-dotted border-neutral-500/60 flex justify-between items-start text-sm p-3 bg-fade'
                >
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
                {formatPrice(order.totalCents)}
              </span>
            </div>

            {/*Internal Remarks */}
            <div className='py-4'>
              <label className='text-sm font-medium mb-2 block'>
                Internal Remarks
              </label>
              <Textarea
                value={remarks}
                onValueChange={setRemarks}
                placeholder='Add internal notes or remarks...'
                minRows={6}
                maxRows={8}
              />
            </div>
          </div>

          {/*RIGHT COLUMN*/}
          <div>
            {/*PAYMENT*/}
            <h3 className='text-sm font-medium mb-2'>Payment Details</h3>
            <div className='rounded-xl border border-neutral-900/20 bg-white/80 dark:bg-purple-100/10 border-dotted px-3 pb-3 pt-2 w-full'>
              <div className='pb-2 h-96 overflow-scroll'>
                {order.payment &&
                  Object.entries(order.payment).map(([k, v]) => (
                    <div
                      key={k}
                      className='flex items-start text-sm border-b border-dashed border-sidebar min-h-9 pt-2'
                    >
                      <span className='min-w-32 capitalize font-medium'>
                        {k}:
                      </span>
                      <span>
                        {typeof v === 'object'
                          ? Object.entries(v).map(([j, l]) => (
                              <div
                                key={j}
                                className='flex items-start text-sm border-b border-dashed border-sidebar min-h-9 pt-2'
                              >
                                <div className='mr-3 font-medium'>{j}:</div>
                                <div>
                                  {typeof l === 'object'
                                    ? Object.entries(l).map(([m, n]) => (
                                        <div
                                          key={m}
                                          className='flex items-center'
                                        >
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
              <div className='h-16  bg-alum/40 rounded-lg text-sm text-muted-foreground'>
                {order.customerNotes}
              </div>
            </div>
            <div className='space-y-4 pt-6 shrink-0'>
              {/* Actions */}
              <div className='flex gap-2 pt-2'>
                <Button
                  size='lg'
                  radius='none'
                  variant='flat'
                  onPress={handleCancel}
                  className='flex-1 text-base font-medium rounded-lg'
                  isDisabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size='lg'
                  radius='none'
                  variant='solid'
                  onPress={handleSave}
                  className='flex-1 text-base font-medium rounded-lg bg-dark-table text-white dark:text-dark-table dark:bg-white'
                  isLoading={isSaving}
                >
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
