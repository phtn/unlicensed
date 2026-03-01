'use client'

import {
  mapNumericFractions,
  mapNumericGrams,
} from '@/app/admin/(routes)/inventory/product/product-schema'
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
import {cn} from '@/lib/utils'
import {Badge, Button, Card, CardBody, CardHeader, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  ViewTransition,
} from 'react'
import {DealsBundleDebug} from './deals-bundle-debug'
import {Stepper} from './stepper'

/** Denominations equivalent to the given one (e.g. 0.125 oz = 3.5g for flower) */
function getEquivalentDenominations(
  denom: number,
  unitLabel: string,
): Set<number> {
  const equiv = new Set<number>([denom])
  if (unitLabel === 'oz') {
    const gram = mapNumericGrams[String(denom)]
    if (gram) equiv.add(Number(gram))
    if (denom === 3.5) equiv.add(0.125)
    if (denom === 7) equiv.add(0.25)
    if (denom === 14) equiv.add(0.5)
    if (denom === 28) equiv.add(1)
  }
  return equiv
}

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
  debug?: boolean
}

/** Build map of productId-denomination -> quantity in cart */
function cartQtyByProductDenom(
  cart: {
    items: Array<{
      productId: Id<'products'>
      quantity: number
      denomination?: number
    }>
  } | null,
): Record<string, number> {
  if (!cart?.items?.length) return {}
  const map: Record<string, number> = {}
  for (const item of cart.items) {
    const key = `${item.productId}-${item.denomination ?? 'default'}`
    map[key] = (map[key] ?? 0) + item.quantity
  }
  return map
}

export function BundleBuilder({
  config,
  products,
  productIds,
  debug = false,
}: BundleBuilderProps) {
  const {addItem, cart} = useCart()
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

  const rawCartQtyMap = useMemo(() => cartQtyByProductDenom(cart), [cart])

  const productIdSet = useMemo(
    () => new Set(productIds.map(String)),
    [productIds],
  )

  const equivalentDenoms = useMemo(
    () => getEquivalentDenominations(denom, variation.unitLabel),
    [denom, variation.unitLabel],
  )

  const cartQtyMap = useMemo(() => {
    const out: Record<string, number> = {}
    for (const equiv of equivalentDenoms) {
      for (const [key, qty] of Object.entries(rawCartQtyMap)) {
        if (key.endsWith(`-${equiv}`)) {
          const productId = key.slice(0, -String(equiv).length - 1)
          const canonicalKey = `${productId}-${denom}`
          out[canonicalKey] = (out[canonicalKey] ?? 0) + qty
        }
      }
    }
    return out
  }, [rawCartQtyMap, equivalentDenoms, denom])

  const selectionsFromCart = useMemo(() => {
    const map = new Map<string, {productId: Id<'products'>; quantity: number}>()
    if (!cart?.items?.length) return map
    for (const item of cart.items) {
      if (!productIdSet.has(String(item.productId))) continue
      const itemDenom = item.denomination
      if (itemDenom === undefined) continue
      if (!equivalentDenoms.has(itemDenom)) continue
      const key = String(item.productId)
      const existing = map.get(key)
      const qty = (existing?.quantity ?? 0) + item.quantity
      if (qty > 0) map.set(key, {productId: item.productId, quantity: qty})
    }
    return map
  }, [cart, equivalentDenoms, productIdSet])

  const totalFromCart = useMemo(
    () =>
      Array.from(selectionsFromCart.values()).reduce(
        (sum, v) => sum + v.quantity,
        0,
      ),
    [selectionsFromCart],
  )

  const cartCountByVariationIndex = useMemo(() => {
    return config.variations.map((v) => {
      const equiv = getEquivalentDenominations(
        v.denominationPerUnit,
        v.unitLabel,
      )
      let count = 0
      if (!cart?.items?.length) return count
      for (const item of cart.items) {
        if (!productIdSet.has(String(item.productId))) continue
        if (item.denomination === undefined) continue
        if (!equiv.has(item.denomination)) continue
        count += item.quantity
      }
      return count
    })
  }, [cart, config.variations, productIdSet])

  useEffect(() => {
    setSelections(selectionsFromCart)
  }, [selectionsFromCart])

  const effectiveMaxPerProduct = useCallback(
    (product: StoreProduct) => {
      const availKey = `${product._id}-${denom}`
      const available = availableMap ? availableMap[availKey] : 0
      const inCart = cartQtyMap[availKey] ?? 0
      const remaining = Math.max(0, available - inCart)
      if (remaining <= 0) return 0
      if (
        lowThreshold !== undefined &&
        denom === 0.125 &&
        available <= lowThreshold
      ) {
        return 1
      }
      return Math.min(maxPerStrain, remaining)
    },
    [availableMap, cartQtyMap, denom, lowThreshold, maxPerStrain],
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
            <div className='flex p-1 rounded-full bg-sidebar dark:bg-dark-table'>
              {config.variations.map((v, i) => {
                const variationCartCount = cartCountByVariationIndex[i] ?? 0
                return (
                  <Badge
                    key={i}
                    content={
                      variationCartCount > 0 ? (
                        <span className='text-sm font-okxs'>
                          {variationCartCount}
                        </span>
                      ) : null
                    }
                    className={cn('shrink-0 hidden', {
                      flex: variationCartCount > 0,
                    })}
                    classNames={{
                      badge: [
                        'min-w-5 size-6 rounded-full bg-brand text-white flex items-center justify-center',
                      ],
                    }}
                    placement='top-right'>
                    <Button
                      size='md'
                      variant={variationIndex === i ? 'solid' : 'flat'}
                      onPress={() => setVariationIndex(i)}
                      className={cn('rounded-full text-base bg-transparent', {
                        'bg-dark-table text-white dark:bg-white dark:text-dark-table':
                          variationIndex === i,
                      })}>
                      <span>
                        <span>
                          {v.totalUnits} x{' '}
                          {mapNumericFractions[v.denominationPerUnit]}{' '}
                          {v.unitLabel}
                        </span>
                        {mapNumericGrams[v.denominationPerUnit] &&
                          v.unitLabel !== 'g' && (
                            <span className='ml-2 font-light'>
                              <span className='font-brk opacity-50'>(</span>
                              {mapNumericGrams[v.denominationPerUnit]}g
                              <span className='font-brk opacity-50'>)</span>
                            </span>
                          )}
                      </span>
                    </Button>
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
        <p className='text-muted-foreground'>{config.description}</p>
        <div className='flex items-center gap-4'>
          <span
            className={
              isComplete
                ? 'font-medium text-success'
                : 'font-medium text-foreground/70'
            }>
            {totalSelected} / {variation.totalUnits} selected
          </span>
          {totalFromCart > 0 && (
            <span
              id='from-cart'
              className='bg-brand text-white rounded-md px-2.5 py-1 text-sm'>
              {totalFromCart} {totalFromCart === 1 ? 'item' : 'items'} from cart
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody className='pt-0'>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {filteredProducts.map((product) => {
            const pid = product._id as Id<'products'>
            const qty = selections.get(String(pid))?.quantity ?? 0
            const max = effectiveMaxPerProduct(product)
            const price = getUnitPriceCents(product, denom)
            const inCart = (cartQtyMap[`${pid}-${denom}`] ?? 0) > 0

            return (
              <div
                key={product._id}
                className='flex items-center gap-3 rounded-2xl border border-foreground/10 p-3'>
                {product.image && (
                  <Badge
                    isOneChar
                    content={
                      inCart ? (
                        <Icon
                          name='bag-solid'
                          className='size-4 text-brand dark:text-white'
                        />
                      ) : null
                    }
                    className={cn('shrink-0 hidden', {flex: inCart})}
                    classNames={{
                      badge: [
                        inCart &&
                          'rounded-lg bg-white dark:bg-brand dark:border-2 size-6 border-sidebar border-1 dark:border-brand shadow-xs',
                        '',
                      ],
                    }}
                    placement='top-right'>
                    <Image
                      src={product.image}
                      alt={product.name}
                      className='size-14 shrink-0 rounded-xl object-cover'
                    />
                  </Badge>
                )}
                <div className='min-w-0 flex-1'>
                  <p className='truncate font-medium text-sm md:text-base'>
                    {product.name}
                  </p>
                  <p className='text-muted-foreground'>
                    <span>
                      ${(price / 100).toFixed(2)} /{' '}
                      {mapNumericFractions[variation.denominationPerUnit]}{' '}
                      {variation.unitLabel}
                    </span>
                    {mapNumericGrams[variation.denominationPerUnit] &&
                      variation.unitLabel === 'oz' && (
                        <span className='text-sm ml-2'>
                          · <span className='font-brk opacity-50'>(</span>
                          {mapNumericGrams[variation.denominationPerUnit]} g
                          <span className='font-brk opacity-50'>)</span>
                        </span>
                      )}
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

        {debug && (
          <DealsBundleDebug
            bundleId={config.id}
            config={config}
            variation={variation}
            products={products}
            productIds={productIds}
            pairs={pairs}
            availableMap={availableMap}
            filteredProducts={filteredProducts}
          />
        )}

        <div className='mt-4 flex items-center justify-between border-t border-foreground/10 pt-4'>
          <span className='font-semibold'>
            Subtotal: ${(subtotalCents / 100).toFixed(2)}
          </span>
          <ViewTransition>
            <Button
              color='primary'
              size='lg'
              radius='none'
              onPress={handleAddToCart}
              isDisabled={!isComplete || isPending}
              className='bg-terpenes rounded-lg'
              startContent={
                isPending ? (
                  <Icon name='spinners-ring' className='size-4' />
                ) : (
                  <Icon name='box-bold' className='size-5' />
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
