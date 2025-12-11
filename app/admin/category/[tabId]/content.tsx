'use client'

import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {CategoriesContent} from '../content'
import {NewCategory} from '../new-category'
import {CategoryProductsContent} from './[slug]/content'

export const Content = ({tabId}: {tabId: string}) => {
  const category = useQuery(api.categories.q.getCategoryBySlug, {
    slug: tabId,
  })

  // Check if tabId is a known tab (like 'new')
  if (tabId === 'new') {
    return <NewCategory />
  }

  // Check if tabId matches a category slug
  if (category) {
    return <CategoryProductsContent categorySlug={tabId} />
  }

  // Default: show categories list
  return <CategoriesContent />
}
