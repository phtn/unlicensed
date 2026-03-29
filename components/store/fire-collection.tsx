'use client'

import {StoreProduct} from '@/app/types'
import Link from 'next/link'
import {Activity} from 'react'
import {ProductCarousel} from './product-carousel'

interface FireCollectionProps {
  id?: string
  title?: string
  products: StoreProduct[]
  sourceCategorySlug?: string
  productCount?: number
}

const splitCollectionTitle = (title: string): [string, string] => {
  const [firstWord, ...rest] = title.trim().split(/\s+/)
  return [firstWord || 'Fire', rest.join(' ')]
}

export const FireCollection = ({
  id,
  title = 'Fire Collection',
  products,
  sourceCategorySlug,
  productCount,
}: FireCollectionProps) => {
  const [accentWord, remainingTitle] = splitCollectionTitle(title)
  const totalProducts = productCount ?? products.length
  const viewAllHref = sourceCategorySlug
    ? `/lobby/category/${sourceCategorySlug}`
    : '/lobby/products'

  return (
    <section
      id={id ?? 'fire-collection'}
      className='mx-auto w-full pt-0 md:max-w-7xl px-2 sm:px-4 md:px-6 xl:px-0 bg-background'>
      <div className='flex flex-col gap-8 rounded-3xl transition-colors'>
        <div className='flex items-center justify-between gap-4'>
          <div className='space-y-2'>
            <h2 className='text-3xl font-clash font-semibold tracking-normal sm:text-5xl'>
              <span className='text-light-brand'>{accentWord}</span>
              {remainingTitle ? ` ${remainingTitle}` : null}
            </h2>
          </div>
          <Activity mode={products.length === 0 ? 'hidden' : 'visible'}>
            <Link
              href={viewAllHref}
              className='flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-color-muted transition-opacity hover:opacity-70'>
              <span>View all</span>
              <span className='h-px w-10 bg-foreground/30' />
              <span>{totalProducts}</span>
            </Link>
          </Activity>
        </div>
        <ProductCarousel products={products} productCount={totalProducts} />
      </div>
    </section>
  )
}
