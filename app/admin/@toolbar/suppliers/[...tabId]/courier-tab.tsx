'use client'

import {
  SecondaryTab,
  ToolbarButtonWrapper,
} from '@/app/admin/@toolbar/components'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Suspense} from 'react'

const CourierInner = () => {
  const couriers = useQuery(api.couriers.q.listCouriers)

  return (
    <>
      <Link
        href='/admin/suppliers/couriers'
        prefetch
        className='flex items-center space-x-4 group'>
        <span
          className={cn(
            'group-hover:underline underline-offset-4 decoration-dashed decoration-[0.5px] tracking-tighter font-medium',
          )}>
          Couriers
        </span>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
          )}>
          <AnimatedNumber value={couriers?.length ?? 0} />
        </span>
      </Link>
      <ToolbarButtonWrapper>
        <SecondaryTab
          id='new'
          href='/admin/suppliers/logistics?tabId=new'
          icon='plus'
          label='New Courier'
        />
      </ToolbarButtonWrapper>
    </>
  )
}

export const CourierTab = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <CourierInner />
    </Suspense>
  )
}
