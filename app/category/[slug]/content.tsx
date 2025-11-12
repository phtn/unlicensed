'use client'

import {StoreProduct} from '@/app/types'
import {CategoryContent} from '@/components/base44/category'
import {api} from '@/convex/_generated/api'
import {adaptProduct} from '@/lib/convexClient'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'

interface ContentProps {
  slug: string
  initialProducts: StoreProduct[]
}

export const Content = ({initialProducts, slug}: ContentProps) => {
  const productsQuery = useQuery(api.products.q.listProducts, {
    categorySlug: slug,
    limit: 20,
  })

  const products = useMemo(() => {
    const nextProducts = productsQuery?.map(adaptProduct)
    if (nextProducts && nextProducts.length > 0) {
      return nextProducts
    }
    return initialProducts
  }, [initialProducts, productsQuery])

  return <CategoryContent products={products} slug={slug} />
}
