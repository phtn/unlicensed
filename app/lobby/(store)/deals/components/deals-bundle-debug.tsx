'use client'

import type {
  BundleConfig,
  BundleVariation,
} from '@/app/lobby/(store)/deals/lib/deal-types'
import type {StoreProduct} from '@/app/types'
import type {Id} from '@/convex/_generated/dataModel'
import {cn} from '@/lib/utils'

function getUnitPriceCents(
  product: StoreProduct,
  denomination: number,
): number {
  const key = String(denomination)
  return product.priceByDenomination?.[key] ?? product.priceCents ?? 0
}

export type ProductFilterReason =
  | {included: true}
  | {included: false; reason: string}

function getFilterReason(
  product: StoreProduct,
  denom: number,
  availableMap: Record<string, number>,
): ProductFilterReason {
  const hasDenom = product.availableDenominations?.includes(denom) ?? false
  if (!hasDenom) {
    const denoms = product.availableDenominations?.join(', ') ?? 'none'
    return {
      included: false,
      reason: `Missing denomination ${denom} (has: [${denoms}])`,
    }
  }

  const availKey = `${product._id}-${denom}`
  const available = availableMap[availKey] ?? null
  if (available === null || available === undefined) {
    return {
      included: false,
      reason: `No availability key "${availKey}" in availableMap`,
    }
  }
  if (available <= 0) {
    return {
      included: false,
      reason: `available=${available} (≤0)`,
    }
  }

  return {included: true}
}

export interface DealsBundleDebugProps {
  bundleId: string
  config: BundleConfig
  variation: BundleVariation
  products: StoreProduct[]
  productIds: Id<'products'>[]
  pairs: Array<{productId: Id<'products'>; denomination: number}>
  availableMap: Record<string, number> | undefined
  filteredProducts: StoreProduct[]
  /** Selected products for bundle total calculation */
  selectedProducts?: StoreProduct[]
}

export function DealsBundleDebug({
  bundleId: _bundleId,
  config,
  variation,
  products,
  productIds,
  pairs,
  availableMap,
  filteredProducts,
  selectedProducts = [],
}: DealsBundleDebugProps) {
  const denom = variation.denominationPerUnit
  const productsWithoutId = products.filter((p) => p._id == null)
  const availabilityLoading = availableMap === undefined

  const productReasons = products.map((p) => ({
    product: p,
    reason: getFilterReason(p, denom, availableMap ?? {}),
  }))

  return (
    <details className='m-2 rounded-none border border-orange-500/40 bg-orange-500/5'>
      <summary className='cursor-pointer px-4 py-3 font-mono text-sm font-medium text-orange-500 dark:text-orange-300'>
        [Debug] {config.title} — why {filteredProducts.length} products shown
      </summary>
      <div className='space-y-4 border-t border-orange-500/20 px-4 py-3 font-mono text-xs'>
        {/* Pipeline counts */}
        <section>
          <h4 className='mb-1 font-semibold text-foreground'>Pipeline</h4>
          <table className='w-full table-auto'>
            <tbody>
              <tr>
                <td className='text-muted-foreground'>products</td>
                <td className='text-right'>
                  {products.length}
                  {productsWithoutId.length > 0 && (
                    <span className='ml-1 text-orange-600'>
                      ({productsWithoutId.length} without _id)
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className='text-muted-foreground'>productIds</td>
                <td className='text-right'>
                  {productIds.length}
                  {productIds.length === 0 && (
                    <span className='ml-1 text-orange-600'>
                      ← likely cause if products exist
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className='text-muted-foreground'>pairs (to query)</td>
                <td className='text-right'>{pairs.length}</td>
              </tr>
              <tr>
                <td className='text-muted-foreground'>availableMap</td>
                <td className='text-right'>
                  {availabilityLoading ? (
                    <span className='text-orange-600'>loading (undefined)</span>
                  ) : (
                    <span>
                      {Object.keys(availableMap ?? {}).length} keys
                      {Object.keys(availableMap ?? {}).length === 0 && (
                        <span className='ml-1 text-orange-600'>
                          ← filters all out when loading
                        </span>
                      )}
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <td className='text-muted-foreground'>filteredProducts</td>
                <td className='text-right'>
                  {filteredProducts.length}
                  {filteredProducts.length === 0 && products.length > 0 && (
                    <span className='ml-1 text-orange-600'>← empty result</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Current variation */}
        <section>
          <h4 className='mb-1 font-semibold text-foreground'>Variation</h4>
          <p className='text-muted-foreground'>
            denom={denom}, totalUnits={variation.totalUnits}, unitLabel=
            {variation.unitLabel}
          </p>
        </section>

        {/* Bundle total calculation — selected items only, all configs */}
        <section>
          <h4 className='mb-1 font-semibold text-foreground'>
            Bundle total calculation
          </h4>
          <p className='mb-2 text-muted-foreground'>
            Avg of {variation.totalUnits * variation.denominationPerUnit}{' '}
            {variation.unitLabel} price per selected item → round up to nearest
            $5
          </p>
          {selectedProducts.length === 0 ? (
            <p className='text-orange-600'>Select items to see calculation</p>
          ) : (
            <table className='w-full table-auto'>
              <tbody>
                {selectedProducts.map((p) => {
                  const bundleAmount =
                    variation.totalUnits * variation.denominationPerUnit
                  const direct = getUnitPriceCents(p, bundleAmount)
                  const derived =
                    denom > 0
                      ? getUnitPriceCents(p, denom) * (bundleAmount / denom)
                      : 0
                  const priceCents = direct > 0 ? direct : derived
                  return (
                    <tr key={p._id ?? p.slug}>
                      <td className='text-muted-foreground'>
                        {p.name ?? p.slug}
                      </td>
                      <td className='text-right'>
                        ${(priceCents / 100).toFixed(2)}/{bundleAmount}{' '}
                        {variation.unitLabel}
                        {direct === 0 && derived > 0 && (
                          <span className='ml-1 text-orange-600'>
                            (derived)
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {(() => {
                  const bundleAmount =
                    variation.totalUnits * variation.denominationPerUnit
                  let sumCents = 0
                  for (const p of selectedProducts) {
                    const direct = getUnitPriceCents(p, bundleAmount)
                    const derived =
                      denom > 0
                        ? getUnitPriceCents(p, denom) * (bundleAmount / denom)
                        : 0
                    sumCents += direct > 0 ? direct : derived
                  }
                  const avgCents = sumCents / selectedProducts.length
                  const bundleTotalCents = Math.ceil(avgCents / 500) * 500
                  return (
                    <>
                      <tr className='border-t border-foreground/10'>
                        <td className='pt-1 font-medium'>avg</td>
                        <td className='text-right pt-1'>
                          ${(avgCents / 100).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className='font-medium text-terpenes'>
                          bundle total (↑ nearest $5)
                        </td>
                        <td className='text-right font-medium text-terpenes'>
                          ${(bundleTotalCents / 100).toFixed(2)}
                        </td>
                      </tr>
                    </>
                  )
                })()}
              </tbody>
            </table>
          )}
        </section>

        {/* Per-product reasons */}
        <section>
          <h4 className='mb-1 font-semibold text-foreground'>
            Per-product filter reasons ({productReasons.length})
          </h4>
          <div className='max-h-48 overflow-y-auto space-y-1'>
            {productReasons.map(({product, reason}) => (
              <div
                key={product._id ?? product.slug}
                className={cn(
                  'rounded px-2 py-1',
                  reason.included
                    ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                    : 'bg-red-500/10 text-red-700 dark:text-red-400',
                )}>
                <span className='font-medium'>
                  {product.name ?? product.slug}
                </span>
                <span className='text-muted-foreground'>
                  {' '}
                  (_id={String(product._id ?? 'undefined')})
                </span>
                {!reason.included && (
                  <span className='block mt-0.5 text-red-600 dark:text-red-400'>
                    → {reason.reason}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* availableMap keys */}
        {availableMap && Object.keys(availableMap).length > 0 && (
          <section>
            <h4 className='mb-1 font-semibold text-foreground'>
              availableMap keys
            </h4>
            <pre className='max-h-24 overflow-auto rounded bg-foreground/5 p-2'>
              {JSON.stringify(availableMap, null, 2)}
            </pre>
          </section>
        )}
      </div>
    </details>
  )
}
