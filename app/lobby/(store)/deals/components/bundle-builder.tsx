'use client'

import {
  type BundleConfig,
  type BundleVariation,
  type PendingBundleItem,
} from '@/app/lobby/(store)/deals/lib/deal-types'
import type {StoreProduct} from '@/app/types'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {usePendingDeals} from '@/ctx/pending-deals'
import {useCart} from '@/hooks/use-cart'
import {Icon} from '@/lib/icons'
import {Button, Card, CardBody, CardHeader, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  ViewTransition,
} from 'react'
import {Stepper} from './stepper'

function getUnitPriceCents(
  product: StoreProduct,
  denomination: number,
): number {
  const key = String(denomination)
  return product.priceByDenomination?.[key] ?? product.priceCents ?? 0
}

function filterProductsForVariation(
  products: StoreProduct[],
  variation: BundleVariation,
  config: BundleConfig,
  availableMap: Record<string, number>,
): StoreProduct[] {
  const denom = variation.denominationPerUnit
  const key = String(denom)
  const lowThreshold = config.lowStockThreshold

  return products.filter((p) => {
    const hasDenom = p.availableDenominations?.includes(denom) ?? false
    if (!hasDenom) return false

    const availKey = `${p._id}-${denom}`
    const available = availableMap[availKey] ?? 0
    if (available <= 0) return false

    return true
  })
}

interface BundleBuilderProps {
  config: BundleConfig
  products: StoreProduct[]
  productIds: Id<'products'>[]
}

export function BundleBuilder({
  config,
  products,
  productIds,
}: BundleBuilderProps) {
  const {addItem} = useCart()
  const pendingCtx = usePendingDeals()
  const [variationIndex, setVariationIndex] = useState(
    config.defaultVariationIndex ?? 0,
  )
  const [selections, setSelections] = useState<
    Map<string, {productId: Id<'products'>; quantity: number}>
  >(new Map())
  const [isPending, startTransition] = useTransition()

  const variation = config.variations[variationIndex]
  const denom = variation.denominationPerUnit

  const pairs = useMemo(
    () =>
      productIds.map((productId) => ({
        productId,
        denomination: denom,
      })),
    [productIds, denom],
  )

  const availableMap = useQuery(api.productHolds.q.getAvailableQuantities, {
    pairs,
  })

  const productMap = useMemo(
    () => new Map(products.map((p) => [String(p._id), p])),
    [products],
  )

  const filteredProducts = useMemo(() => {
    return filterProductsForVariation(
      products,
      variation,
      config,
      availableMap ?? {},
    )
  }, [products, variation, config, availableMap])

  const totalSelected = useMemo(() => {
    return Array.from(selections.values()).reduce((s, v) => s + v.quantity, 0)
  }, [selections])

  const isComplete = totalSelected >= variation.totalUnits
  const maxPerStrain = config.maxPerStrain
  const lowThreshold = config.lowStockThreshold

  const effectiveMaxPerProduct = useCallback(
    (product: StoreProduct) => {
      const availKey = `${product._id}-${denom}`
      const available = availableMap ? availableMap[availKey] : 0
      if (available <= 0) return 0
      if (
        lowThreshold !== undefined &&
        denom === 3.5 &&
        available <= lowThreshold
      ) {
        return 1
      }
      return Math.min(maxPerStrain, available)
    },
    [availableMap, denom, lowThreshold, maxPerStrain],
  )

  const {setPendingDeal, clearPendingDeal} = pendingCtx ?? {}
  const syncPending = useCallback(() => {
    if (!setPendingDeal || !clearPendingDeal) return
    const items: PendingBundleItem[] = []
    for (const [, v] of selections) {
      if (v.quantity <= 0) continue
      const p = productMap.get(String(v.productId))
      if (!p) continue
      items.push({
        productId: v.productId,
        productName: p.name ?? '',
        quantity: v.quantity,
        denomination: denom,
        priceCents: getUnitPriceCents(p, denom),
      })
    }
    if (items.length > 0) {
      setPendingDeal(config.id, items, variation.totalUnits)
    } else {
      clearPendingDeal(config.id)
    }
  }, [
    config.id,
    denom,
    productMap,
    selections,
    variation.totalUnits,
    setPendingDeal,
    clearPendingDeal,
  ])

  useEffect(() => {
    syncPending()
  }, [syncPending])

  const handleIncrement = useCallback(
    (productId: Id<'products'>, product: StoreProduct) => {
      const key = String(productId)
      const current = selections.get(key)?.quantity ?? 0
      const max = effectiveMaxPerProduct(product)
      if (current >= max) return
      setSelections((prev) => {
        const next = new Map(prev)
        next.set(key, {
          productId,
          quantity: current + 1,
        })
        return next
      })
    },
    [effectiveMaxPerProduct, selections],
  )

  const handleDecrement = useCallback((productId: Id<'products'>) => {
    const key = String(productId)
    setSelections((prev) => {
      const next = new Map(prev)
      const cur = next.get(key)
      if (!cur) return prev
      const newQty = cur.quantity - 1
      if (newQty <= 0) next.delete(key)
      else next.set(key, {productId, quantity: newQty})
      return next
    })
  }, [])

  const handleAddToCart = useCallback(() => {
    if (!isComplete) return
    startTransition(async () => {
      for (const [, v] of selections) {
        for (let i = 0; i < v.quantity; i++) {
          await addItem(v.productId, 1, denom)
        }
      }
      setSelections(new Map())
      clearPendingDeal?.(config.id)
    })
  }, [addItem, config.id, denom, isComplete, selections, clearPendingDeal])

  const subtotalCents = useMemo(() => {
    let sum = 0
    for (const [, v] of selections) {
      const p = productMap.get(String(v.productId))
      if (p) sum += getUnitPriceCents(p, denom) * v.quantity
    }
    return sum
  }, [selections, productMap, denom])

  return (
    <Card className='rounded-3xl border border-foreground/20 overflow-hidden'>
      <CardHeader className='flex flex-col items-start gap-2'>
        <div className='flex flex-wrap items-center justify-between gap-2 w-full'>
          <h2 className='font-polysans text-xl font-semibold'>
            {config.title}
          </h2>
          {config.variations.length > 1 && (
            <div className='flex gap-1'>
              {config.variations.map((v, i) => (
                <Button
                  key={i}
                  size='sm'
                  variant={variationIndex === i ? 'solid' : 'bordered'}
                  onPress={() => setVariationIndex(i)}
                  className='rounded-full'>
                  {v.totalUnits} x {v.unitLabel}
                </Button>
              ))}
            </div>
          )}
        </div>
        <p className='text-sm text-muted-foreground'>{config.description}</p>
        <div className='flex items-center gap-2 text-sm'>
          <span
            className={
              isComplete
                ? 'font-medium text-success'
                : 'font-medium text-foreground/70'
            }>
            {totalSelected} / {variation.totalUnits} selected
          </span>
        </div>
      </CardHeader>
      <CardBody className='pt-0'>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {filteredProducts.map((product) => {
            const pid = product._id as Id<'products'>
            const qty = selections.get(String(pid))?.quantity ?? 0
            const max = effectiveMaxPerProduct(product)
            const price = getUnitPriceCents(product, denom)

            return (
              <div
                key={product._id}
                className='flex items-center gap-3 rounded-2xl border border-foreground/10 p-3'>
                {product.image && (
                  <Image
                    src={product.image}
                    alt={product.name}
                    className='size-14 shrink-0 rounded-xl object-cover'
                  />
                )}
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-medium text-sm'>{product.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    ${(price / 100).toFixed(2)} / {variation.unitLabel}
                  </p>
                </div>
                <Stepper
                  value={qty}
                  max={max}
                  onIncrement={() => handleIncrement(pid, product)}
                  onDecrement={() => handleDecrement(pid)}
                  disabled={isPending}
                />
              </div>
            )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <p className='py-6 text-center text-sm text-muted-foreground'>
            No products available for this deal right now.
          </p>
        )}

        <div className='mt-4 flex items-center justify-between border-t border-foreground/10 pt-4'>
          <span className='font-semibold'>
            Subtotal: ${(subtotalCents / 100).toFixed(2)}
          </span>
          <ViewTransition>
            <Button
              color='primary'
              onPress={handleAddToCart}
              isDisabled={!isComplete || isPending}
              startContent={
                isPending ? (
                  <Icon name='spinners-ring' className='size-4' />
                ) : (
                  <Icon name='bag-solid' className='size-4' />
                )
              }>
              {isComplete ? 'Add bundle to cart' : 'Complete bundle to add'}
            </Button>
          </ViewTransition>
        </div>
      </CardBody>
    </Card>
  )
}
