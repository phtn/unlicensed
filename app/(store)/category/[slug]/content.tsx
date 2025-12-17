'use client'

import {CategoryContent} from '@/app/(store)/category/[slug]/category'
import {StoreProduct} from '@/app/types'
import {api} from '@/convex/_generated/api'
import {useStorageUrls} from '@/hooks/use-storage-urls'
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

  // Get all image IDs from products
  const imageIds = useMemo(
    () => products.map((p) => p.image).filter((img) => !img.startsWith('http')),
    [products],
  )

  // Resolve URLs for all images
  const resolveUrl = useStorageUrls(imageIds)

  // Update products with resolved image URLs
  const productsWithImages = useMemo(() => {
    return products.map((product) => ({
      ...product,
      image: resolveUrl(product.image),
    }))
  }, [products, resolveUrl])

  return <CategoryContent products={productsWithImages} slug={slug} />
}
