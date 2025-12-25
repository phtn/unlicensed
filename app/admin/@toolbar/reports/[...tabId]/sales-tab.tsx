'use client'

import {PrimaryTab, ToolbarButtonWrapper} from '@/app/admin/@toolbar/components'
import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Suspense} from 'react'

const SalesInner = () => {
  const sales = useQuery(api.orders.q.getOrdersByStatus, {status: 'delivered'})
  const [tabId] = useAdminTabId()
  const isProductRoute = tabId !== 'badges' && tabId !== 'new'

  return (
    <>
      <Link
        href='/admin/inventory/product'
        prefetch
        className='flex items-center space-x-4 group'>
        <PageTitle>Sales Report</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            {'bg-blue-500 dark:bg-blue-500 text-white': isProductRoute},
          )}>
          <AnimatedNumber value={sales?.length ?? 0} />
        </span>
      </Link>
      <ToolbarButtonWrapper>
        <PrimaryTab
          id='new'
          href='/admin/inventory/product?tabId=new'
          icon='arrow-down'
          label='Export'
        />
      </ToolbarButtonWrapper>
    </>
  )
}

export const SalesTab = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <SalesInner />
    </Suspense>
  )
}
