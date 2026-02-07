import {
  ArcActionBar,
  ArcButtonFull,
  ArcCard,
  ArcHeader,
  ArcLineItems,
  ArcLoader,
} from '@/components/expermtl/arc-card'
import {Doc} from '@/convex/_generated/dataModel'
import {formatPrice} from '@/utils/formatPrice'
import {useMemo} from 'react'

interface PaymentProcessingProps {
  order: Doc<'orders'>
  loading: boolean
}

export const PaymentProcessing = ({order, loading}: PaymentProcessingProps) => {
  const payItems = useMemo(
    () =>
      [
        {
          label: 'Total Amount',
          value: '$' + formatPrice(order?.totalCents ?? 0),
        },
        {
          label: 'Payment Method',
          value: order?.payment?.method.split('_').join(' '),
        },
      ] as Array<{label: string; value: string}>,
    [order],
  )
  return (
    <ArcCard>
      <ArcHeader
        title='Processing Payment'
        description={order.orderNumber}
        icon='hash'
        iconStyle='text-indigo-400'
      />
      <ArcLineItems data={payItems} />

      <ArcLoader loading={loading}>
        <p className='text-base'>
          {loading ? 'Initializing payment' : 'Payment initialized'}
        </p>
      </ArcLoader>
      <ArcActionBar>
        <ArcButtonFull
          label='Cancel'
          href={`/account/orders/${order.orderNumber}`}
        />
      </ArcActionBar>
    </ArcCard>
  )
}
