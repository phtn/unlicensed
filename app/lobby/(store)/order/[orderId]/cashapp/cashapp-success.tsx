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

interface PaymentMethodCellProps {
  method: string
}

const PaymentMethodCell = ({method}: PaymentMethodCellProps) => {
  return (
    <div className='rounded-md border border-foreground/10 bg-sidebar/50 p-3'>
      <div className='flex items-center justify-between text-sm'>
        <span className='font-brk opacity-80'>Payment Method</span>
        <span className='font-okxs capitalize'>{method}</span>
      </div>
    </div>
  )
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
      <PaymentMethodCell method='Cash App' />
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
