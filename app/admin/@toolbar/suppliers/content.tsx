'use client'

import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {PrimaryTab, ToolbarButtonWrapper, ToolbarWrapper} from '../components'

export const SuppliersContent = () => {
  const couriers = useQuery(api.couriers.q.listCouriers)
  return (
    <ToolbarWrapper>
      <Link
        href='/admin/suppliers/logistics'
        className='flex items-center w-full space-x-4'>
        <h1
          className={cn(
            'group-hover:underline underline-offset-4 decoration-dotted decoration-[0.5px] decoration-foreground/60 tracking-tighter font-medium text-base',
          )}>
          Suppliers / Couriers
        </h1>
        {couriers ? (
          <div className='w-6 flex items-center justify-center aspect-square bg-neutral-200/40 rounded-md font-space'>
            <AnimatedNumber value={couriers?.length} />
          </div>
        ) : (
          <Icon name='spinners-ring' className='size-4' />
        )}
      </Link>
      <ToolbarButtonWrapper>
        <PrimaryTab
          id='new'
          href='/admin/suppliers/logistics?tabId=new'
          icon='plus'
          label='New'
        />
      </ToolbarButtonWrapper>
    </ToolbarWrapper>
  )
}
