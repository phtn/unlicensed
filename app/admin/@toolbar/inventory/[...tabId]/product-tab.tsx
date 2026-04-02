'use client'

import {
  MainTab,
  PrimaryTab,
  SecondaryTab,
  ToolbarButtonWrapper,
} from '@/app/admin/@toolbar/components'
import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'

const ProductContentInner = () => {
  const productCount = useQuery(api.products.q.getActiveProductCount)
  const [tabId] = useAdminTabId()
  const isProductRoute = tabId !== 'settings' && tabId !== 'new'

  return (
    <>
      <MainTab href='/admin/inventory/product'>
        <PageTitle>Products</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-10 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-sm font-space font-semibold',
            {'bg-white dark:bg-white/10 text-blue-500': isProductRoute},
          )}>
          <AnimatedNumber value={productCount ?? 0} />
        </span>
      </MainTab>
      <ToolbarButtonWrapper>
        <SecondaryTab
          id='settings'
          href='/admin/inventory/product?tabId=settings'
          label='settings'
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
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <ProductContentInner />
    </Suspense>
  )
}
