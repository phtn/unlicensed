'use client'

import {StoreProduct} from '@/app/types'
import Link from 'next/link'
import {Activity} from 'react'
import {ProductCarousel} from './product-carousel'

interface FireCollectionProps {
  products: StoreProduct[]
}

export const FireCollection = ({products}: FireCollectionProps) => {
  return (
    <section
      id='fire-collection'
      className='mx-auto w-full pt-16 md:max-w-7xl px-2 sm:px-4 md:px-6 xl:px-0 bg-background'>
      <div className='flex flex-col gap-8 rounded-3xl transition-colors'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div className='space-y-2'>
            <h2 className='text-3xl font-clash font-semibold tracking-tight sm:text-5xl'>
              <span className='text-brand'>Fire</span> Collection
            </h2>
          </div>
          <Activity mode={products.length === 0 ? 'hidden' : 'visible'}>
            <Link
              href='/lobby/products'
              className='flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-color-muted transition-opacity hover:opacity-70'>
              <span>View all</span>
              <span className='h-px w-10 bg-foreground/30' />
              <span>{products.length}</span>
            </Link>
          </Activity>
        </div>
        <ProductCarousel products={products} />
      </div>
    </section>
  )
}
