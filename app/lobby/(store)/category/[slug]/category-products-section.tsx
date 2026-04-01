'use client'

import type { StoreProduct } from '@/app/types'
import { api } from '@/convex/_generated/api'
import { adaptProduct, type RawCategory } from '@/lib/convexClient'
import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { usePaginatedQuery } from 'convex/react'
import { useEffect, useMemo, useRef } from 'react'
import { CATEGORY_PRODUCTS_PAGE_SIZE } from './constants'
import { Products } from './products'

interface CategoryProductsSectionProps {
  slug: string
  category?: RawCategory | null
  brand: string
  productType: string
  tier: string
  subcategory: string
  initialProducts: StoreProduct[]
  isFilterPending: boolean
}

export const CategoryProductsSection = ({
  slug,
  category,
  brand,
  productType,
  tier,
  subcategory,
  initialProducts,
  isFilterPending,
}: CategoryProductsSectionProps) => {
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const queryArgs = useMemo(
    () => ({
      brand: brand || undefined,
      categorySlug: slug,
      productType: productType || undefined,
      subcategory: subcategory || undefined,
      tier: tier || undefined,
    }),
    [brand, productType, slug, subcategory, tier],
  )

  const {
    results: paginatedProductResults,
    status: paginatedProductsStatus,
    loadMore: loadMoreProducts,
  } = usePaginatedQuery(
    api.products.q.listCategoryProductsPaginated,
    queryArgs,
    {initialNumItems: CATEGORY_PRODUCTS_PAGE_SIZE},
  )

  const paginatedProducts = useMemo(
    () =>
      paginatedProductResults.map((product) => adaptProduct(product, category)),
    [category, paginatedProductResults],
  )

  const hasActiveProductFilters =
    brand !== '' || productType !== '' || tier !== '' || subcategory !== ''

  const products = useMemo(() => {
    if (
      !hasActiveProductFilters &&
      paginatedProductsStatus === 'LoadingFirstPage' &&
      paginatedProducts.length === 0
    ) {
      return initialProducts
    }

    return paginatedProducts
  }, [
    hasActiveProductFilters,
    initialProducts,
    paginatedProducts,
    paginatedProductsStatus,
  ])

  const canLoadMoreProducts = paginatedProductsStatus === 'CanLoadMore'
  const isLoadingMoreProducts = paginatedProductsStatus === 'LoadingMore'
  const isLoadingInitialProducts =
    paginatedProductsStatus === 'LoadingFirstPage' &&
    (hasActiveProductFilters || initialProducts.length === 0)
  const isRefreshingProducts =
    paginatedProductsStatus === 'LoadingFirstPage' && products.length > 0

  useEffect(() => {
    if (!canLoadMoreProducts) return

    const currentTarget = loadMoreRef.current
    if (!currentTarget) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadMoreProducts(CATEGORY_PRODUCTS_PAGE_SIZE)
        }
      },
      {rootMargin: '640px 0px'},
    )

    observer.observe(currentTarget)

    return () => {
      observer.disconnect()
    }
  }, [canLoadMoreProducts, loadMoreProducts])

  return (
    <Products
      products={products}
      isLoading={isLoadingInitialProducts}
      isRefreshing={isFilterPending || isRefreshingProducts}
      footer={
        (canLoadMoreProducts || isLoadingMoreProducts) && (
          <div className='flex justify-center pt-6 h-96'>
            <div
              ref={loadMoreRef}
              aria-hidden
              className='flex h-10 w-full items-center justify-center'>
              <Icon
                name='spinners-ring'
                className={cn(
                  'size-4 transition-opacity',
                  isLoadingMoreProducts ? 'opacity-60' : 'opacity-25',
                )}
              />
            </div>
          </div>
        )
      }
    />
  )
}
