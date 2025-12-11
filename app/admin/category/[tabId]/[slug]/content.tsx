'use client'

import {ProductList} from '@/app/admin/product/product-list'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Suspense} from 'react'

interface CategoryProductsContentProps {
  categorySlug: string
}

export const CategoryProductsContent = ({
  categorySlug,
}: CategoryProductsContentProps) => {
  const products = useQuery(api.products.q.listProducts, {
    categorySlug,
    limit: 100,
  })

  const category = useQuery(api.categories.q.getCategoryBySlug, {
    slug: categorySlug,
  })

  return (
    <div className='space-y-4'>
      <div className='px-2'>
        <div className='text-xl font-semibold tracking-tight flex items-center space-x-2'>
          <h2 className=' tracking-tighter'>
            {category?.name || 'Category'} Products
          </h2>
          <span className='ml-2 text-base text-emerald-500 font-space bg-light-gray/10 w-7 rounded-full text-center'>
            {products?.length}
          </span>
          <Button
            as={Link}
            prefetch
            size='sm'
            variant='bordered'
            href={`/admin/product/new?category=${categorySlug}`}
            className='-space-x-2 text-blue-500 dark:text-blue-400 border-white dark:border-transparent'>
            <Icon name='plus' className='size-4' />
            <span className='text-sm'>New {category?.name}</span>
          </Button>
        </div>

        {category?.description && (
          <p className='mt-1 text-sm text-neutral-500'>
            {category.description}
          </p>
        )}
      </div>
      <Suspense fallback={<div>Loading products...</div>}>
        <ProductList products={products} />
      </Suspense>
    </div>
  )
}
