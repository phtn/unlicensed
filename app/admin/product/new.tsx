'use client'

import {ProductForm} from '@/app/admin/_components/product-form'
import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'

export const NewProduct = () => {
  const categories = useQuery(api.categories.q.listCategories)
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductForm categories={categories} />
    </Suspense>
  )
}
