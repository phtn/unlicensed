'use client'

import {ProductList} from '@/app/admin/(routes)/inventory/product/product-list'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {Typewrite} from '@/components/expermtl/typewrite'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {parseAsString, useQueryState} from 'nuqs'
import {Suspense, useEffect} from 'react'

interface CategoryProductsContentProps {
  categorySlug: string
}

const CategoryProductsContentInner = ({
  categorySlug,
}: CategoryProductsContentProps) => {
  const products = useQuery(api.products.q.listProducts, {
    categorySlug,
    limit: 100,
  })

  const category = useQuery(api.categories.q.getCategoryBySlug, {
    slug: categorySlug,
  })

  const [, setTabId, , setId] = useAdminTabId()
  const [, setSlug] = useQueryState('slug', parseAsString.withDefault(''))

  const handleEdit = () => {
    if (!category) return
    setId(category._id)
    setTabId('edit')
    setSlug(null)
    // Keep the slug in the URL when editing
  }

  useEffect(() => {
    console.log(categorySlug)
  }, [categorySlug])

  return (
    <div className='space-y-4 pt-2'>
      <div className='flex items-center justify-between'>
        <div className='text-xl font-semibold tracking-tight flex items-center px-2 space-x-2'>
          <Button
            size='sm'
            as={Link}
            isIconOnly
            variant='light'
            href={'/admin/inventory/category'}
            className='text-neutral-500 hover:text-foreground'>
            <Icon name='chevron-left' className='size-4' />
          </Button>
          <div className='flex items-center min-w-16'>
            {category?.name && (
              <Typewrite
                showCursor={false}
                text={category?.name}
                className='capitalize text-lg font-okxs font-medium'
              />
            )}
          </div>

          <Button
            as={Link}
            href={`/admin/inventory/category?slug=${categorySlug}&id=${category?._id}&tabId=edit`}
            size='sm'
            variant='faded'
            onPress={handleEdit}
            className='-space-x-1 text-indigo-500 dark:text-indigo-400 border-white dark:border-transparent bg-gray-100/80 dark:bg-gray-200/5'>
            <Icon name='pencil-fill' className='size-4' />
            <span className='text-sm tracking-wide font-okxs'>
              Edit Category
            </span>
          </Button>
          <Button
            as={Link}
            prefetch
            size='sm'
            variant='bordered'
            href={`/admin/inventory/product?tabId=new&category=${categorySlug}`}
            className='-space-x-1 text-blue-500 dark:text-blue-400 border-white dark:border-transparent bg-gray-100/80 dark:bg-gray-200/5'>
            <Icon name='plus' className='size-4' />
            <span className='text-sm capitalize tracking-[0.010em] font-okxs'>
              Add {category?.name}
            </span>
          </Button>
        </div>

        <div className='flex items-center space-x-2 px-5'>
          <span className='text-sm font-okxs'>Items</span>
          <span className='text-base text-white font-space bg-blue-500 w-6 rounded-md text-center'>
            <AnimatedNumber value={products?.length ?? 0} />
          </span>
        </div>
      </div>
      <Suspense fallback={<div>Loading products...</div>}>
        <ProductList products={products} />
      </Suspense>
    </div>
  )
}

export const CategoryProductsContent = (
  props: CategoryProductsContentProps,
) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CategoryProductsContentInner {...props} />
    </Suspense>
  )
}
