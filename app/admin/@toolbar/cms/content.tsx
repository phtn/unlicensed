'use client'

import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {PageTitle} from '../../_components/ui/page-title'
import {PrimaryTab, ToolbarButtonWrapper, ToolbarWrapper} from '../components'

export const BlogpostTabContent = () => {
  const sales = useQuery(api.orders.q.getOrdersByStatus, {status: 'shipped'})
  return (
    <ToolbarWrapper>
      <Link
        href='/admin/cms/blog'
        className='flex items-center w-full space-x-4'>
        <PageTitle>Blogpost</PageTitle>
        {sales ? (
          <div className='w-6 flex items-center justify-center aspect-square bg-neutral-200/40 rounded-md font-space'>
            <AnimatedNumber value={sales?.length} />
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
