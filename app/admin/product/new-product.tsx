'use client'

import {ProductForm} from '@/app/admin/product/product-form'
import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {useSearchParams} from 'next/navigation'
import {Suspense} from 'react'

export const NewProduct = () => {
  const categories = useQuery(api.categories.q.listCategories)
  const searchParams = useSearchParams()
  const categorySlug = searchParams.get('category') ?? undefined

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductForm categories={categories} initialCategorySlug={categorySlug} />
    </Suspense>
  )
}
