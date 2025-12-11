'use client'

import {PrimaryTab} from '@/app/admin/_components/toolbar-components'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'

export const Content = () => {
  const categories = useQuery(api.categories.q.listCategories)
  const route = usePathname().split('/').pop()
  return (
    <div className='flex text-base items-center justify-between w-full px-2'>
      <Link
        href='/admin/category'
        prefetch
        className='flex items-center space-x-4 group'>
        <span
          className={cn(
            'group-hover:underline underline-offset-4 decoration-dashed decoration-[0.5px] tracking-tighter font-medium text-base',
          )}>
          Categories
        </span>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            {
              'bg-emerald-500 dark:bg-emerald-500 text-white':
                route === 'category',
            },
          )}>
          <AnimatedNumber value={categories?.length ?? 0} />
        </span>
      </Link>
      <div className='flex items-center space-x-1 md:space-x-4 px-4 text-base'>
        <PrimaryTab
          id='new'
          href='/admin/category/new'
          route={route}
          icon='plus'
          label='new category'
        />
      </div>
    </div>
  )
}
