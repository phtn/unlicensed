'use client'

import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {ViewTransition} from 'react'
import {PageTitle} from '../../_components/ui/page-title'
import {PrimaryTab, ToolbarButtonWrapper, ToolbarWrapper} from '../components'

export const ReportsTabContent = () => {
  const sales = useQuery(api.orders.q.getOrdersByStatus, {status: 'delivered'})
  return (
    <ToolbarWrapper>
      <Link
        href='/admin/suppliers/logistics'
        className='flex items-center w-full space-x-4'>
        <PageTitle>Sales Report</PageTitle>
        <ViewTransition>
          {sales ? (
            <div className='w-6 flex items-center justify-center aspect-square bg-neutral-200/40 rounded-md font-space'>
              <AnimatedNumber value={sales?.length} />
            </div>
          ) : (
            <Icon name='spinners-ring' className='size-4' />
          )}
        </ViewTransition>
      </Link>
      <ToolbarButtonWrapper>
        <PrimaryTab
          id='new'
          href='/admin/suppliers/logistics?tabId=new'
          icon='arrow-down'
          label='Export'
        />
      </ToolbarButtonWrapper>
    </ToolbarWrapper>
  )
}
