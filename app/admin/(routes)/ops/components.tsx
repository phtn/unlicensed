import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {CellContext} from '@tanstack/react-table'
import {useMutation} from 'convex/react'
import Link from 'next/link'
import {ChangeEvent, useEffect, useState} from 'react'
import {CourierAccountCell} from './orders/courier-account-cell'
import {CourierCell} from './orders/courier-cell'
import type {Order, OrderStatusCode, StatusCode} from './types'

export const orderNumberCell = () => {
  const OrderNumberCellComponent = (ctx: CellContext<Order, unknown>) => {
    const orderNumber = ctx.getValue() as string | undefined
    if (!orderNumber) return <span className='text-muted-foreground'>—</span>

    return (
      <div className='flex flex-col w-fit'>
        <Link
          color='foreground'
          prefetch
          href={`/admin/ops/orders/${orderNumber}`}
          className='font-mono opacity-80 text-sm hover:underline underline-offset-2 decoration-dotted decoration-foreground/40'>
          {orderNumber.substring(5)}
        </Link>
      </div>
    )
  }
  OrderNumberCellComponent.displayName = 'OrderNumberCell'
  return OrderNumberCellComponent
}

export const statusCell = () => {
  const StatusCellComponent = (ctx: CellContext<Order, unknown>) => {
    const updateOrderStatus = useMutation(api.orders.m.updateOrderStatus)
    const status = ctx.getValue() as OrderStatusCode | undefined
    const [localStatus, setLocalStatus] = useState<OrderStatusCode | null>(
      status ?? null,
    )
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
      setLocalStatus(status ?? null)
    }, [status])

    if (!status || !localStatus) {
      return <span className='text-muted-foreground'>—</span>
    }

    const handleStatusChange = async (
      event: ChangeEvent<HTMLSelectElement>,
    ) => {
      const nextStatus = event.target.value as OrderStatusCode
      if (nextStatus === localStatus) return

      const previousStatus = localStatus
      setLocalStatus(nextStatus)
      setIsUpdating(true)

      try {
        await updateOrderStatus({
          orderId: ctx.row.original._id,
          status: nextStatus,
        })
      } catch (error) {
        console.error('Failed to update order status:', error)
        setLocalStatus(previousStatus)
      } finally {
        setIsUpdating(false)
      }
    }

    const normalizedStatus = localStatus.toLowerCase() as StatusCode
    const color = colorMap[normalizedStatus] || colorMap.default

    return (
      <div
        className={cn(
          'flex items-center uppercase justify-center rounded-sm w-fit px-1 py-1 font-mono shadow-none',
          color,
        )}>
        <select
          aria-label='Update order status'
          value={localStatus}
          onChange={(event) => void handleStatusChange(event)}
          disabled={isUpdating}
          className={cn(
            'bg-transparent border border-transparent rounded-sm',
            'text-sm tracking-wider font-brk uppercase whitespace-nowrap',
            'px-1.5 py-0.5 pr-6 outline-none',
            'focus:border-foreground/20',
            {
              'cursor-wait opacity-70': isUpdating,
            },
          )}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value} className='text-lg'>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
  StatusCellComponent.displayName = 'StatusCell'
  return StatusCellComponent
}

export function customerCell() {
  const CustomerCellComponent = (ctx: CellContext<Order, unknown>) => {
    const email = ctx.getValue() as string | undefined
    if (!email) return <span className='text-muted-foreground'>—</span>

    return (
      <div className='flex flex-col'>
        <p className='tracking-tight font-medium text-sm'>{email}</p>
      </div>
    )
  }
  CustomerCellComponent.displayName = 'CustomerCell'
  return CustomerCellComponent
}

export const courierCell = () => {
  const CourierCellComponent = (ctx: CellContext<Order, unknown>) => {
    const order = ctx.row.original

    return (
      <div className='flex items-center justify-center'>
        <CourierCell order={order} />
      </div>
    )
  }
  CourierCellComponent.displayName = 'CourierCell'
  return CourierCellComponent
}

export const courierAccountCell = () => {
  const CourierAccountCellComponent = (ctx: CellContext<Order, unknown>) => {
    const order = ctx.row.original

    return (
      <div className='flex items-center justify-center'>
        <CourierAccountCell order={order} />
      </div>
    )
  }
  CourierAccountCellComponent.displayName = 'CourierAccountCell'
  return CourierAccountCellComponent
}

const statusOptions: Array<{value: OrderStatusCode; label: string}> = [
  {value: 'pending_payment', label: 'Pending Payment'},
  {value: 'order_processing', label: 'Order Processing'},
  {value: 'awaiting_courier_pickup', label: 'Awaiting Courier Pickup'},
  // {value: 'shipping', label: 'Shipping'},
  {value: 'shipped', label: 'Shipped'},
  {value: 'resend', label: 'Resend'},
  {value: 'cancelled', label: 'Cancelled'},
]

const colorMap: Record<StatusCode, string> = {
  pending_payment: 'bg-amber-400/25 dark:bg-orange-300/45',
  order_processing: 'bg-sky-600/20 dark:bg-blue-400/45',
  awaiting_courier_pickup: 'bg-orange-200/65 dark:bg-rose-300/50',
  shipped: 'bg-emerald-400/35 dark:bg-emerald-400/35',
  // shipping: 'bg-purple-200/70 dark:bg-purple-400/35',
  resend: 'bg-red-200/70 dark:bg-red-400/50',
  cancelled: 'dark:bg-red-400/40',
  default: 'bg-[#e8e6e5]',
}
