'use client'

import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'
import {ProductList} from './product-list'

export const ProductsContent = () => {
  const products = useQuery(api.products.q.listProducts, {limit: 100})
  return (
    <div className='py-4'>
      <h3 className='text-2xl tracking-tighter font-semibold px-2 mb-2'>
        Products List
      </h3>
      <Suspense fallback={<div>Loading...</div>}>
        <ProductList products={products} />
      </Suspense>
    </div>
  )
}
