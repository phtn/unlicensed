import {Button} from '@/components/ui/button'
import {Icon} from '@/lib/icons'
import Link from 'next/link'

export const QuickLinks = () => {
  return (
    <div className='flex flex-col items-stretch justify-center gap-3 font-clash sm:flex-row sm:flex-wrap sm:items-center'>
      <Button
        asChild
        size='lg'
        className='h-auto w-full rounded-none bg-brand px-6 py-3 text-base font-medium font-polysans text-white opacity-100 md:hover:bg-brand md:hover:text-white sm:w-auto sm:px-8 sm:py-4 dark:bg-brand dark:text-white dark:hover:text-white'>
        <Link href='/lobby' prefetch>
          Home
        </Link>
      </Button>
      <Button
        asChild
        size='lg'
        className='h-auto w-full rounded-none bg-brand px-6 py-3 text-base font-medium font-polysans text-white opacity-100 md:hover:bg-brand md:hover:text-white sm:w-auto sm:px-8 sm:py-4 dark:bg-white dark:text-dark-gray dark:hover:text-white'>
        <Link href='/account' prefetch>
          <span className='drop-shadow-xs'>Account</span>
        </Link>
      </Button>
      <Button
        asChild
        size='lg'
        className='h-auto w-full rounded-none bg-brand px-6 py-3 text-base font-medium font-polysans text-white opacity-100 md:hover:bg-brand md:hover:text-white sm:w-auto sm:px-8 sm:py-4 dark:bg-white dark:text-dark-gray dark:hover:text-white'>
        <Link href='/category' prefetch>
          <span className='drop-shadow-xs'>Browse by Category</span>
        </Link>
      </Button>
      <Button
        asChild
        size='lg'
        variant='ghost'
        className='h-auto w-full rounded-none border bg-light-gray/25 px-4 py-2 text-base font-medium font-polysans sm:flex sm:w-auto sm:items-center sm:gap-2 sm:px-8 sm:py-3 dark:border-light-gray/40 dark:bg-dark-gray/20 lg:text-lg'>
        <Link href='/lobby/products' prefetch>
          <span className='tracking-tight'>Product Search</span>
          <Icon name='search' className='dark:text-white' />
        </Link>
      </Button>
      <Button
        asChild
        size='lg'
        className='h-auto w-full rounded-none bg-terpenes px-6 py-3 text-base font-medium font-polysans text-white opacity-100 sm:w-auto sm:px-8 sm:py-4'>
        <Link href='/lobby/deals' prefetch>
          <span className='drop-shadow-xs'>Find Deals</span>
          <Icon name='box-bold' className='text-white' />
        </Link>
      </Button>
    </div>
  )
}
