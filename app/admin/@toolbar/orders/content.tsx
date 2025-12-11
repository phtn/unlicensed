'use client'

import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {useQuery} from 'convex/react'

export const Content = () => {
  const orders = useQuery(api.orders.q.getRecentOrders, {limit: 50})
  return (
    <div className='w-full flex items-center px-2 space-x-4'>
      <span className='tracking-tight text-base'>Orders</span>
      {orders ? (
        <div className='w-6 flex items-center justify-center aspect-square bg-light-gray/20 rounded-md font-space font-bold'>
          {orders?.length}
        </div>
      ) : (
        <Icon name='spinners-ring' className='size-4' />
      )}
    </div>
  )
}
