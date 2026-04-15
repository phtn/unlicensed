'use client'

import {api} from '@/convex/_generated/api'
import {FireCollection} from '@/components/store/fire-collection'
import {
  adaptProduct,
  type RawFireCollectionSection,
  type StoreCollectionSection,
} from '@/lib/convexClient'
import {useQuery} from 'convex/react'
import type {FunctionReturnType} from 'convex/server'
import {useMemo} from 'react'

export const FireCollectionContent = ({
  initialCollections,
}: {
  initialCollections: StoreCollectionSection[]
}) => {
  type FireCollectionsQueryResult = FunctionReturnType<
    typeof api.admin.q.getStorefrontFireCollections
  >

  const liveCollections = useQuery(
    api.admin.q.getStorefrontFireCollections,
    {},
  ) as FireCollectionsQueryResult | undefined

  const collections = useMemo<StoreCollectionSection[]>(() => {
    if (!liveCollections) {
      return initialCollections
    }

    return liveCollections.map((collection: RawFireCollectionSection) => ({
      id: collection.id,
      title: collection.title,
      sourceCategorySlug: collection.sourceCategorySlug,
      sourceCategoryProductCount:
        collection.sourceCategoryProductCount ?? undefined,
      products: collection.products.map((product) => adaptProduct(product)),
    }))
  }, [initialCollections, liveCollections])

  return (
    <div className='min-h-screen pt-16 sm:pt-20 md:pt-24 lg:pt-28 xl:pt-28 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 overflow-x-hidden bg-background'>
      {/* Hero Section - Asymmetric Layout */}
      <section className='relative'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col gap-16'>
            {collections.map((collection: StoreCollectionSection) => (
              <FireCollection
                key={collection.id}
                id={collection.id}
                title={collection.title}
                products={collection.products}
                sourceCategorySlug={collection.sourceCategorySlug}
                productCount={collection.sourceCategoryProductCount}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export const Content = FireCollectionContent
