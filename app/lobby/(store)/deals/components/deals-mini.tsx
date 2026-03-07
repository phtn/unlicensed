import {StoreCategory} from '@/app/types'
import {Icon} from '@/lib/icons'
import {Button, Link} from '@heroui/react'
import NextLink from 'next/link'
import {ViewTransition} from 'react'

interface Props {
  categories: StoreCategory[]
}

export const DealsMini = ({categories}: Props) => {
  return (
    <section
      id='deals-bundle'
      aria-labelledby='deals-bundle-heading'
      className='mx-auto w-full md:max-w-7xl py-12 sm:py-16 md:py-20 px-2 sm:px-4'>
      <div className='relative rounded-[36px] bg-slate-200 dark:bg-dark-table/50 border border-foreground/20 sm:px-12 sm:py-16 transition-colors px-6 py-10'>
        <div className="absolute w-full inset-0 bg-[url('/svg/noise.svg')] opacity-10 scale-100 pointer-events-none rounded-[36px]" />
        <div className='grid gap-12 lg:grid-cols-5 lg:items-center'>
          <div className='space-y-10 lg:col-span-3'>
            <div className='flex font-polysans font-thin bg-black text-base text-white px-4 py-1.5 rounded-full w-fit'>
              DEALS & BUNDLES
            </div>
            <h2
              id='deals-bundle-heading'
              className='text-4xl font-medium text-foreground tracking-tight sm:text-4xl max-w-[28ch] font-polysans py-12 sm:py-1'>
              Build your own Oz.{' '}
              <span className='text-terpenes'>Mix & match</span> strains, save
              more.
            </h2>
            <p className='hidden md:flex text-base opacity-60 max-w-[54ch]'>
              Save more when you mix and match custom bundles — choose your
              size, pick your strains.
            </p>

            <ViewTransition enter='auto'>
              <Button
                as={NextLink}
                size='lg'
                radius='full'
                disableRipple
                variant='solid'
                href='/lobby/deals'
                className='px-0 flex items-center justify-center md:justify-start w-full bg-transparent text-sm font-semibold dark:border-light-gray uppercase tracking-[0.35em]'>
                <div className='flex items-center justify-start'>
                  <div className='w-12 h-12 mr-2 border border-foreground/70 rounded-full flex items-center justify-center'>
                    <Icon name='arrow-down' className='rotate-115 size-8' />
                  </div>
                  <span className='px-4 text-base md:text-lg font-light font-brk'>
                    Bundle Builder
                  </span>
                </div>
              </Button>
            </ViewTransition>
          </div>
          <div className='hidden md:grid gap-4 sm:grid-cols-2 lg:col-span-2'>
            {categories.map((category) => (
              <ViewTransition key={category.slug} enter='auto'>
                <Link
                  href={`/lobby/category/${category.slug}`}
                  className='group relative overflow-hidden rounded-3xl border border-foreground/10 dark:bg-black bg-slate-500/15 p-5 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-panel/40'>
                  <div className='flex flex-col gap-3'>
                    <span className='text-xs uppercase font-polysans font-semibold opacity-80 dark:text-light-gray text-dark-gray'>
                      {category.slug}
                    </span>

                    <p className='text-sm dark:text-muted-foreground max-w-[40ch] line-clamp-2 text-dark-gray'>
                      {category.description}
                    </p>
                  </div>
                  <span className='absolute right-4 top-4 text-xs font-semibold text-color-muted transition group-hover:text-foreground dark:text-brand text-dark-gray'>
                    <Icon name='chevron-right' className='size-4' />
                  </span>
                </Link>
              </ViewTransition>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
