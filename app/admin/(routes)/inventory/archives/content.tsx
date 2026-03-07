'use client'

import {api} from '@/convex/_generated/api'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'
import {ProductsData} from '../product/products-data'

const ArchivesContentInner = () => {
  const products = useQuery(api.products.q.listArchivedProducts, {limit: 100})

  return (
    <ProductsData
      data={products}
      title='Archived Products'
      exportFilePrefix='archived-products'
    />
  )
}

export const ArchivesContent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ArchivesContentInner />
    </Suspense>
  )
}
