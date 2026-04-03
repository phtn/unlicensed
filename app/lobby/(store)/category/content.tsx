'use client'

import {StoreCategory} from '@/app/types'
import {Tag} from '@/components/base44/tag'
import {Title} from '@/components/base44/title'
import {EmptyCategory} from '@/components/store/empty-category'
import {api} from '@/convex/_generated/api'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {adaptCategory} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {Button, Image} from '@/lib/heroui'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Activity, useMemo} from 'react'

const CATEGORY_ORDER: string[] = [
  'flower',
  'extracts',
  'vapes',
  'pre-rolls',
  'edibles',
]

interface ContentProps {
  initialCategories: StoreCategory[]
}

export const Content = ({initialCategories}: ContentProps) => {
  const categoriesQuery = useQuery(api.categories.q.listCategories)

  const categories = useMemo(() => {
    const nextCategories = categoriesQuery?.map(adaptCategory)
    const raw = nextCategories?.length ? nextCategories : initialCategories
    return [...raw].sort((a, b) => {
      const i = CATEGORY_ORDER.indexOf(a.slug)
      const j = CATEGORY_ORDER.indexOf(b.slug)
      const orderA = i === -1 ? CATEGORY_ORDER.length : i
      const orderB = j === -1 ? CATEGORY_ORDER.length : j
      return orderA - orderB
    })
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
                  href={'/lobby/brands'}
                  prefetch
                  radius='none'
                  size='lg'
                  className='dark:bg-white opacity-100 dark:text-dark-gray hover:bg-brand dark:hover:text-white bg-brand hover:text-white text-white font-medium px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base lg:text-lg'>
                  <span className='drop-shadow-xs'>Shop by Brand</span>
                </Button>
                <Button
                  size='lg'
                  as={Link}
                  prefetch
                  radius='none'
                  variant='tertiary'
                  href={'/lobby/deals'}
                  className='hidden border dark:border-light-gray/80 sm:flex items-center gap-2 dark:text-terpenes font-medium bg-light-gray/25 dark:bg-dark-gray/20 px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm md:text-base lg:text-lg'>
                  <span className='tracking-tight'>Find Deals</span>
                  <Icon
                    name='search-magic'
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
            <EmptyCategory />
          </Activity>
          <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4 md:gap-6 w-full'>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/lobby/category/${category.slug}`}
                prefetch={true}
                className='group/item cursor-pointer w-full border-x border-b border-dark-gray/50 rounded-xs'>
                {/* Category Image */}
                <div className='relative flex items-center justify-center bg-transparent rounded-xs overflow-hidden'>
                  {category.heroImage ? (
                    <Image
                      src={resolveUrl(category.heroImage) as string}
                      alt={category.name}
                      radius='none'
                      className='mask mask-parallelogram size-48 aspect-square shrink-0 object-cover w-full h-full'
                      loading='lazy'
                    />
                  ) : (
                    <div className='w-full h-full bg-sidebar/40 dark:bg-sidebar flex items-center justify-center'>
                      <Icon name='image' className='w-16 h-16 opacity-40' />
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className='w-full p-3 sm:p-4'>
                  <div className='flex-1 min-w-0'>
                    <h4 className='flex items-center justify-center text-lg sm:text-base lg:text-lg font-clash font-semibold mb-1'>
                      <span className='capitalize truncate'>
                        {category.name}
                      </span>
                    </h4>
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
