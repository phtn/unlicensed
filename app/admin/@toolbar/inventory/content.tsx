'use client'

import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {useQuery} from 'convex/react'

export const Content = () => {
  const products = useQuery(api.products.q.listProducts, {limit: 100})
  return (
    <div className='w-full flex items-center space-x-4 px-2 text-base tracking-tighter'>
      <h1>Inventory</h1>
      {products ? (
        <div className='w-6 flex items-center justify-center aspect-square bg-neutral-200/40 rounded-md font-space'>
          <AnimatedNumber value={products?.length} />
        </div>
      ) : (
        <Icon name='spinners-ring' className='size-4' />
      )}
    </div>
  )
}
