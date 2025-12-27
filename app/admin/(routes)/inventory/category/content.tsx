'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {parseAsString, useQueryState} from 'nuqs'
import {Suspense} from 'react'
import {CategoryProductsContent} from './[slug]/content'
import {CategoryList} from './category-list'
import {EditCategory} from './edit-category'
import {NewCategory} from './new-category'

const CategoriesContentInner = () => {
  const categories = useQuery(api.categories.q.listCategories)
  const [tabId, , id] = useAdminTabId()
  const [slug] = useQueryState('slug', parseAsString.withDefault(''))

  // If slug is present, show category products
  if (slug) {
    return <CategoryProductsContent categorySlug={slug} />
  }

  switch (tabId) {
    case 'new':
      return <NewCategory />
    case 'edit':
      if (!id) {
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <CategoryList categories={categories} />
          </Suspense>
        )
      }
      return <EditCategory id={id as unknown as Id<'categories'>} />
    default:
      return (
        <MainWrapper className='border-t-0'>
          <CategoryList categories={categories} />
        </MainWrapper>
      )
  }
}

export const CategoriesContent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CategoriesContentInner />
    </Suspense>
  )
}
