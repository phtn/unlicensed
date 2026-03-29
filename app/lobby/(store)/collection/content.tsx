'use client'

import {StoreProduct} from '@/app/types'
import {FireCollection} from '@/components/store/fire-collection'
import {api} from '@/convex/_generated/api'
import {adaptProduct, type RawProduct} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {useQueries, useQuery} from 'convex/react'
import type {FunctionReference} from 'convex/server'
import type {Value} from 'convex/values'
import Link from 'next/link'
import {useMemo} from 'react'

interface StoreCollectionSection {
  id: string
  title: string
  products: StoreProduct[]
  sourceCategorySlug?: string
  sourceCategoryProductCount?: number
}

const toStoreProducts = (
  products: RawProduct[],
  sourceCategorySlug?: string,
): StoreProduct[] =>
  products
    .filter(
      (product) =>
        product.archived !== true &&
        product.available === true &&
        (!sourceCategorySlug || product.categorySlug === sourceCategorySlug),
    )
    .map((product) => adaptProduct(product))

export const FireCollectionContent = ({
  initialCollections,
}: {
  initialCollections: StoreCollectionSection[]
}) => {
  const fireCollections = useQuery(api.admin.q.getFireCollectionsConfig, {})
  const enabledCollections = useMemo(
    () =>
      (fireCollections ?? []).filter(
        (collection) =>
          collection.enabled &&
          (collection.sourceCategorySlug
            ? (collection.sourceCategoryProductCount ?? 0) > 0
            : collection.productIds.length > 0),
      ),
    [fireCollections],
  )
  const initialCollectionsById = useMemo(
    () =>
      new Map(
        initialCollections.map((collection) => [collection.id, collection]),
      ),
    [initialCollections],
  )
  const collectionProductQueries = useMemo((): Record<
    string,
    {
      query: FunctionReference<'query'>
      args: Record<string, Value>
    }
  > => {
    const queries: Record<
      string,
      {
        query: FunctionReference<'query'>
        args: Record<string, Value>
      }
    > = {}

    for (const collection of enabledCollections) {
      queries[collection.id] = collection.sourceCategorySlug
        ? {
            query: api.products.q.listProducts,
            args: {
              availableOnly: true,
              categorySlug: collection.sourceCategorySlug,
              limit: collection.sourceCategoryProductCount ?? 0,
            },
          }
        : {
            query: api.products.q.getProductsByIds,
            args: {
              productIds: collection.productIds,
            },
          }
    }

    return queries
  }, [enabledCollections])
  const collectionProductResults = useQueries(collectionProductQueries)

  const collections = useMemo(() => {
    if (!fireCollections) {
      return initialCollections
    }

    if (enabledCollections.length === 0) {
      return []
    }

    return enabledCollections
      .map((collection) => {
        const productResult = collectionProductResults[collection.id]
        if (productResult instanceof Error || productResult === undefined) {
          return initialCollectionsById.get(collection.id) ?? null
        }

        return {
          id: collection.id,
          title: collection.title,
          sourceCategorySlug: collection.sourceCategorySlug,
          sourceCategoryProductCount:
            collection.sourceCategoryProductCount ?? undefined,
          products: toStoreProducts(
            productResult as RawProduct[],
            collection.sourceCategorySlug,
          ),
        }
      })
      .filter(
        (collection): collection is StoreCollectionSection =>
          collection != null,
      )
      .filter((collection) => collection.products.length > 0)
  }, [
    collectionProductResults,
    enabledCollections,
    fireCollections,
    initialCollectionsById,
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
