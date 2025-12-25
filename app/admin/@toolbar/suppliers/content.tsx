'use client'

import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {ViewTransition} from 'react'
import {PageTitle} from '../../_components/ui/page-title'
import {PrimaryTab, ToolbarButtonWrapper, ToolbarWrapper} from '../components'

export const SuppliersContent = () => {
  const couriers = useQuery(api.couriers.q.listCouriers)
  return (
    <ToolbarWrapper>
      <Link
        href='/admin/suppliers/couriers'
        className='flex items-center w-full space-x-4'>
        <PageTitle>Couriers</PageTitle>
        <ViewTransition>
          {couriers ? (
            <div className='size-6 flex items-center justify-center aspect-square bg-foreground/8 rounded-md font-space font-medium text-base md:text-lg'>
              <AnimatedNumber value={couriers?.length} />
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
          icon='plus'
          label='New Courier'
        />
      </ToolbarButtonWrapper>
    </ToolbarWrapper>
  )
}
