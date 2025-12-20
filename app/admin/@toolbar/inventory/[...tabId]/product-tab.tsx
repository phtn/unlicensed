'use client'

import {
  PrimaryTab,
  SecondaryTab,
  ToolbarButtonWrapper,
} from '@/app/admin/@toolbar/components'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Suspense} from 'react'

const ProductContentInner = () => {
  const products = useQuery(api.products.q.listProducts, {limit: 100})
  const [tabId] = useAdminTabId()
  const isProductRoute = tabId !== 'badges' && tabId !== 'new'

  return (
    <>
      <Link
        href='/admin/inventory/product'
        prefetch
        className='flex items-center space-x-4 group'>
        <span
          className={cn(
            'group-hover:underline underline-offset-4 decoration-dashed decoration-[0.5px] tracking-tighter font-medium',
          )}>
          Products
        </span>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            {'bg-blue-500 dark:bg-blue-500 text-white': isProductRoute},
          )}>
          <AnimatedNumber value={products?.length ?? 0} />
        </span>
      </Link>
      <ToolbarButtonWrapper>
        <SecondaryTab
          id='badges'
          href='/admin/inventory/product?tabId=badges'
          label='Badges'
        />
        <PrimaryTab
          id='new'
          href='/admin/inventory/product?tabId=new'
          icon='plus'
          label='New'
        />
      </ToolbarButtonWrapper>
    </>
  )
}

export const ProductContent = () => {
  return (
    <Suspense fallback={<div className='flex text-base items-center justify-between w-full px-2' />}>
      <ProductContentInner />
    </Suspense>
  )
}
