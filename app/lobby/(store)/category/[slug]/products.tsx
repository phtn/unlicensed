'use client'

import {StoreProduct} from '@/app/types'
import {EmptyCategory} from '@/components/store/empty-category'
import {ProductCard} from '@/components/store/product-card'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {motion, useReducedMotion} from 'motion/react'
import type {ReactNode} from 'react'
import {Activity} from 'react'

interface ProductsProps {
  products: StoreProduct[]
  getImageUrl: (image: string | null | undefined) => string | undefined
  isLoading?: boolean
  isRefreshing?: boolean
  footer?: ReactNode
}

export const Products = ({
  products,
  getImageUrl,
  isLoading = false,
  isRefreshing = false,
  footer,
}: ProductsProps) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className='py-6 sm:py-8 px-0 sm:px-6 pb-20 sm:pb-24 lg:pb-32'>
      <div className='max-w-7xl mx-auto'>
        <Activity
          mode={!isLoading && products.length === 0 ? 'visible' : 'hidden'}>
          <EmptyCategory />
        </Activity>

        {isLoading && products.length === 0 && (
          <div className='flex justify-center py-16'>
            <Icon name='spinners-ring' className='size-5 opacity-55' />
          </div>
        )}

        {products.length > 0 && (
          <div className='relative'>
            <div
              aria-busy={isRefreshing || undefined}
              className={cn(
                'grid grid-cols-2 gap-1 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 auto-rows-fr transition-opacity duration-200',
                isRefreshing && 'opacity-45',
              )}>
              {products.map((product, index) => (
                <motion.div
                  key={product._id ?? product.slug}
                  initial={
                    shouldReduceMotion ? {opacity: 0} : {opacity: 0, y: 8}
                  }
                  whileInView={
                    shouldReduceMotion ? {opacity: 1} : {opacity: 1, y: 0}
                  }
                  viewport={{once: true, amount: 0.16}}
                  transition={{
                    duration: shouldReduceMotion ? 0.18 : 0.24,
                    delay: shouldReduceMotion ? 0 : (index % 10) * 0.015,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className='h-full'>
                  <ProductCard
                    product={product}
                    imageUrl={getImageUrl(product.image)}
                    className='h-full! min-w-0! max-w-none! w-full'
                  />
                </motion.div>
              ))}
            </div>

            {isRefreshing && (
              <motion.div
                initial={shouldReduceMotion ? {opacity: 0} : {opacity: 0, y: 4}}
                animate={{opacity: 1, y: 0}}
                className='pointer-events-none absolute inset-x-0 top-4 flex justify-center'>
                <div className='inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/90 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-foreground shadow-sm backdrop-blur'>
                  <Icon
                    name='spinners-ring'
                    className='size-3.5 animate-spin'
                  />
                  Updating results
                </div>
              </motion.div>
            )}
          </div>
        )}

        {footer}
      </div>
    </section>
  )
}
