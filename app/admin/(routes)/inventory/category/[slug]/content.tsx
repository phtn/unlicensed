'use client'

import {ProductList} from '@/app/admin/(routes)/inventory/product/product-list'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
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

  const handleBack = () => {
    setSlug(null) // Clear slug to go back to category list
  }

  useEffect(() => {
    console.log(categorySlug)
  }, [categorySlug])

  return (
    <div className='space-y-4 pt-2'>
      <div className='flex items-center justify-between'>
        <div className='text-xl font-semibold tracking-tight flex items-center space-x-2'>
          <Button
            size='sm'
            isIconOnly
            variant='light'
            onPress={handleBack}
            className='text-neutral-500 hover:text-foreground'>
            <Icon name='chevron-left' className='size-4' />
          </Button>
          <h2 className='capitalize tracking-tighter'>
            {category?.name || 'Category'}
          </h2>

          <Button
            as={Link}
            href={`/admin/inventory/category?slug=${categorySlug}&id=${category?._id}&tabId=edit`}
            size='sm'
            variant='faded'
            onPress={handleEdit}
            className='-space-x-1 text-indigo-500 dark:text-indigo-400 border-white dark:border-transparent bg-indigo-100/50 dark:bg-indigo-200/5'>
            <Icon name='pencil-single-solid' className='size-4' />
            <span className='text-sm'>Edit Category</span>
          </Button>
          <Button
            as={Link}
            prefetch
            size='sm'
            variant='bordered'
            href={`/admin/inventory/product?tabId=new&category=${categorySlug}`}
            className='-space-x-2 text-blue-500 dark:text-blue-400 border-white dark:border-transparent bg-blue-100/50 dark:bg-blue-200/5'>
            <Icon name='plus' className='size-4' />
            <span className='text-sm capitalize'>Add {category?.name}</span>
          </Button>
        </div>

        <div className='flex items-center space-x-2'>
          <span>Items</span>
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
