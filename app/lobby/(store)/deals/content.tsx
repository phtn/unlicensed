'use client'

import {useDealConfigs} from '@/app/lobby/(store)/deals/hooks/use-deal-configs'
import {useDealsQueryState} from '@/app/lobby/(store)/deals/hooks/use-deals-query-state'
import type {
  BundleConfig,
  BundleType,
} from '@/app/lobby/(store)/deals/lib/deal-types'
import type {StoreProduct} from '@/app/types'
import {Id} from '@/convex/_generated/dataModel'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {useSearchParams} from 'next/navigation'
import {useCallback, useEffect, useMemo, useSyncExternalStore} from 'react'
import {BundleBuilder} from './components/bundle-builder'

interface DealsContentProps {
  initialProductsByCategory: Record<string, StoreProduct[]>
}

function getDefaultVariationByBundle(
  configs: Record<string, BundleConfig>,
): Partial<Record<BundleType, number>> {
  const out: Partial<Record<BundleType, number>> = {}
  for (const [id, config] of Object.entries(configs)) {
    const idx = config.defaultVariationIndex ?? 0
    if (config.variations[idx]) out[id] = idx
  }
  return out
}

function isLocalhostHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  )
}

function subscribeToClientMount(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  callback()
  return () => {}
}

function getIsLocalhostSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  return isLocalhostHostname(window.location.hostname)
}

function ControlledBundleBuilder({
  bundleId,
  buildProps,
  debug,
  bundleState,
  setBundleState,
}: {
  bundleId: BundleType
  buildProps: {
    config: BundleConfig
    products: StoreProduct[]
  }
  debug: boolean
  bundleState: {
    variationIndex: number
    selections: Map<string, {productId: Id<'products'>; quantity: number}>
  }
  setBundleState: (
    id: BundleType,
    u: {
      variationIndex?: number
      selections?: Map<string, {productId: Id<'products'>; quantity: number}>
    },
  ) => void
}) {
  const {config, products} = buildProps
  const productIds = products
    .map((p) => p._id)
    .filter((id): id is Id<'products'> => id != null)

  const onVariationChange = useCallback(
    (index: number) => setBundleState(bundleId, {variationIndex: index}),
    [setBundleState, bundleId],
  )
  const onSelectionsChange = useCallback(
    (selections: Map<string, {productId: Id<'products'>; quantity: number}>) =>
      setBundleState(bundleId, {selections}),
    [setBundleState, bundleId],
  )

  return (
    <BundleBuilder
      config={config}
      products={products}
      productIds={productIds}
      debug={debug}
      variationIndex={bundleState.variationIndex}
      selections={bundleState.selections}
      onVariationChange={onVariationChange}
      onSelectionsChange={onSelectionsChange}
    />
  )
}

export function DealsContent({initialProductsByCategory}: DealsContentProps) {
  const searchParams = useSearchParams()
  const isLocalhost = useSyncExternalStore(
    subscribeToClientMount,
    getIsLocalhostSnapshot,
    () => false,
  )
  const debug = searchParams.get('debug') === '1' || isLocalhost
  const {configs, configsList, isLoading: dealsLoading} = useDealConfigs()
  const dealIds = useMemo(() => configsList.map((c) => c.id), [configsList])
  const defaultVariationByBundle = useMemo(
    () => getDefaultVariationByBundle(configs),
    [configs],
  )
  const {state: dealsState, setBundleState} = useDealsQueryState(
    defaultVariationByBundle,
    dealIds,
  )

  const {flower, extracts, edibles, prerolls} = useMemo(
    () => ({
      flower: initialProductsByCategory['flower'] ?? [],
      extracts: initialProductsByCategory['extracts'] ?? [],
      edibles: initialProductsByCategory['edibles'] ?? [],
      prerolls: initialProductsByCategory['pre-rolls'] ?? [],
    }),
    [initialProductsByCategory],
  )

  // const productsByCategory = useMemo(
  //   () => ({
  //     flower,
  //     extracts,
  //     edibles: [...edibles, ...prerolls],
  //     'pre-rolls': prerolls,
  //   }),
  //   [flower, extracts, edibles, prerolls],
  // )

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
      string,
      {config: BundleConfig; products: StoreProduct[]}
    > = {}
    for (const config of configsList) {
      const slugs = config.categorySlugs
      const products = slugs.includes('flower')
        ? productsWithImages.flower
        : slugs.includes('extracts')
          ? productsWithImages.extracts
          : slugs.includes('edibles') || slugs.includes('pre-rolls')
            ? productsWithImages.edibles
            : []
      byType[config.id] = {config, products}
    }
    return byType
  }, [configsList, productsWithImages])

  useEffect(() => {
    if (dealsLoading || configsList.length === 0) return

    const hash = window.location.hash.slice(1)
    if (!hash) return

    const target = document.getElementById(decodeURIComponent(hash))
    if (!target) return

    requestAnimationFrame(() => {
      target.scrollIntoView({behavior: 'smooth', block: 'start'})
    })
  }, [configsList.length, dealsLoading])

  return (
    <div className='min-h-screen pt-16 sm:pt-20 md:pt-24 lg:pt-26 pb-16 px-2 sm:px-4 md:px-6 lg:px-8'>
      <div className='hidden _flex items-center justify-center h-16 w-full bg-indigo-400 mb-8 text-xl text-white font-okxs space-x-2 md:rounded-lg'>
        <Icon name='code' />
        <span className=''>Development In-progress</span>
      </div>
      <div className='max-w-7xl mx-auto pt-8 md:pt-16'>
        <header className='ml-4 md:ml-0 mb-10'>
          <h1 className='font-clash text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight'>
            Deals <span className='text-brand'>&</span> Bundles
          </h1>
          <p className='mt-2 text-sm md:text-base text-muted-foreground'>
            Save more when you mix and match custom bundles.{' '}
          </p>
        </header>

        {dealsLoading ? (
          <p className='text-sm text-muted-foreground'>Loading deals…</p>
        ) : (
          <div className='space-y-10'>
            {configsList.map((config) => (
              <ControlledBundleBuilder
                key={config.id}
                bundleId={config.id}
                buildProps={buildProps[config.id]}
                debug={debug}
                bundleState={dealsState[config.id]}
                setBundleState={setBundleState}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
