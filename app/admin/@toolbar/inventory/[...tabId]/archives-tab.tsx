'use client'

import {MainTab, ToolbarButtonWrapper} from '@/app/admin/@toolbar/components'
import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'

const ArchivesContentInner = () => {
  const products = useQuery(api.products.q.listArchivedProducts, {limit: 100})

  return (
    <>
      <MainTab href='/admin/inventory/archives'>
        <PageTitle>Archives</PageTitle>
        <span className='px-1 h-6 min-w-8 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-sm font-space font-semibold'>
          <AnimatedNumber value={products?.length ?? 0} />
        </span>
      </MainTab>
      <ToolbarButtonWrapper>
        <div className='flex' />
      </ToolbarButtonWrapper>
    </>
  )
}

export const ArchivesContent = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <ArchivesContentInner />
    </Suspense>
  )
}
