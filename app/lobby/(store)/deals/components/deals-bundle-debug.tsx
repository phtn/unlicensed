'use client'

import type {StoreProduct} from '@/app/types'
import type {BundleConfig, BundleVariation} from '@/app/lobby/(store)/deals/lib/deal-types'
import type {Id} from '@/convex/_generated/dataModel'
import {cn} from '@/lib/utils'

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
}

export function DealsBundleDebug({
  bundleId,
  config,
  variation,
  products,
  productIds,
  pairs,
  availableMap,
  filteredProducts,
}: DealsBundleDebugProps) {
  const denom = variation.denominationPerUnit
  const productsWithoutId = products.filter((p) => p._id == null)
  const availabilityLoading = availableMap === undefined

  const productReasons = products.map((p) => ({
    product: p,
    reason: getFilterReason(p, denom, availableMap ?? {}),
  }))

  return (
    <details className='mt-4 rounded-xl border border-amber-500/40 bg-amber-500/5'>
      <summary className='cursor-pointer px-4 py-3 font-mono text-sm font-medium text-amber-700 dark:text-amber-400'>
        [Debug] {config.title} — why {filteredProducts.length} products shown
      </summary>
      <div className='space-y-4 border-t border-amber-500/20 px-4 py-3 font-mono text-xs'>
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
                    <span className='ml-1 text-amber-600'>
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
                    <span className='ml-1 text-amber-600'>
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
                    <span className='text-amber-600'>loading (undefined)</span>
                  ) : (
                    <span>
                      {Object.keys(availableMap ?? {}).length} keys
                      {Object.keys(availableMap ?? {}).length === 0 && (
                        <span className='ml-1 text-amber-600'>
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
                    <span className='ml-1 text-amber-600'>← empty result</span>
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
            denom={denom}, totalUnits={variation.totalUnits},{' '}
            unitLabel={variation.unitLabel}
          </p>
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
