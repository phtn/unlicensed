'use client'

import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'
import {ProductList} from './product-list'

export const ProductsContent = () => {
  const products = useQuery(api.products.q.listProducts, {limit: 100})
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductList products={products} />
    </Suspense>
  )
}
