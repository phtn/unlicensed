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

interface InternalErrorProps {
  errorId: string
}

export const InternalError = ({errorId}: InternalErrorProps) => {
  return (
    <ArcCard>
      <ArcHeader
        title='Internal Error'
        description={errorId}
        icon='hash'
        iconStyle='text-rose-400'
        status={<Icon name='alert-triangle' className='size-8 text-rose-400' />}
      />

      <ArcCallout type='error' value='Contact Support' icon='info' />
      <ArcError text='Failed initialized' />
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
