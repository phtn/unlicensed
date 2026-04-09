'use client'

import {StoreProduct} from '@/app/types'
import {EmptyCategory} from '@/components/store/empty-category'
import {ProductCard} from '@/components/store/product-card'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import type {ReactNode} from 'react'
import {Activity} from 'react'

const PRODUCT_GRID_CLASS_NAME =
  'grid grid-cols-2 gap-1 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 auto-rows-fr'
const PRODUCT_LOADING_SKELETON_COUNT = 5

interface ProductsProps {
  products: StoreProduct[]
  getImageUrl?: (image: string | null | undefined) => string | undefined
  isLoading?: boolean
  isRefreshing?: boolean
  footer?: ReactNode
}

const ProductGridSkeleton = () => (
  <div aria-hidden='true' className={PRODUCT_GRID_CLASS_NAME}>
    {Array.from({length: PRODUCT_LOADING_SKELETON_COUNT}).map((_, index) => (
      <div key={index} className='h-full'>
        <div className='flex h-full flex-col overflow-hidden rounded-xs border border-foreground/10 bg-sidebar shadow-sm dark:bg-black'>
          <div className='aspect-square animate-pulse bg-foreground/8' />
          <div className='flex flex-1 flex-col gap-3 p-3'>
            <div className='h-3 w-2/5 animate-pulse rounded bg-foreground/10' />
            <div className='space-y-2'>
              <div className='h-5 w-4/5 animate-pulse rounded bg-foreground/12' />
              <div className='h-5 w-3/5 animate-pulse rounded bg-foreground/10' />
            </div>
            <div className='mt-1 flex items-start justify-between gap-3'>
              <div className='space-y-2'>
                <div className='h-3 w-18 animate-pulse rounded bg-foreground/8' />
                <div className='h-3 w-22 animate-pulse rounded bg-foreground/8' />
              </div>
              <div className='h-8 w-16 animate-pulse rounded bg-foreground/12' />
            </div>
            <div className='mt-auto grid grid-cols-3 gap-1.5'>
              {Array.from({length: 3}).map((__, optionIndex) => (
                <div
                  key={optionIndex}
                  className='h-10 animate-pulse rounded-xs bg-foreground/10'
                />
              ))}
            </div>
            <div className='h-11 animate-pulse rounded-xs bg-foreground/12' />
          </div>
        </div>
      </div>
    ))}
  </div>
)

export const Products = ({
  products,
  getImageUrl,
  isLoading = false,
  isRefreshing = false,
  footer,
}: ProductsProps) => {
  return (
    <section className='py-6 sm:py-8 px-0 sm:px-6 pb-20 sm:pb-24 lg:pb-32'>
      <div className='max-w-7xl mx-auto'>
        <Activity
          mode={!isLoading && products.length === 0 ? 'visible' : 'hidden'}>
          <EmptyCategory />
        </Activity>

        {isLoading && products.length === 0 && (
          <div className='relative'>
            <ProductGridSkeleton />
            <div className='pointer-events-none absolute inset-x-0 top-4 flex justify-center'>
              <div className='inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/90 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-foreground shadow-sm backdrop-blur'>
                <Icon name='spinners-ring' className='size-3.5 animate-spin' />
                Loading products
              </div>
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div className='relative'>
            <div
              aria-busy={isRefreshing || undefined}
              className={cn(
                PRODUCT_GRID_CLASS_NAME,
                'transition-opacity duration-200',
                isRefreshing && 'opacity-45',
              )}>
              {products.map((product, index) => (
                <div
                  key={product._id ?? product.slug ?? index}
                  className='h-full'>
                  <ProductCard
                    product={product}
                    imageUrl={getImageUrl?.(product.image)}
                    className={cn('h-full! min-w-0! max-w-none! w-full')}
                  />
                </div>
              ))}
            </div>

            {isRefreshing && (
              <div className='pointer-events-none absolute inset-x-0 top-4 flex justify-center'>
                <div className='inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/90 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-foreground shadow-sm backdrop-blur'>
                  <Icon
                    name='spinners-ring'
                    className='size-3.5 animate-spin'
                  />
                  Updating results
                </div>
              </div>
            )}
          </div>
        )}

        {footer}
      </div>
    </section>
  )
}
