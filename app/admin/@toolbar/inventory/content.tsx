'use client'

import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {PageTitle} from '../../_components/ui/page-title'
import {ToolbarButtonWrapper, ToolbarWrapper} from '../components'

export const InventoryContent = () => {
  const products = useQuery(api.products.q.listProducts, {limit: 100})
  return (
    <ToolbarWrapper>
      <Link
        href='/admin/inventory'
        className='flex items-center w-full space-x-4'>
        <PageTitle>Inventory</PageTitle>
        {products ? (
          <div className='w-6 flex items-center justify-center aspect-square bg-neutral-200/40 rounded-md font-space'>
            <AnimatedNumber value={products?.length} />
          </div>
        ) : (
          <Icon name='spinners-ring' className='size-4' />
        )}
      </Link>
      <ToolbarButtonWrapper>
        <div className='flex' />
      </ToolbarButtonWrapper>
    </ToolbarWrapper>
  )
}
