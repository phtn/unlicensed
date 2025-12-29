'use client'

import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'
import {EditProductContent} from './[id]/content'
import {BadgeList} from './badges'
import {NewProduct} from './new-product'
import {ProductList} from './product-list'

const ProductsContentInner = () => {
  const products = useQuery(api.products.q.listProducts, {limit: 100})
  const [tabId, , id] = useAdminTabId()

  switch (tabId) {
    case 'badges':
      return <BadgeList />
    case 'new':
      return <NewProduct />
    case 'edit':
      if (!id) {
        return <ProductList products={products} />
      }
      return <EditProductContent id={id} />
    default:
      return <ProductList products={products} />
  }
}

export const ProductsContent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContentInner />
    </Suspense>
  )
}
