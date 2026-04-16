import {ClassName} from '@/app/types'
import {OrderStatus, OrderType, PaymentMethod} from '@/convex/orders/d'
import {resolveOrderPayableTotalCents} from '@/lib/checkout/processing-fee'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatTimestamp} from '@/utils/date'
import {formatPrice} from '@/utils/formatPrice'
import Link from 'next/link'
import {useRouter} from 'next/navigation'

export const OrderListItem = ({order}: {order: OrderType}) => {
  const {orderNumber, items, orderStatus, createdAt, payment} = order
  const payableTotalCents = resolveOrderPayableTotalCents({
    paymentMethod: order.payment.method,
    totalCents: order.totalCents,
    processingFeeCents: order.processingFeeCents,
    totalWithCryptoFeeCents: order.totalWithCryptoFeeCents,
  })

  const router = useRouter()

  return (
    <Link
      href={`/account/orders/${orderNumber}`}
      className='group block'
      onMouseEnter={() => router.prefetch(`/account/orders/${orderNumber}`)}>
      <div className='grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2.5 rounded-xs border border-foreground/8 bg-background px-2 md:px-5 py-4 transition-colors duration-150 hover:bg-default-50/80 dark:border-foreground/10 dark:bg-dark-table/50 dark:hover:bg-dark-table/80'>
        {/* Row 1 left — date */}
        <span className='font-okxs text-sm font-medium'>
          {formatTimestamp(createdAt)}
        </span>

        {/* Row 1 right — price + chevron */}
        <div className='relative flex items-center justify-end gap-0.5 md:gap-3'>
          <Icon
            name='chevron-right'
            className={cn(
              'size-4 opacity-0 transition-all duration-250 group-hover:opacity-100',
              'absolute -top-2 md:-top-1.75 -right-1.75 md:-right-3.25 -rotate-23 translate-y-2 group-hover:translate-y-0 -translate-x-2 group-hover:translate-x-0',
            )}
          />
          <span className='font-okxs text-base font-semibold tabular-nums'>
            ${formatPrice(payableTotalCents)}
          </span>
        </div>

        {/* Row 2 left — order # · items · payment */}
        <div className='flex items-center gap-2 text-xs text-default-400'>
          <span className='font-mono tracking-widest'>
            #{orderNumber.substring(5)}
          </span>
          <span className='opacity-30'>·</span>
          <span className='font-okxs'>
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
          <span className='opacity-30'>·</span>
          <span className='flex items-center gap-1 md:gap-1.5 font-okxs'>
            <Icon
              name={paymentMethodIconMap[payment.method].icon}
              className={`size-3 ${paymentMethodIconMap[payment.method].style}`}
            />
            {mmap[payment.method]}
          </span>
        </div>

        {/* Row 2 right — status */}
        <StatusIndicator status={orderStatus} />
      </div>
    </Link>
  )
}

// ─── Status indicator ────────────────────────────────────────────────────────

const statusConfig: Record<
  OrderStatus,
  {label: string; dotClass: string; textClass: string}
> = {
  pending_payment: {
    label: 'Pending Payment',
    dotClass: 'bg-orange-300',
    textClass: 'text-orange-400 dark:text-orange-200',
  },
  order_processing: {
    label: 'Paid',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-500 dark:text-emerald-400',
  },
  awaiting_courier_pickup: {
    label: 'Awaiting Pickup',
    dotClass: 'bg-default-400',
    textClass: 'text-default-500',
  },
  resend: {
    label: 'Resend',
    dotClass: 'bg-orange-400',
    textClass: 'text-orange-500 dark:text-orange-400',
  },
  shipped: {
    label: 'Shipped',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-500 dark:text-emerald-400',
  },
  delivered: {
    label: 'Delivered',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
  cancelled: {
    label: 'Cancelled',
    dotClass: 'bg-rose-400',
    textClass: 'text-rose-500 dark:text-rose-400',
  },
}

const StatusIndicator = ({status}: {status: OrderStatus}) => {
  const {label, dotClass, textClass} = statusConfig[status]
  return (
    <span
      className={cn(
        'flex shrink-0 items-center gap-1 font-okxs text-xs justify-self-end',
        textClass,
      )}>
      <span className={cn('size-1.5 shrink-0 rounded-full', dotClass)} />
      {label}
    </span>
  )
}

// ─── Payment method maps ─────────────────────────────────────────────────────

const paymentMethodIconMap: Record<
  PaymentMethod,
  {icon: IconName; style: ClassName}
> = {
  cards: {icon: 'credit-card-2', style: 'text-foreground/60'},
  crypto_commerce: {icon: 'ethereum', style: 'text-indigo-400'},
  crypto_transfer: {icon: 'polygon', style: 'text-sky-500'},
  cash_app: {icon: 'cashapp', style: 'text-cashapp'},
}

export const mmap: Record<PaymentMethod, string> = {
  cards: 'Cards',
  crypto_transfer: 'Send Crypto',
  crypto_commerce: 'Pay with Crypto',
  cash_app: 'Cash App',
}
