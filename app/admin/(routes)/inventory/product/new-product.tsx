'use client'

import {parseAsString, useQueryState} from 'nuqs'
import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'
import {ProductForm} from './product-form'

export const NewProduct = () => {
  const categories = useQuery(api.categories.q.listCategories)
  const [categorySlug] = useQueryState(
    'category',
    parseAsString.withDefault(''),
  )

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductForm
        categories={categories}
        initialCategorySlug={categorySlug || undefined}
      />
    </Suspense>
  )
}
