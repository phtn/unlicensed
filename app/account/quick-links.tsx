import {Icon} from '@/lib/icons'
import {Button} from '@/lib/heroui'
import Link from 'next/link'

export const QuickLinks = () => {
  return (
    <div className='flex flex-col items-stretch justify-center gap-3 font-clash sm:flex-row sm:flex-wrap sm:items-center'>
      <Button
        as={Link}
        href='/lobby'
        radius='none'
        prefetch
        size='lg'
        className='w-full sm:w-auto dark:bg-brand opacity-100 dark:text-white md:hover:bg-brand dark:hover:text-white bg-brand md:hover:text-white text-white font-polysans font-medium px-6 sm:px-8 py-3 sm:py-4 text-base'>
        Home
      </Button>
      <Button
        as={Link}
        href='/account'
        radius='none'
        prefetch
        size='lg'
        className='w-full sm:w-auto dark:bg-white opacity-100 dark:text-dark-gray md:hover:bg-brand dark:hover:text-white bg-brand md:hover:text-white text-white font-polysans font-medium px-6 sm:px-8 py-3 sm:py-4 text-base'>
        <span className='drop-shadow-xs'>Account</span>
      </Button>
      <Button
        as={Link}
        href='/category'
        radius='none'
        prefetch
        size='lg'
        className='w-full sm:w-auto dark:bg-white opacity-100 dark:text-dark-gray md:hover:bg-brand dark:hover:text-white bg-brand md:hover:text-white text-white font-polysans font-medium px-6 sm:px-8 py-3 sm:py-4 text-base'>
        <span className='drop-shadow-xs'>Browse by Category</span>
      </Button>
      <Button
        size='lg'
        as={Link}
        href={'/lobby/products'}
        prefetch
        radius='none'
        variant='tertiary'
        endContent={<Icon name={'search'} className='dark:text-white' />}
        className='w-full sm:w-auto border dark:border-light-gray/40 sm:flex items-center gap-2 font-polysans font-medium bg-light-gray/25 dark:bg-dark-gray/20 px-4 sm:px-8 py-2 sm:py-3 text-base lg:text-lg'>
        <span className='tracking-tight'>Product Search</span>
      </Button>
      <Button
        as={Link}
        href='/lobby/deals'
        prefetch
        radius='none'
        size='lg'
        endContent={<Icon name='box-bold' className=' text-white' />}
        className='w-full sm:w-auto bg-terpenes opacity-100 text-white font-polysans font-medium px-6 sm:px-8 py-3 sm:py-4 text-base'>
        <span className='drop-shadow-xs'>Find Deals</span>
      </Button>
    </div>
  )
}
