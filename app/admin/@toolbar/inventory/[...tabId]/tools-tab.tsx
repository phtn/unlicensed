'use client'

import {ToolbarButtonWrapper} from '@/app/admin/@toolbar/components'
import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Suspense} from 'react'

const ToolsContentInner = () => {
  const categories = useQuery(api.categories.q.listCategories)
  const [tabId] = useAdminTabId()
  const isCategoryRoute = tabId !== 'new'

  return (
    <>
      <Link
        href='/admin/inventory/tools'
        prefetch
        className='flex items-center space-x-4 group'>
        <PageTitle>Tools</PageTitle>
      </Link>
      <ToolbarButtonWrapper></ToolbarButtonWrapper>
    </>
  )
}

export const ToolsContent = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <ToolsContentInner />
    </Suspense>
  )
}
