'use client'

import {StoreCategory} from '@/app/types'
import {Tag} from '@/components/base44/tag'
import {Title} from '@/components/base44/title'
import {api} from '@/convex/_generated/api'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {adaptCategory} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {Button, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Activity, useMemo} from 'react'

interface ContentProps {
  initialCategories: StoreCategory[]
}

export const Content = ({initialCategories}: ContentProps) => {
  const categoriesQuery = useQuery(api.categories.q.listCategories)

  const categories = useMemo(() => {
    const nextCategories = categoriesQuery?.map(adaptCategory)
    if (nextCategories && nextCategories.length > 0) {
      return nextCategories
    }
    return initialCategories
  }, [initialCategories, categoriesQuery])

  // Get all heroImage storage IDs for URL resolution
  const heroImageIds = useMemo(
    () =>
      categories
        .map((c) => c.heroImage)
        .filter((img): img is string => !!img && !img.startsWith('http')),
    [categories],
  )

  // Resolve storageIds to URLs
  const resolveUrl = useStorageUrls(heroImageIds)

  return (
    <div className='min-h-screen overflow-x-hidden'>
      {/* Hero Section */}
      <section className='py-8 sm:py-14 lg:py-16 xl:py-24 2xl:py-28 px-4 sm:px-6 bg-background'>
        <div className='max-w-7xl mx-auto overflow-hidden'>
          <div className='grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center'>
            <div className=''>
              <Tag text='Categories' />
              <Title title='Experience by Category' subtitle='' />
              <p className='hidden sm:flex text-sm sm:text-base lg:text-base opacity-60 mb-8 sm:mb-8 lg:mb-12 max-w-md leading-relaxed'>
                Different doors to the same room. Where your pulse syncs with
                the universe&apos;s paced drumbeats.
              </p>

              <div className='hidden sm:flex items-center gap-3 sm:gap-4 lg:gap-5 relative z-50 flex-wrap'>
                <Button
                  as={Link}
                  href={'/lobby/strain-finder'}
                  prefetch
                  size='lg'
                  className='dark:bg-white opacity-100 dark:text-dark-gray hover:bg-brand dark:hover:text-white bg-brand hover:text-white text-white font-medium px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base lg:text-lg'>
                  <span className='drop-shadow-xs'>Strain Finder</span>
                </Button>
                <Button
                  size='lg'
                  as={Link}
                  href={'/lobby/brands'}
                  prefetch
                  variant='light'
                  className='hidden border dark:border-dark-gray sm:flex items-center gap-2 dark:text-brand font-medium bg-light-gray/25 dark:bg-dark-gray/20 px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base lg:text-lg'>
                  <span className='tracking-tight'>Shop by Brand</span>
                  <Icon
                    name='arrow-right'
                    className='w-3 h-3 sm:w-4 sm:h-4 dark:text-white'
                  />
                </Button>
              </div>
            </div>

            <div className='relative flex items-center justify-center lg:justify-end h-[40vh] sm:h-[45vh] lg:h-[50lvh] overflow-visible'>
              <div className='h-80 md:h-120 w-full flex items-center justify-center'>
                <div className='w-full max-w-lg'>
                  <Image
                    src='/rf-layer-latest.png'
                    className='w-full h-full object-cover'
                    alt='branding-rapid-fire'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className='py-6 sm:py-8 px-4 sm:px-6 pb-20 sm:pb-24 lg:pb-32'>
        <div className='max-w-7xl mx-auto rounded-3xl'>
          <Activity mode={categories.length === 0 ? 'visible' : 'hidden'}>
            <div className='max-w-7xl mx-auto pt-20'>
              <div className='flex flex-col items-center justify-center gap-4 px-6 py-24 text-center'>
                <Title
                  titleStyle='lowercase'
                  title='Nothing here yet.'
                  subtitle={
                    <div className='flex items-center relative'>
                      <Icon
                        name='chevron-double-left'
                        className='rotate-90 size-12 text-featured opacity-100 relative z-30'
                      />
                      <span>check back soon</span>
                    </div>
                  }
                />
              </div>
            </div>
          </Activity>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full'>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/lobby/category/${category.slug}`}
                prefetch={true}
                className='group/item cursor-pointer w-full border-x border-b border-dark-gray/50 rounded-2xl sm:rounded-3xl'>
                {/* Category Image */}
                <div className='relative flex items-center justify-center bg-transparent rounded-t-2xl sm:rounded-t-3xl overflow-hidden h-fig sm:h-64 lg:h-72'>
                  {category.heroImage ? (
                    <Image
                      src={resolveUrl(category.heroImage) as string}
                      alt={category.name}
                      className='mask mask-parallelogram size-50 aspect-square shrink-0 object-cover w-full h-full'
                      loading='lazy'
                    />
                  ) : (
                    <div className='w-full h-full bg-sidebar/40 dark:bg-sidebar flex items-center justify-center'>
                      <Icon name='image' className='w-16 h-16 opacity-40' />
                    </div>
                  )}
                  <div
                    className={`absolute inset-0 bg-linear-to-br from-black/40 via-transparent to-transparent group-hover/item:from-black/60 transition-opacity duration-300`}></div>

                  {/* Category Badge */}
                  <div className='absolute top-3 sm:top-4 right-3 sm:right-4'>
                    <div className='bg-foreground/10 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full'>
                      <Icon
                        name='arrow-right'
                        className='size-4 sm:size-5 text-white group-hover/item:translate-x-1 transition-transform duration-300'
                      />
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className='w-full p-3 sm:p-4'>
                  <div className='flex-1 min-w-0'>
                    <h4 className='flex items-center justify-center text-lg sm:text-base lg:text-lg font-polysans font-semibold mb-1'>
                      <span className='capitalize truncate'>
                        {category.name}
                      </span>
                    </h4>
                    {/*{category.highlight && (
                      <div className='flex truncate gap-1.5 mt-3 justify-center text-brand font-okxs font-medium'>
                        <span
                          key={category.slug}
                          className='text-[10px] sm:text-xs px-2 py-0.5 opacity-70'>
                          {category.shortDesc}
                        </span>
                      </div>
                    )}*/}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
