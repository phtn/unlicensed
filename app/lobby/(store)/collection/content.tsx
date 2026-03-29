'use client'

import {StoreProduct} from '@/app/types'
import {FireCollection} from '@/components/store/fire-collection'
import {api} from '@/convex/_generated/api'
import {adaptProduct} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {useMemo} from 'react'

interface StoreCollectionSection {
  id: string
  title: string
  products: StoreProduct[]
  sourceCategorySlug?: string
  sourceCategoryProductCount?: number
}

export const FireCollectionContent = ({
  initialCollections,
}: {
  initialCollections: StoreCollectionSection[]
}) => {
  const fireCollections = useQuery(api.admin.q.getFireCollectionsConfig, {})
  const enabledCollections = useMemo(
    () => (fireCollections ?? []).filter((collection) => collection.enabled),
    [fireCollections],
  )
  const configuredProductIds = useMemo(
    () =>
      Array.from(
        new Set(
          enabledCollections.flatMap((collection) => collection.productIds),
        ),
      ),
    [enabledCollections],
  )
  const configuredProducts = useQuery(
    api.products.q.getProductsByIds,
    configuredProductIds.length > 0
      ? {productIds: configuredProductIds}
      : 'skip',
  )
  const collections = useMemo(() => {
    if (!fireCollections) {
      return initialCollections
    }

    if (enabledCollections.length === 0) {
      return []
    }

    if (configuredProductIds.length > 0 && configuredProducts === undefined) {
      return initialCollections
    }

    const productsById = new Map(
      (configuredProducts ?? []).map((product) => [
        String(product._id),
        adaptProduct(product),
      ]),
    )

    return enabledCollections
      .map((collection) => ({
        id: collection.id,
        title: collection.title,
        sourceCategorySlug: collection.sourceCategorySlug,
        sourceCategoryProductCount:
          collection.sourceCategoryProductCount ?? undefined,
        products: collection.productIds
          .map((productId) => productsById.get(productId))
          .filter((product): product is StoreProduct => product != null),
      }))
      .filter((collection) => collection.products.length > 0)
  }, [
    configuredProducts,
    configuredProductIds.length,
    enabledCollections,
    fireCollections,
    initialCollections,
  ])

  return (
    <div className='min-h-screen pt-16 sm:pt-20 md:pt-24 lg:pt-28 xl:pt-28 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 overflow-x-hidden bg-background'>
      {/* Hero Section - Asymmetric Layout */}
      <section className='relative'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col gap-16'>
            {collections.map((collection) => (
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

      {/* CTA Section */}
      <section className='hidden py-12 sm:py-16 lg:py-20 px-4 sm:px-6'>
        <div className='max-w-4xl mx-auto text-center'>
          <div className='rounded-3xl sm:rounded-4xl bg-sidebar/40 dark:bg-sidebar border border-foreground/10 dark:border-dark-gray/50 p-8 sm:p-12 lg:p-16'>
            <h2 className='text-xl sm:text-3xl lg:text-4xl font-polysans font-bold mb-4 sm:mb-6 portrait:max-w-[15ch]'>
              Looking for something specific?
            </h2>
            <p className='text-sm sm:text-base lg:text-lg opacity-70 mb-6 sm:mb-8 max-w-2xl mx-auto'>
              Try our Strain-Finder to discover products that match your
              preferences.
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
              <Button
                as={Link}
                href='/lobby/strain-finder'
                prefetch
                size='lg'
                endContent={
                  <Icon
                    name='search-magic'
                    className='dark:text-brand text-white'
                  />
                }
                className='dark:bg-white opacity-100 dark:text-dark-gray md:hover:bg-brand dark:hover:text-white bg-brand md:hover:text-white text-white font-polysans font-medium px-6 sm:px-8 py-3 sm:py-4 text-base'>
                <span className='drop-shadow-xs'>Strain Finder</span>
              </Button>

              <Button
                size='lg'
                as={Link}
                href={'/lobby/products'}
                prefetch
                variant='light'
                endContent={
                  <Icon name={'search'} className='dark:text-white' />
                }
                className='border dark:border-light-gray/40 sm:flex items-center gap-2 font-polysans font-medium bg-light-gray/25 dark:bg-dark-gray/20 px-4 sm:px-8 py-2 sm:py-3 text-base lg:text-lg'>
                <span className='tracking-tight'>Advanced Search</span>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export const Content = FireCollectionContent
