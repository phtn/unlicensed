'use client'

import {Activity, ViewTransition} from 'react'

interface OrderStatusMessagesProps {
  isPending: boolean
  orderError: Error | null
  orderId: string | null
}

export function OrderStatusMessages({
  isPending,
  orderError,
}: OrderStatusMessagesProps) {
  return (
    <ViewTransition>
      <Activity mode={isPending ? 'visible' : 'hidden'}>
        {orderError && (
          <div className='p-3 bg-danger/10 border border-danger/20 rounded-lg'>
            <p className='text-sm text-danger'>
              {orderError.message || 'Failed to place order. Please try again.'}
            </p>
          </div>
        )}
      </Activity>
    </ViewTransition>
  )
}
