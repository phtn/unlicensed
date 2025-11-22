'use client'

import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {useQuery} from 'convex/react'

export const Content = () => {
  const sales = useQuery(api.orders.q.getOrdersByStatus, {status: 'delivered'})
  return (
    <div className='w-full'>
      {sales ? (
        <div className='w-6 flex items-center justify-center aspect-square bg-neutral-200/40 rounded-md font-space'>
          {sales?.length}
        </div>
      ) : (
        <Icon name='spinners-ring' className='size-4' />
      )}
    </div>
  )
}
