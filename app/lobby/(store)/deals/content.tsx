'use client'

import {
  BUNDLE_CONFIGS,
  type BundleType,
} from '@/app/lobby/(store)/deals/lib/deal-types'
import type {StoreProduct} from '@/app/types'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {adaptProduct} from '@/lib/convexClient'
import {Icon} from '@/lib/icons'
import {useQuery} from 'convex/react'
import {useSearchParams} from 'next/navigation'
import {useMemo} from 'react'
import {BundleBuilder} from './components/bundle-builder'

interface DealsContentProps {
  initialProductsByCategory: Record<string, StoreProduct[]>
}

const DEAL_BUNDLE_IDS: BundleType[] = [
  'build-your-own-oz',
  'mix-match-4oz',
  'extracts-3g',
  'extracts-7g',
  'edibles-prerolls-5',
  'edibles-prerolls-10',
]

export function DealsContent({initialProductsByCategory}: DealsContentProps) {
  const searchParams = useSearchParams()
  const debug = searchParams.get('debug') === '1'

  const flowerQuery = useQuery(api.products.q.listProducts, {
    categorySlug: 'flower',
    limit: 50,
    eligibleForDeals: true,
  })
  const extractsQuery = useQuery(api.products.q.listProducts, {
    categorySlug: 'concentrates',
    limit: 50,
    eligibleForDeals: true,
  })
  const ediblesQuery = useQuery(api.products.q.listProducts, {
    categorySlug: 'edibles',
    limit: 50,
    eligibleForDeals: true,
  })
  const prerollsQuery = useQuery(api.products.q.listProducts, {
    categorySlug: 'pre-rolls',
    limit: 50,
    eligibleForDeals: true,
  })

  const flower = useMemo(
    () =>
      flowerQuery?.map(adaptProduct) ??
      initialProductsByCategory['flower'] ??
      [],
    [flowerQuery, initialProductsByCategory],
  )
  const extracts = useMemo(
    () =>
      extractsQuery?.map(adaptProduct) ??
      initialProductsByCategory['extracts'] ??
      [],
    [extractsQuery, initialProductsByCategory],
  )
  const edibles = useMemo(
    () =>
      ediblesQuery?.map(adaptProduct) ??
      initialProductsByCategory['edibles'] ??
      [],
    [ediblesQuery, initialProductsByCategory],
  )
  const prerolls = useMemo(
    () =>
      prerollsQuery?.map(adaptProduct) ??
      initialProductsByCategory['pre-rolls'] ??
      [],
    [prerollsQuery, initialProductsByCategory],
  )

  const productsByCategory = useMemo(
    () => ({
      flower,
      extracts,
      edibles: [...edibles, ...prerolls],
      'pre-rolls': prerolls,
    }),
    [flower, extracts, edibles, prerolls],
  )

  const imageIds = useMemo(
    () =>
      [...flower, ...extracts, ...edibles, ...prerolls]
        .map((p) => p.image)
        .filter((id): id is NonNullable<typeof id> => id != null),
    [flower, extracts, edibles, prerolls],
  )
  const resolveUrl = useStorageUrls(imageIds)

  const productsWithImages = useMemo(() => {
    const resolve = (list: StoreProduct[]) =>
      list.map((p) => {
        if (!p.image) return p
        const url = resolveUrl(p.image)
        return url ? {...p, image: url} : p
      })
    return {
      flower: resolve(flower),
      extracts: resolve(extracts),
      edibles: resolve([...edibles, ...prerolls]),
      prerolls: resolve(prerolls),
    }
  }, [flower, extracts, edibles, prerolls, resolveUrl])

  const buildProps = useMemo(() => {
    const byType: Record<
      BundleType,
      {config: (typeof BUNDLE_CONFIGS)[BundleType]; products: StoreProduct[]}
    > = {
      'build-your-own-oz': {
        config: BUNDLE_CONFIGS['build-your-own-oz'],
        products: productsWithImages.flower,
      },
      'mix-match-4oz': {
        config: BUNDLE_CONFIGS['mix-match-4oz'],
        products: productsWithImages.flower,
      },
      'extracts-3g': {
        config: BUNDLE_CONFIGS['extracts-3g'],
        products: productsWithImages.extracts,
      },
      'extracts-7g': {
        config: BUNDLE_CONFIGS['extracts-7g'],
        products: productsWithImages.extracts,
      },
      'edibles-prerolls-5': {
        config: BUNDLE_CONFIGS['edibles-prerolls-5'],
        products: productsWithImages.edibles,
      },
      'edibles-prerolls-10': {
        config: BUNDLE_CONFIGS['edibles-prerolls-10'],
        products: productsWithImages.edibles,
      },
    }
    return byType
  }, [productsWithImages])

  return (
    <div className='min-h-screen pt-16 sm:pt-20 md:pt-24 lg:pt-26 pb-16 px-4 sm:px-6 lg:px-8'>
      <div className='h-16 w-full bg-indigo-400 mb-8 flex items-center justify-center text-xl text-white font-okxs space-x-2 md:rounded-lg'>
        <Icon name='code' />
        <span className=''>Development In-progress</span>
      </div>
      <div className='max-w-7xl mx-auto'>
        <header className='mb-10'>
          <h1 className='font-polysans text-3xl sm:text-4xl font-bold tracking-tight'>
            Deals & Bundles
          </h1>
          <p className='mt-2 text-muted-foreground'>
            <span className='hidden'>Save more when you mix and match. </span>
            Build custom bundles with our stepper and add to cart when complete.
          </p>
        </header>

        <div className='space-y-10'>
          {DEAL_BUNDLE_IDS.map((id) => {
            const {config, products} = buildProps[id]
            const productIds = products
              .map((p) => p._id)
              .filter((id): id is Id<'products'> => id != null)
            return (
              <BundleBuilder
                key={id}
                config={config}
                products={products}
                productIds={productIds}
                debug={debug}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
