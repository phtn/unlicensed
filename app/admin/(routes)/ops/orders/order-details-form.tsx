'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {OrderStatus} from '@/convex/orders/d'
import {formatPrice} from '@/utils/formatPrice'
import {
  Button,
  Chip,
  ChipProps,
  Select,
  SelectItem,
  Textarea,
  User,
} from '@heroui/react'
import {useMutation} from 'convex/react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useEffect, useState} from 'react'
import {useSettingsPanelSafe} from '../../../_components/ui/settings'
import {useOrderDetailsSafe} from './order-details-context'

type Order = Doc<'orders'>

const statusColorMap: Record<string, ChipProps['color']> = {
  pending_payment: 'warning',
  order_processing: 'primary',
  awaiting_courier_pickup: 'secondary',
  shipping: 'default',
  resend: 'warning',
  shipped: 'success',
  cancelled: 'danger',
}

const statusOptions = [
  {value: 'pending_payment', label: 'Pending Payment'},
  {value: 'order_processing', label: 'Order Processing'},
  {value: 'awaiting_courier_pickup', label: 'Awaiting Courier Pickup'},
  {value: 'shipping', label: 'Shipping'},
  {value: 'resend', label: 'Resend'},
  {value: 'shipped', label: 'Shipped'},
  {value: 'cancelled', label: 'Cancelled'},
]

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

  const [status, setStatus] = useState(order.orderStatus)
  const [remarks, setRemarks] = useState(order.internalNotes || '')
  const [isSaving, setIsSaving] = useState(false)

  // Sync form state when order changes
  useEffect(() => {
    setStatus(order.orderStatus)
    setRemarks(order.internalNotes || '')
  }, [order._id, order.orderStatus, order.internalNotes])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateOrderStatus({
        orderId: order._id,
        status: status as OrderStatus,
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
            variant='flat'>
            {order.orderStatus
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </Chip>
        </div>
      )}

      {/* Order Info */}
      <div className='space-y-4 mb-2 overflow-y-auto'>
        {/* Customer Info */}
        <div className='rounded-xl border border-neutral-900/20 bg-white/80 dark:bg-purple-100/10 border-dotted px-3 pb-3 pt-2'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-space tracking-tight font-medium mb-2'>
              Customer
            </h3>
            {order.userId && (
              <p className='text-xs font-mono text-muted-foreground'>
                {order.userId.substring(0, 12)}
              </p>
            )}
          </div>
          <User
            name={
              <Link href={`/admin/ops/customers${order}`}>
                {order.contactEmail}
              </Link>
            }
            description={order.contactPhone}
            avatarProps={{
              fallback: order.contactEmail.slice(0, 2),
              size: 'sm',
            }}
            classNames={{
              name: 'lowercase',
              description: 'font-space text-mac-blue lowercase',
              base: 'uppercase',
            }}
          />
        </div>

        {/* Order Items */}
        <div className=''>
          <h3 className='text-sm font-bold tracking-tight mb-2 block'>Items</h3>
          <div className='h-[25lvh] overflow-y-scroll border border-neutral-500/60 border-dashed bg-white/80 dark:bg-purple-100/10 space-y-2 rounded-xl'>
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className='border-b-[0.5px] border-dotted border-neutral-500 flex justify-between items-start text-sm p-3 bg-fade'>
                <div className='flex-1 pr-4'>
                  <div className='font-medium flex items-center justify-between'>
                    <span>
                      <span className='font-light font-space opacity-80 mr-2'>
                        {idx + 1}
                      </span>
                      {item.productName}
                    </span>
                    <span className='font-light font-space text-xs text-muted-foreground'>
                      {item.quantity}
                      {item.denomination && ` × ${item.denomination}unit`}
                    </span>
                  </div>
                  {/*<p className='text-muted-foreground text-xs'>

                  </p>*/}
                </div>
                <p className='font-medium font-space'>
                  <span className='font-light'>$</span>
                  {formatPrice(item.totalPriceCents)}
                </p>
              </div>
            ))}
            <div className='px-3 pb-3'>
              <div className='space-y-1 text-sm'>
                <div className='flex justify-between'>
                  <span className='font-medium'>Subtotal</span>
                  <span className='font-space font-medium'>
                    <span className='font-light'>$</span>
                    {formatPrice(order.subtotalCents, 2)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='font-medium'>Tax</span>
                  <span className='font-space font-medium'>
                    <span className='font-light'>$</span>
                    {formatPrice(order.taxCents)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='font-medium'>Shipping</span>
                  <span className='font-space font-medium'>
                    <span className='font-light'>$</span>
                    {formatPrice(order.shippingCents)}
                  </span>
                </div>
                {order.discountCents && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Discount</span>
                    <span>-${formatPrice(order.discountCents)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className='flex justify-between py-2 border-b border-divider font-medium'>
          <h3 className='text-sm font-bold tracking-tight mb-2 block'>Total</h3>
          <span className='font-space'>
            <span className='font-light opacity-80'>$</span>
            {formatPrice(order.totalCents)}
          </span>
        </div>
        {/* Shipping Address */}
        <div className='flex items-start justify-between'>
          <h3 className='text-sm font-medium mb-2 block'>Shipping Address</h3>
          <div className='text-right text-sm text-muted-foreground'>
            <p>{order.shippingAddress.addressLine1}</p>
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.zipCode}
            </p>
          </div>
        </div>

        {/* Customer Notes */}
        {order.customerNotes && (
          <div>
            <h3 className='text-sm font-medium mb-2'>Customer Notes</h3>
            <p className='text-sm text-muted-foreground'>
              {order.customerNotes}
            </p>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className='space-y-4 pt-4 border-t border-divider shrink-0'>
        {/* Status */}
        <div>
          <label className='text-sm font-medium mb-2 block'>
            Update Status
          </label>
          <Select
            size='lg'
            selectedKeys={[status]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string
              setStatus(selected as OrderStatus)
            }}
            aria-label='Order status'>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} content={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Remarks */}
        <div>
          <label className='text-sm font-medium mb-2 block'>
            Internal Remarks
          </label>
          <Textarea
            value={remarks}
            onValueChange={setRemarks}
            placeholder='Add internal notes or remarks...'
            minRows={3}
            maxRows={6}
          />
        </div>

        {/* Actions */}
        <div className='flex gap-2 pt-2'>
          <Button
            size='lg'
            variant='flat'
            onPress={handleCancel}
            className='flex-1 text-base font-medium tracking-tight'
            isDisabled={isSaving}>
            Cancel
          </Button>
          <Button
            size='lg'
            color='primary'
            onPress={handleSave}
            className='flex-1 text-base font-medium tracking-tight'
            isLoading={isSaving}>
            <span className='drop-shadow-sm'>Save Changes</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
