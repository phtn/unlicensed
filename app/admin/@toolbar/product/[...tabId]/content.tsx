'use client'

import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'

export const Content = () => {
  const products = useQuery(api.products.q.listProducts, {limit: 100})
  const route = usePathname().split('/').pop()
  return (
    <div className='flex text-base items-center justify-between w-full px-2'>
      <Link
        href='/admin/product'
        prefetch
        className='flex items-center space-x-1.5 group'>
        <span className=' group-hover:underline underline-offset-4 decoration-dashed decoration-[0.5px] tracking-tighter font-semibold'>
          Products
        </span>
        <span className='px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space'>
          {products?.length}
        </span>
      </Link>
      <div className='flex items-center space-x-1 md:space-x-4 px-4 text-base'>
        <Button
          as={Link}
          href='/admin/product/badges'
          prefetch
          disableRipple
          disableAnimation
          size='sm'
          className={cn(
            'dark:border-origin border-white bg-white dark:bg-transparent hover:bg-light-gray/15',
            {
              'text-blue-500 dark:text-blue-500 border-b border-blue-500 rounded-none border-x-0 border-t-0 bg-transparent hover:bg-white dark:hover:bg-transparent':
                route === 'badges',
            },
          )}>
          Badges
        </Button>
        <Button
          as={Link}
          href='/admin/product/new'
          prefetch
          size='sm'
          disableRipple
          disableAnimation
          variant='bordered'
          className={cn(
            'flex items-center px-0 dark:border-origin border-white dark:bg-zinc-700 bg-dark-gray/10 dark:hover:bg-blue-500 dark:hover:text-white dark:hover:opacity-100 tracking-tight -space-x-1 shrink-0',
            {
              'px-0 border-b border-emerald-500 border-t-0 border-x-0 text-emerald-600 rounded-none bg-transparent':
                route === 'new',
            },
          )}>
          <Icon name='plus' className='size-4' />
          <span>New</span>
        </Button>
      </div>
    </div>
  )
}
