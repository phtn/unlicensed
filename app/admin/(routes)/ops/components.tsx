import {api} from '@/convex/_generated/api'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@heroui/react'
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
          className='font-brk opacity-80 text-xs hover:underline hover:opacity-100 underline-offset-4 decoration-dotted decoration-foreground/40 hover:decoration-blue-500 dark:hover:decoration-primary'>
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
          'flex items-center uppercase justify-center rounded-sm w-fit py-1 font-brk shadow-none',
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
            'py-0.5 pr-1 outline-none',
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

export const paymentMethodCell = () => {
  const PaymentMethodCellComponent = (ctx: CellContext<Order, unknown>) => {
    const updatePayment = useMutation(api.orders.m.updatePayment)
    const method = ctx.row.original.payment?.method
    const payment = ctx.row.original.payment
    const orderStatus = ctx.row.original.orderStatus
    const [localMethod, setLocalMethod] = useState<OrderPaymentMethod | null>(
      method ?? null,
    )
    const [nextMethod, setNextMethod] = useState<OrderPaymentMethod | null>(
      null,
    )
    const [isUpdating, setIsUpdating] = useState(false)
    const {isOpen, onOpen, onClose} = useDisclosure()

    useEffect(() => {
      setLocalMethod(method ?? null)
      setNextMethod(null)
    }, [method])

    if (!localMethod || !payment) {
      return <span className='text-muted-foreground'>—</span>
    }

    const isEditable = orderStatus === 'pending_payment'

    const handleMethodSelection = (event: ChangeEvent<HTMLSelectElement>) => {
      const selectedMethod = event.target.value as OrderPaymentMethod
      if (selectedMethod === localMethod) return

      setNextMethod(selectedMethod)
      onOpen()
    }

    const handleCloseConfirm = () => {
      setNextMethod(null)
      onClose()
    }

    const handleConfirmMethodChange = async () => {
      if (!nextMethod || nextMethod === localMethod) {
        handleCloseConfirm()
        return
      }

      const previousMethod = localMethod
      setLocalMethod(nextMethod)
      setIsUpdating(true)

      try {
        await updatePayment({
          orderId: ctx.row.original._id,
          payment: {
            ...payment,
            method: nextMethod,
          },
        })
        handleCloseConfirm()
      } catch (error) {
        console.error('Failed to update payment method:', error)
        setLocalMethod(previousMethod)
      } finally {
        setIsUpdating(false)
      }
    }

    return (
      <>
        <div className='flex items-center justify-center'>
          <span
            className={cn(
              'inline-flex w-36 items-center justify-start gap-2.5 rounded-sm px-2 py-1 font-brk text-[11px] uppercase tracking-wide',
              paymentMethodClassMap[localMethod],
              {'gap-1': isEditable},
            )}>
            <Icon
              name={paymentMethodIconMap[localMethod]}
              className='size-3.5 shrink-0 opacity-85'
            />
            {isEditable ? (
              <select
                aria-label='Update payment method'
                value={localMethod}
                onChange={handleMethodSelection}
                disabled={isUpdating}
                className={cn(
                  'w-full bg-transparent border border-transparent rounded-sm',
                  'text-[11px] tracking-wide font-brk uppercase whitespace-nowrap',
                  'outline-none focus:border-foreground/20',
                  {
                    'cursor-wait opacity-70': isUpdating,
                  },
                )}>
                {paymentMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span>{paymentMethodLabelMap[localMethod]}</span>
            )}
          </span>
        </div>

        <Modal isOpen={isOpen} onClose={handleCloseConfirm} size='sm'>
          <ModalContent>
            <ModalHeader className='font-okxs font-semibold'>
              Confirm payment method update
            </ModalHeader>
            <ModalBody>
              <p className='text-sm text-muted-foreground'>
                Change payment method from{' '}
                {paymentMethodSelectionLabelMap[localMethod]} to{' '}
                {nextMethod
                  ? paymentMethodSelectionLabelMap[nextMethod]
                  : 'the selected method'}
                ?
              </p>
            </ModalBody>
            <ModalFooter className='gap-2'>
              <Button variant='flat' onPress={handleCloseConfirm}>
                Cancel
              </Button>
              <Button
                color='primary'
                onPress={() => void handleConfirmMethodChange()}
                isLoading={isUpdating}>
                Confirm
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    )
  }
  PaymentMethodCellComponent.displayName = 'PaymentMethodCell'
  return PaymentMethodCellComponent
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

export const courierAssignmentCell = () => {
  const CourierAssignmentCellComponent = (ctx: CellContext<Order, unknown>) => {
    const order = ctx.row.original

    return (
      <div className='flex items-center justify-center gap-0.5 whitespace-nowrap'>
        <CourierCell order={order} />
        <CourierAccountCell order={order} />
      </div>
    )
  }
  CourierAssignmentCellComponent.displayName = 'CourierAssignmentCell'
  return CourierAssignmentCellComponent
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
  {value: 'delivered', label: 'Delivered'},
  {value: 'resend', label: 'Resend'},
  {value: 'cancelled', label: 'Cancelled'},
]

const colorMap: Record<StatusCode, string> = {
  pending_payment: 'bg-amber-400/25 dark:bg-orange-300/45',
  order_processing: 'bg-sky-600/20 dark:bg-blue-400/45',
  awaiting_courier_pickup: 'bg-orange-200/65 dark:bg-rose-300/50',
  shipped: 'bg-emerald-400/35 dark:bg-emerald-400/35',
  delivered: 'bg-green-500/25 dark:bg-green-400/35',
  // shipping: 'bg-purple-200/70 dark:bg-purple-400/35',
  resend: 'bg-red-200/70 dark:bg-red-400/50',
  cancelled: 'dark:bg-red-400/40',
  default: 'bg-[#e8e6e5]',
}

type OrderPaymentMethod = Order['payment']['method']

const paymentMethodSelectionLabelMap: Record<OrderPaymentMethod, string> = {
  cards: 'Cards',
  crypto_transfer: 'Send',
  crypto_commerce: 'Crypto',
  cash_app: 'Cash App',
}

const paymentMethodOptions: Array<{value: OrderPaymentMethod; label: string}> =
  [
    {value: 'cards', label: paymentMethodSelectionLabelMap.cards},
    {
      value: 'crypto_transfer',
      label: paymentMethodSelectionLabelMap.crypto_transfer,
    },
    {
      value: 'crypto_commerce',
      label: paymentMethodSelectionLabelMap.crypto_commerce,
    },
    {value: 'cash_app', label: paymentMethodSelectionLabelMap.cash_app},
  ]

const paymentMethodLabelMap: Record<OrderPaymentMethod, string> = {
  cards: 'Cards',
  crypto_transfer: 'Send',
  crypto_commerce: 'Crypto',
  cash_app: 'Cashapp',
}

const paymentMethodIconMap: Record<OrderPaymentMethod, IconName> = {
  cards: 'credit-card-2',
  crypto_transfer: 'arrow-right',
  crypto_commerce: 'cash-fast',
  cash_app: 'cashapp',
}

const paymentMethodClassMap: Record<OrderPaymentMethod, string> = {
  cards:
    'bg-rose-500/10 text-neutral-800 dark:bg-rose-400/20 dark:text-neutral-200',
  crypto_transfer:
    'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/25 dark:text-indigo-200',
  crypto_commerce:
    'bg-ethereum/10 text-indigo-900/80 dark:bg-ethereum/25 dark:text-violet-200',
  cash_app:
    'bg-cashapp/10 text-emerald-900/80 dark:bg-emerald-400/25 dark:text-emerald-200',
}
