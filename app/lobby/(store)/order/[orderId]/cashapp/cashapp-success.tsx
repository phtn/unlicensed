import {
  ArcActionBar,
  ArcButtonFull,
  ArcCallout,
  ArcCard,
  ArcHeader,
  ArcSuccess,
} from '@/components/expermtl/arc-card'
import {Icon} from '@/lib/icons'

interface CashAppSuccessProps {
  orderId?: string
}

export const CashAppSuccess = ({orderId}: CashAppSuccessProps) => {
  return (
    <ArcCard>
      <ArcHeader
        title='Payment Success'
        description={orderId}
        icon='hash'
        iconStyle='text-featured'
        status={<Icon name='check-fill' className='size-8 text-terpenes' />}
      />

      <ArcCallout
        type='success'
        value='Your Cash App payment has been processed successfully!'
        icon='check'
      />
      <ArcSuccess text='Payment Successful' />
      <ArcActionBar>
        <ArcButtonFull
          label='View Order'
          href={`/account/orders/${orderId}`}
        />
      </ArcActionBar>
    </ArcCard>
  )
}
