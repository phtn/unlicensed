'use client'

import {Products} from '@/app/(store)/category/[slug]/products'
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

  // Get all image IDs from products (only storageIds, not URLs or null)
  const imageIds = useMemo(
    () =>
      products
        .map((p) => p.image)
        .filter((img): img is string => !!img && !img.startsWith('http')),
    [products],
  )

  // Resolve URLs for all images
  const resolveUrl = useStorageUrls(imageIds)

  // Update products with resolved image URLs
  const productsWithImages = useMemo(() => {
    return products.map((product) => {
      // If image is null or already a URL, keep it as-is
      if (!product.image || product.image.startsWith('http')) {
        return product
      }
      // Otherwise, resolve the storageId to a URL
      const resolvedUrl = resolveUrl(product.image)
      return {
        ...product,
        image: resolvedUrl,
      }
    })
  }, [products, resolveUrl])

  return <Products products={productsWithImages} slug={slug} />
}
