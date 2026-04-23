'use client'

import {
  ArcCallout,
  ArcCard,
  ArcHeader,
  ArcLineItems,
  ArcMessage,
} from '@/components/expermtl/arc-card'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {
  CRYPTO_PAYMENT_DISCOUNT_PERCENT,
  formatProcessingFeePercent,
  resolveOrderPayableTotalCents,
} from '@/lib/checkout/processing-fee'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {useQuery} from 'convex/react'
import {useParams} from 'next/navigation'
import {pmmap} from '../../utils'

export const OrderSummaryWidget = () => {
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const order = useQuery(api.orders.q.getById, {id: orderId})
  const subtotalCents = order?.subtotalCents ?? 0
  const couponCode = order?.couponCode?.trim().toUpperCase()
  const couponDiscountCents = order?.couponDiscountCents ?? 0
  const paymentMethodDiscountCents = order?.paymentMethodDiscountCents ?? 0
  const redeemedStoreCreditCents = order?.redeemedStoreCreditCents ?? 0
  const taxCents = order?.taxCents ?? 0
  const shippingCents = order?.shippingCents ?? 0
  const processingFeeCents = order?.processingFeeCents ?? 0
  const additionalDiscountCents = Math.max(
    0,
    (order?.discountCents ?? 0) -
      couponDiscountCents -
      paymentMethodDiscountCents -
      redeemedStoreCreditCents,
  )
  const cryptoFeeCents = Math.max(
    0,
    (order?.totalWithCryptoFeeCents ??
      (order?.totalCents ?? 0) + (order?.cryptoFeeCents ?? 0)) -
      (order?.totalCents ?? 0) -
      processingFeeCents,
  )
  const totalCents = resolveOrderPayableTotalCents({
    paymentMethod: order?.payment.method,
    totalCents: order?.totalCents,
    processingFeeCents: order?.processingFeeCents,
    totalWithCryptoFeeCents: order?.totalWithCryptoFeeCents,
  })
  const paymentMethodDiscountLabel = `Crypto Discount (${formatProcessingFeePercent(
    CRYPTO_PAYMENT_DISCOUNT_PERCENT,
  )})`

  return (
    <main className='lg:w-3xl z-80'>
      <ArcCard className='md:h-160 md:rounded-xs'>
        <ArcHeader
          title={
            order?.payment.status === 'completed'
              ? 'Payment received!'
              : pmmap[order?.payment.method ?? 'crypto_commerce']
          }
          description={
            <div className='flex items-center justify-between w-full'>
              <div className='w-full'>{order?.orderNumber.substring(5)}</div>
              <div className='flex-1 whitespace-nowrap text-sm px-1'>
                {pmmap[order?.payment.method ?? 'crypto_commerce']}
              </div>
            </div>
          }
          icon='hash'
          iconStyle='text-indigo-400'
          status={
            <span
              className={cn(
                'font-brk text-orange-500 dark:text-orange-300 tracking-wide uppercase text-xs dark:bg-background/60 bg-slate-200/50 py-1 px-1.5 rounded-sm',
                {'text-emerald-500': order?.payment.status === 'completed'},
              )}>
              payment {order?.payment.status}
            </span>
          }
        />

        <div className='mt-2'>Summary</div>
        <ArcLineItems
          data={[
            {
              label: 'Subtotal',
              value: `$${formatPrice(subtotalCents)}`,
            },
            ...(taxCents > 0
              ? [
                  {
                    label: 'Tax',
                    value: `$${formatPrice(taxCents)}`,
                  },
                ]
              : []),
            {
              label: 'Shipping',
              value: shippingCents === 0 ? 'Free' : `$${formatPrice(shippingCents)}`,
            },
            ...(couponDiscountCents > 0
              ? [
                  {
                    label: couponCode ? `Coupon (${couponCode})` : 'Coupon',
                    value: `- $${formatPrice(couponDiscountCents)}`,
                  },
                ]
              : []),
            ...(paymentMethodDiscountCents > 0
              ? [
                  {
                    label: paymentMethodDiscountLabel,
                    value: `- $${formatPrice(paymentMethodDiscountCents)}`,
                  },
                ]
              : []),
            ...(redeemedStoreCreditCents > 0
              ? [
                  {
                    label: 'Rewards',
                    value: `- $${formatPrice(redeemedStoreCreditCents)}`,
                  },
                ]
              : []),
            ...(additionalDiscountCents > 0
              ? [
                  {
                    label: 'Additional Discount',
                    value: `- $${formatPrice(additionalDiscountCents)}`,
                  },
                ]
              : []),
            ...(processingFeeCents > 0
              ? [
                  {
                    label: 'Processing Fee',
                    value: `$${formatPrice(processingFeeCents)}`,
                  },
                ]
              : []),
            ...(cryptoFeeCents > 0
              ? [
                  {
                    label: 'Crypto Fee',
                    value: `$${formatPrice(cryptoFeeCents)}`,
                  },
                ]
              : []),
            {
              label: 'Total',
              value: `$${formatPrice(totalCents)}`,
            },
          ]}
        />

        <ArcCallout
          className='font-brk ps-4'
          icon={order?.payment.transactionId ? 'hash' : 'info'}
          value={
            (order?.payment.transactionId &&
              order.payment.transactionId.substring(0, 24) + ' ...') ??
            'Awaiting Payment'
          }
          type={order?.payment.transactionId ? 'success' : 'info'}
        />

        <div className='hidden _flex items-center space-x-2 text-base'>
          <Icon name='hash' className='size-5' />
          <ArcMessage>
            <div className='flex items-center text-left space-x-2 text-base'>
              <span>
                One of our associates will be in touch via our in-app{' '}
                <span className='font-medium underline decoration-dotted'>
                  chat messaging
                </span>
                .
              </span>
            </div>
          </ArcMessage>
        </div>
      </ArcCard>
    </main>
  )
}
