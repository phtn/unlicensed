'use client'

import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {PageTitle} from '../../_components/ui/page-title'
import {PrimaryTab, ToolbarButtonWrapper, ToolbarWrapper} from '../components'

export const BlogpostTabContent = () => {
  const shippedSales = useQuery(api.orders.q.getOrdersByStatus, {
    status: 'shipped',
  })
  const deliveredSales = useQuery(api.orders.q.getOrdersByStatus, {
    status: 'delivered',
  })
  const salesCount = (shippedSales?.length ?? 0) + (deliveredSales?.length ?? 0)
  const isLoading = shippedSales === undefined || deliveredSales === undefined
  return (
    <ToolbarWrapper>
      <Link
        href='/admin/cms/blog'
        className='flex items-center w-full space-x-4'>
        <PageTitle>Blogpost</PageTitle>
        {!isLoading ? (
          <div className='w-6 flex items-center justify-center aspect-square bg-neutral-200/40 rounded-md font-space'>
            <AnimatedNumber value={salesCount} />
          </div>
        ) : (
          <Icon name='spinners-ring' className='size-4' />
        )}
      </Link>
      <ToolbarButtonWrapper>
        <PrimaryTab
          id='new'
          href='/admin/cms/blogpost?tabId=new'
          icon='arrow-down'
          label='Export'
        />
      </ToolbarButtonWrapper>
    </ToolbarWrapper>
  )
}
