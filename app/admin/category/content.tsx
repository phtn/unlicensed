'use client'

import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'
import {CategoryList} from './category-list'

export const CategoriesContent = () => {
  const categories = useQuery(api.categories.q.listCategories)
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CategoryList categories={categories} />
    </Suspense>
  )
}
