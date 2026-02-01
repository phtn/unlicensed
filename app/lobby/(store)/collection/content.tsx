'use client'

import {StoreCategory, StoreProduct} from '@/app/types'
import {Tag} from '@/components/base44/tag'
import {TitleV3} from '@/components/base44/title'
import {api} from '@/convex/_generated/api'
import {adaptCategory, adaptProduct} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {useMemo} from 'react'
import {FullCollection} from '../collection'

export const Content = ({
  initialCategories,
  initialProducts,
}: {
  initialCategories: StoreCategory[]
  initialProducts: StoreProduct[]
}) => {
  const categoriesQuery = useQuery(api.categories.q.listCategories, {})
  const productsQuery = useQuery(api.products.q.listProducts, {})
  const categories = useMemo(
    () => categoriesQuery?.map(adaptCategory) ?? initialCategories,
    [categoriesQuery, initialCategories],
  )
  const products = useMemo(
    () => productsQuery?.map(adaptProduct) ?? initialProducts,
    [productsQuery, initialProducts],
  )

  return (
    <div className='min-h-screen pt-16 sm:pt-20 md:pt-24 lg:pt-28 xl:pt-28 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 overflow-x-hidden bg-background'>
      {/* Hero Section - Asymmetric Layout */}
      <section className='relative'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='mb-12 sm:mb-16 lg:mb-20'>
            <Tag text='Collection' />
            <TitleV3 title='Fire Collection' subtitle='' />
            <p className='hidden text-sm sm:text-base lg:text-lg opacity-60 mt-6 sm:mt-8 max-w-2xl leading-relaxed'>
              Each brand in our collection represents a commitment to quality,
              innovation, and the highest standards of cultivation. Discover the
              stories behind the names that define excellence.
            </p>
          </div>

          {/* Featured Brands - Large Showcase */}
          <FullCollection products={products} categories={categories ?? []} />
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-12 sm:py-16 lg:py-20 px-4 sm:px-6'>
        <div className='max-w-4xl mx-auto text-center'>
          <div className='rounded-3xl sm:rounded-4xl bg-sidebar/40 dark:bg-sidebar border border-foreground/10 dark:border-dark-gray/50 p-8 sm:p-12 lg:p-16'>
            <h2 className='text-xl sm:text-3xl lg:text-4xl font-polysans font-bold mb-4 sm:mb-6 portrait:max-w-[15ch]'>
              Looking for something specific?
            </h2>
            <p className='text-sm sm:text-base lg:text-lg opacity-70 mb-6 sm:mb-8 max-w-2xl mx-auto'>
              Try our Strain-Finder to discover products that match your
              preferences.
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
              <Button
                as={Link}
                href='/lobby/strain-finder'
                prefetch
                size='lg'
                endContent={
                  <Icon
                    name='search-magic'
                    className='dark:text-brand text-white'
                  />
                }
                className='dark:bg-white opacity-100 dark:text-dark-gray md:hover:bg-brand dark:hover:text-white bg-brand md:hover:text-white text-white font-polysans font-medium px-6 sm:px-8 py-3 sm:py-4 text-base'>
                <span className='drop-shadow-xs'>Strain Finder</span>
              </Button>

              <Button
                size='lg'
                as={Link}
                href={'/lobby/products'}
                prefetch
                variant='light'
                endContent={
                  <Icon name={'search'} className='dark:text-white' />
                }
                className='border dark:border-light-gray/40 sm:flex items-center gap-2 font-polysans font-medium bg-light-gray/25 dark:bg-dark-gray/20 px-4 sm:px-8 py-2 sm:py-3 text-base lg:text-lg'>
                <span className='tracking-tight'>Advanced Search</span>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
