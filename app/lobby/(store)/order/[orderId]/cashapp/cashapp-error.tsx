import {
  ArcActionBar,
  ArcButtonLeft,
  ArcButtonRight,
  ArcCallout,
  ArcCard,
  ArcError,
  ArcHeader,
} from '@/components/expermtl/arc-card'
import {Icon} from '@/lib/icons'

interface CashAppErrorProps {
  errorId: string
}

export const CashAppError = ({errorId}: CashAppErrorProps) => {
  return (
    <ArcCard>
      <ArcHeader
        title='Payment Error'
        description={errorId}
        icon='hash'
        iconStyle='text-rose-400'
        status={<Icon name='alert-circle' className='size-8 text-rose-400' />}
      />

      <ArcCallout
        type='error'
        value='There was an issue processing your Cash App payment. Please try again or contact support.'
        icon='info'
      />
      <ArcError text='Payment Error' />
      <ArcActionBar>
        <ArcButtonLeft
          icon='chevron-left'
          label='View order'
          fn={() => window.history.back()}
        />
        <ArcButtonRight
          label='Try again?'
          fn={() => window.location.reload()}
        />
      </ArcActionBar>
    </ArcCard>
  )
}
