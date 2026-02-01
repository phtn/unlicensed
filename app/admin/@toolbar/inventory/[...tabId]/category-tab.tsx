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

const CategoryContentInner = () => {
  const categories = useQuery(api.categories.q.listCategories)
  const [tabId] = useAdminTabId()
  const isCategoryRoute = tabId !== 'new'

  return (
    <>
      <Link
        href='/admin/inventory/category'
        prefetch
        className='flex items-center space-x-4 group'>
        <PageTitle>Categories</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            {
              'bg-emerald-500 dark:bg-emerald-500/80 text-white':
                isCategoryRoute,
            },
          )}>
          <AnimatedNumber value={categories?.length ?? 0} />
        </span>
      </Link>
      <ToolbarButtonWrapper>
        <PrimaryTab
          id='new'
          href='/admin/inventory/category?tabId=new'
          icon='plus'
          label='new category'
        />
      </ToolbarButtonWrapper>
    </>
  )
}

export const CategoryContent = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <CategoryContentInner />
    </Suspense>
  )
}
