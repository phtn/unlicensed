'use client'

import {PrimaryTab, ToolbarButtonWrapper} from '@/app/admin/@toolbar/components'
import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Suspense} from 'react'

const BlogpostInner = () => {
  const blogposts = useQuery(api.blogs.q.list)

  return (
    <>
      <Link
        href='/admin/cms/blog'
        prefetch
        className='flex items-center space-x-4 group'>
        <PageTitle>Blogpost</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
          )}>
          <AnimatedNumber value={blogposts?.length ?? 0} />
        </span>
      </Link>
      <ToolbarButtonWrapper>
        <PrimaryTab
          id='new'
          href='/admin/cms/blog?tabId=new'
          icon='plus'
          label='New Blogpost'
        />
      </ToolbarButtonWrapper>
    </>
  )
}

export const BlogpostTab = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <BlogpostInner />
    </Suspense>
  )
}
