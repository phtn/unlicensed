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
import {CashAppPaymentSDK} from './cashapp-payment-sdk'

interface CashAppProcessingProps {
  order: Doc<'orders'>
  loading: boolean
  paymentConfig?: {
    paymentId?: string
    applicationId?: string
    locationId?: string
  } | null
  onPaymentSuccess?: () => void
  onPaymentError?: (error: string) => void
}

export const CashAppProcessing = ({
  order,
  loading,
  paymentConfig,
  onPaymentSuccess,
  onPaymentError,
}: CashAppProcessingProps) => {
  const payItems = useMemo(
    () =>
      [
        {
          label: 'Total Amount',
          value: '$' + formatPrice(order?.totalCents ?? 0),
        },
        {
          label: 'Payment Method',
          value: 'Cash App',
        },
      ] as Array<{label: string; value: string}>,
    [order],
  )

  return (
    <ArcCard>
      <ArcHeader
        title='Cash App Payment'
        description={order.orderNumber}
        icon='hash'
        iconStyle='text-indigo-400'
      />
      <ArcLineItems data={payItems} />

      <ArcLoader loading={loading}>
        <p className='text-base'>
          {loading
            ? 'Initializing Cash App payment...'
            : 'Ready to complete payment with Cash App'}
        </p>
      </ArcLoader>

      {!loading && paymentConfig?.applicationId && (
        <div className='px-4 py-6'>
          <CashAppPaymentSDK
            applicationId={paymentConfig.applicationId}
            locationId={paymentConfig.locationId}
            amountCents={order.totalCents}
            orderId={order.orderNumber}
            onSuccess={() => {
              onPaymentSuccess?.()
            }}
            onError={(error) => {
              onPaymentError?.(error)
            }}
          />
        </div>
      )}

      <ArcActionBar>
        <ArcButtonFull
          label='Cancel'
          href={`/account/orders/${order._id}`}
        />
      </ArcActionBar>
    </ArcCard>
  )
}
