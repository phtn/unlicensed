'use client'

import {
  ArcActionBar,
  ArcButtonFull,
  ArcButtonLeft,
  ArcCallout,
  ArcCard,
  ArcHeader,
  ArcError,
} from '@/components/expermtl/arc-card'
import {Icon} from '@/lib/icons'
import {useSearchParams} from 'next/navigation'
import {Suspense, useMemo} from 'react'

const errorMessages: Record<string, {title: string; message: string}> = {
  missing_parameters: {
    title: 'Missing Information',
    message: 'Required payment information is missing. Please try again.',
  },
  order_not_found: {
    title: 'Order Not Found',
    message: 'We couldn\'t find your order. Please check your order number.',
  },
  callback_failed: {
    title: 'Payment Processing Error',
    message: 'There was an error processing your payment callback. Please contact support.',
  },
  default: {
    title: 'Payment Error',
    message: 'An unexpected error occurred. Please try again or contact support.',
  },
}

function PaymentErrorContent() {
  const searchParams = useSearchParams()
  const errorType = searchParams.get('error') || 'default'

  const errorInfo = useMemo(
    () => errorMessages[errorType] || errorMessages.default,
    [errorType],
  )

  return (
    <div className='min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8'>
      <ArcCard>
        <ArcHeader
          title={errorInfo.title}
          description='Payment Issue'
          icon='hash'
          iconStyle='text-rose-400'
          status={<Icon name='alert-circle' className='size-8 text-rose-400' />}
        />

        <ArcCallout
          type='error'
          value={errorInfo.message}
          icon='info'
        />

        <ArcError text={errorInfo.title} />

        <ArcActionBar>
          <ArcButtonLeft
            icon='chevron-left'
            label='Go Home'
            href='/'
          />
          <ArcButtonFull
            label='Contact Support'
            href='/account'
          />
        </ArcActionBar>
      </ArcCard>
    </div>
  )
}

export default function PaymentErrorPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8'>
          <ArcCard>
            <ArcHeader
              title='Loading...'
              description='Payment Issue'
              icon='hash'
              iconStyle='text-rose-400'
              status={<Icon name='alert-circle' className='size-8 text-rose-400' />}
            />
          </ArcCard>
        </div>
      }
    >
      <PaymentErrorContent />
    </Suspense>
  )
}
