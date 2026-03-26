'use client'

import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {createLoadedCountParser} from '@/components/table-v2/parsers-v2'
import {api} from '@/convex/_generated/api'
import {usePaginatedQuery} from 'convex/react'
import {useQueryState} from 'nuqs'
import {Suspense, useMemo} from 'react'
import {EditProductContent} from './[id]/content'
import {NewProduct} from './new-product'
import {ProductList} from './product-list'
import {ProductSettings} from './product-settings'
import {ProductsData} from './products-data'

const ADMIN_PRODUCTS_PAGE_SIZE = 100

const ProductsContentInner = () => {
  const loadedCountParser = useMemo(
    () => createLoadedCountParser(ADMIN_PRODUCTS_PAGE_SIZE),
    [],
  )
  const [loadedCount] = useQueryState('loaded', loadedCountParser)
  const {
    results: products,
    status: productsStatus,
    loadMore,
  } = usePaginatedQuery(
    api.products.q.listProductsPaginated,
    {},
    {initialNumItems: loadedCount},
  )
  const [tabId, , id] = useAdminTabId()
  const canLoadMore = productsStatus === 'CanLoadMore'
  const isLoadingMore = productsStatus === 'LoadingMore'
  const isLoadingInitial =
    productsStatus === 'LoadingFirstPage' && products.length === 0

  const handleLoadMore = () => {
    loadMore(ADMIN_PRODUCTS_PAGE_SIZE)
  }

  switch (tabId) {
    case 'settings':
      return <ProductSettings />
    case 'new':
      return <NewProduct />
    case 'edit':
      if (!id) {
        return (
          <ProductList
            products={products}
            isLoading={isLoadingInitial}
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
          />
        )
      }
      return <EditProductContent id={id} />
    default:
      return (
        <ProductsData
          data={products}
          loading={isLoadingInitial}
          defaultLoadedCount={loadedCount}
          canLoadMore={canLoadMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          loadMoreLabel={`Load ${ADMIN_PRODUCTS_PAGE_SIZE} more`}
        />
      )
  }
}

export const ProductsContent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContentInner />
    </Suspense>
  )
}
