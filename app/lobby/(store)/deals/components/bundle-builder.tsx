'use client'

import {mapNumericGrams} from '@/app/admin/(routes)/inventory/product/product-schema'
import {
  type BundleConfig,
  type BundleVariation,
  type PendingBundleItem,
} from '@/app/lobby/(store)/deals/lib/deal-types'
import {serializeSelections} from '@/app/lobby/(store)/deals/searchParams'
import type {StoreProduct} from '@/app/types'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {usePendingDeals} from '@/ctx/pending-deals'
import {
  type CartItemWithProduct,
  isProductCartItemWithProduct,
  useCart,
} from '@/hooks/use-cart'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatDenominationDisplay} from '@/utils/formatDenomination'
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

function normalizeDealAttributeValue(value?: string): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, '-')
}

function filterProductsForVariation(
  products: StoreProduct[],
  variation: BundleVariation,
  config: BundleConfig,
  availableMap: Record<string, number>,
): StoreProduct[] {
  const denom = variation.denominationPerUnit
  const excludedTiers = new Set(
    (config.excludedTiers ?? []).map(normalizeDealAttributeValue),
  )
  const excludedSubcategories = new Set(
    (config.excludedSubcategories ?? []).map(normalizeDealAttributeValue),
  )
  const excludedProductTypes = new Set(
    (config.excludedProductTypes ?? []).map(normalizeDealAttributeValue),
  )
  const excludedBases = new Set(
    (config.excludedBases ?? []).map(normalizeDealAttributeValue),
  )
  const excludedBrands = new Set(
    (config.excludedBrands ?? []).map(normalizeDealAttributeValue),
  )

  return products.filter((p) => {
    const hasDenom = p.availableDenominations?.includes(denom) ?? false
    if (!hasDenom) return false

    const availKey = `${p._id}-${denom}`
    const available = availableMap[availKey] ?? 0
    if (available <= 0) return false

    if (excludedTiers.has(normalizeDealAttributeValue(p.productTier)))
      return false
    if (excludedSubcategories.has(normalizeDealAttributeValue(p.subcategory)))
      return false
    if (excludedProductTypes.has(normalizeDealAttributeValue(p.productType)))
      return false
    if (excludedBases.has(normalizeDealAttributeValue(p.base))) return false
    if (
      (p.brand ?? []).some((brand) =>
        excludedBrands.has(normalizeDealAttributeValue(brand)),
      )
    )
      return false

    return true
  })
}

interface BundleBuilderProps {
  config: BundleConfig
  products: StoreProduct[]
  productIds: Id<'products'>[]
  debug?: boolean
  /** Controlled: variation index from URL/parent */
  variationIndex?: number
  /** Controlled: selections from URL/parent */
  selections?: Map<string, {productId: Id<'products'>; quantity: number}>
  /** Controlled: called when variation changes */
  onVariationChange?: (index: number) => void
  /** Controlled: called when selections change */
  onSelectionsChange?: (
    selections: Map<string, {productId: Id<'products'>; quantity: number}>,
  ) => void
}

/** Build map of productId-denomination -> quantity in cart */
function cartQtyByProductDenom(
  cart: {items: CartItemWithProduct[]} | null,
): Record<string, number> {
  if (!cart?.items?.length) return {}
  const map: Record<string, number> = {}
  for (const item of cart.items) {
    if (isProductCartItemWithProduct(item)) {
      const key = `${item.productId}-${item.denomination ?? 'default'}`
      map[key] = (map[key] ?? 0) + item.quantity
    } else if ('bundleItems' in item && Array.isArray(item.bundleItems)) {
      for (const bi of item.bundleItems as Array<{
        productId: Id<'products'>
        quantity: number
        denomination: number
      }>) {
        const key = `${bi.productId}-${bi.denomination}`
        map[key] = (map[key] ?? 0) + bi.quantity
      }
    }
  }
  return map
}

export function BundleBuilder({
  config,
  products,
  productIds,
  debug = false,
  variationIndex: controlledVariationIndex,
  selections: controlledSelections,
  onVariationChange,
  onSelectionsChange,
}: BundleBuilderProps) {
  const {addItem, addBundle, cart, isAuthenticated} = useCart()
  const pendingCtx = usePendingDeals()
  const isControlled =
    controlledVariationIndex !== undefined && onVariationChange != null
  const isSelectionsControlled =
    controlledSelections !== undefined && onSelectionsChange != null

  const [internalVariationIndex, setInternalVariationIndex] = useState(
    config.defaultVariationIndex ?? 0,
  )
  const [internalSelections, setInternalSelections] = useState<
    Map<string, {productId: Id<'products'>; quantity: number}>
  >(new Map())
  const [isPending, startTransition] = useTransition()

  const variationIndex = Math.max(
    0,
    Math.min(
      isControlled ? controlledVariationIndex! : internalVariationIndex,
      config.variations.length - 1,
    ),
  )
  const selections = isSelectionsControlled
    ? controlledSelections!
    : internalSelections

  const setVariationIndex = useCallback(
    (index: number | ((prev: number) => number)) => {
      const next = typeof index === 'function' ? index(variationIndex) : index
      if (isControlled) onVariationChange?.(next)
      else setInternalVariationIndex(next)
    },
    [isControlled, onVariationChange, variationIndex],
  )

  const setSelections = useCallback(
    (
      updater:
        | Map<string, {productId: Id<'products'>; quantity: number}>
        | ((
            prev: Map<string, {productId: Id<'products'>; quantity: number}>,
          ) => Map<string, {productId: Id<'products'>; quantity: number}>),
    ) => {
      const next = typeof updater === 'function' ? updater(selections) : updater
      if (isSelectionsControlled) onSelectionsChange?.(next)
      else setInternalSelections(next)
    },
    [isSelectionsControlled, onSelectionsChange, selections],
  )

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
      if (isProductCartItemWithProduct(item)) {
        if (!productIdSet.has(String(item.productId))) continue
        const itemDenom = item.denomination
        if (itemDenom === undefined) continue
        if (!equivalentDenoms.has(itemDenom)) continue
        const key = String(item.productId)
        const existing = map.get(key)
        const qty = (existing?.quantity ?? 0) + item.quantity
        if (qty > 0) map.set(key, {productId: item.productId, quantity: qty})
      } else if ('bundleItems' in item && Array.isArray(item.bundleItems)) {
        const bundleItems = item.bundleItems as Array<{
          productId: Id<'products'>
          quantity: number
          denomination: number
        }>
        for (const bi of bundleItems) {
          if (!productIdSet.has(String(bi.productId))) continue
          if (!equivalentDenoms.has(bi.denomination)) continue
          const key = String(bi.productId)
          const existing = map.get(key)
          const qty = (existing?.quantity ?? 0) + bi.quantity
          if (qty > 0) map.set(key, {productId: bi.productId, quantity: qty})
        }
      }
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
    return config.variations.map((v, vi) => {
      const equiv = getEquivalentDenominations(
        v.denominationPerUnit,
        v.unitLabel,
      )
      let count = 0
      if (!cart?.items?.length) return count
      for (const item of cart.items) {
        if (isProductCartItemWithProduct(item)) {
          if (!productIdSet.has(String(item.productId))) continue
          if (item.denomination === undefined) continue
          if (!equiv.has(item.denomination)) continue
          count += item.quantity
        } else if (
          'bundleType' in item &&
          item.bundleType === config.id &&
          'variationIndex' in item &&
          item.variationIndex === vi
        ) {
          count += 1
        }
      }
      return count
    })
  }, [cart, config.id, config.variations, productIdSet])

  /** Bundle already in cart: users may only add one of each bundle at a time */
  const bundleAlreadyInCart = useMemo(() => {
    if (!cart?.items?.length) return false
    if (isAuthenticated) {
      return cart.items.some(
        (item) =>
          'bundleType' in item &&
          item.bundleType === config.id &&
          'variationIndex' in item &&
          item.variationIndex === variationIndex,
      )
    }
    return totalFromCart >= variation.totalUnits
  }, [
    cart,
    config.id,
    isAuthenticated,
    totalFromCart,
    variation.totalUnits,
    variationIndex,
  ])

  useEffect(() => {
    if (selectionsFromCart.size === 0) return
    const fromCart = serializeSelections(selectionsFromCart)
    const current = serializeSelections(selections)
    if (fromCart !== current) {
      startTransition(() => {
        setSelections(selectionsFromCart)
      })
    }
    // Only sync from cart when cart has items; empty cart must not overwrite URL state (preserves on refresh)
  }, [selectionsFromCart, selections, setSelections])

  const effectiveMaxPerProduct = useCallback(
    (product: StoreProduct) => {
      const availKey = `${product._id}-${denom}`
      const available = availableMap ? availableMap[availKey] : 0
      const inCart = cartQtyMap[availKey] ?? 0
      const remaining = Math.max(0, available - inCart)
      if (remaining <= 0) return 0
      if (
        config.id === 'build-your-own-oz' &&
        lowThreshold !== undefined &&
        available <= lowThreshold
      ) {
        return 1
      }
      return Math.min(maxPerStrain, remaining)
    },
    [availableMap, cartQtyMap, config.id, denom, lowThreshold, maxPerStrain],
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
    [effectiveMaxPerProduct, selections, setSelections],
  )

  const handleDecrement = useCallback(
    (productId: Id<'products'>) => {
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
    },
    [setSelections],
  )

  const handleAddToCart = useCallback(() => {
    if (!isComplete || bundleAlreadyInCart) return
    startTransition(async () => {
      if (isAuthenticated && addBundle) {
        const bundleItems = Array.from(selections.entries())
          .filter(([, v]) => v.quantity > 0)
          .map(([, v]) => ({
            productId: v.productId,
            quantity: v.quantity,
            denomination: denom,
          }))
        await addBundle({
          bundleType: config.id,
          variationIndex,
          bundleItems,
        })
      } else {
        for (const [, v] of selections) {
          for (let i = 0; i < v.quantity; i++) {
            await addItem(v.productId, 1, denom)
          }
        }
      }
      setSelections(new Map())
      clearPendingDeal?.(config.id)
    })
  }, [
    addItem,
    addBundle,
    bundleAlreadyInCart,
    config.id,
    denom,
    isAuthenticated,
    isComplete,
    variationIndex,
    selections,
    clearPendingDeal,
    setSelections,
  ])

  const subtotalCents = useMemo(() => {
    let sum = 0
    for (const [, v] of selections) {
      const p = productMap.get(String(v.productId))
      if (p) sum += getUnitPriceCents(p, denom) * v.quantity
    }
    return sum
  }, [selections, productMap, denom])

  /** Bundle total: avg price for full bundle amount (e.g. 4oz for mix-match-4oz) across selected items, rounded up to nearest $5 */
  const bundleTotalDisplay = useMemo(() => {
    const selectedProducts: StoreProduct[] = []
    for (const [, v] of selections) {
      if (v.quantity <= 0) continue
      const p = productMap.get(String(v.productId))
      if (p) selectedProducts.push(p)
    }
    if (selectedProducts.length === 0) return null
    const bundleAmount = variation.totalUnits * variation.denominationPerUnit
    let sumCents = 0
    for (const p of selectedProducts) {
      const direct = getUnitPriceCents(p, bundleAmount)
      const derived =
        denom > 0 ? getUnitPriceCents(p, denom) * (bundleAmount / denom) : 0
      const priceCents = direct > 0 ? direct : derived
      sumCents += priceCents
    }
    const avgCents = sumCents / selectedProducts.length
    if (avgCents <= 0) return null
    const bundleTotalCents = Math.ceil(avgCents / 500) * 500
    return {
      bundleTotalCents,
      avgCents,
      selectedProducts,
      unitLabel: variation.unitLabel,
      bundleAmount,
    }
  }, [
    selections,
    productMap,
    denom,
    variation.totalUnits,
    variation.denominationPerUnit,
    variation.unitLabel,
  ])

  return (
    <Card
      id={config.id}
      className='scroll-mt-28 md:scroll-mt-32 rounded-none! border border-foreground/20 overflow-hidden'>
      <CardHeader className='flex flex-col items-start gap-2'>
        <div className='flex items-center justify-between w-full min-h-12 md:min-h-14'>
          <h2 className='flex items-center pl-1 space-x-4 font-clash text-lg md:text-xl font-semibold'>
            <span>{config.title}</span>
            {config.variations.length === 1 && (
              <div className='flex items-center space-x-2 md:space-x-3'>
                {config.categorySlugs.map((slug) => (
                  <span
                    key={slug}
                    className='font-okxs capitalize font-medium md:text-lg text-base px-2.5 py-1 rounded-full bg-sidebar border border-dark-table/20 whitespace-nowrap'>
                    {slug}
                  </span>
                ))}
              </div>
            )}
          </h2>
          {config.variations.length > 1 && (
            <div className='flex bg-sidebar dark:bg-dark-table'>
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
                      className={cn(
                        'rounded-none! text-sm md:text-base bg-transparent px-2',
                        {
                          'bg-dark-table text-white dark:bg-white dark:text-dark-table px-2.5':
                            variationIndex === i,
                        },
                      )}>
                      <span>
                        {v.totalUnits} x{' '}
                        {formatDenominationDisplay(
                          v.denominationPerUnit,
                          v.unitLabel,
                        )}
                      </span>
                    </Button>
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
        <p className='py-2 text-xs md:text-base text-muted-foreground'>
          {config.description}
        </p>
        <div className='flex items-center gap-4'>
          <span
            className={
              isComplete
                ? 'font-medium text-terpenes'
                : 'font-medium text-foreground/70'
            }>
            {totalSelected} / {variation.totalUnits} selected
          </span>
          {totalFromCart > 0 && (
            <span
              id='from-cart'
              className='bg-brand text-white rounded-xs px-4 py-1 text-sm'>
              {totalFromCart} {totalFromCart === 1 ? 'item' : 'items'} from cart
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody className='pt-4 px-0 md:px-3 dark:bg-dark-table'>
        <div className='grid gap-0 md:gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {filteredProducts.map((product) => {
            const pid = product._id as Id<'products'>
            const qty = selections.get(String(pid))?.quantity ?? 0
            const max = effectiveMaxPerProduct(product)
            const price = getUnitPriceCents(product, denom)
            const inCart = (cartQtyMap[`${pid}-${denom}`] ?? 0) > 0

            return (
              <div
                key={product._id}
                className='flex items-center gap-3 md:rounded-none border-b first:border-t md:border border-foreground/10 p-2 dark:bg-background/20'>
                {product.image && (
                  <Badge
                    isOneChar
                    content={
                      inCart ? (
                        <Icon
                          name='bag-solid'
                          className='size-3.5 md:size-4 text-brand dark:text-white'
                        />
                      ) : null
                    }
                    className={cn('shrink-0 hidden', {flex: inCart})}
                    classNames={{
                      badge: [
                        inCart &&
                          'rounded-md md:rounded-lg bg-white dark:bg-brand dark:border-2 size-5 md:size-6 border-sidebar border-1 dark:border-brand shadow-xs',
                        '',
                      ],
                    }}
                    placement='top-right'>
                    <Image
                      src={product.image}
                      alt={product.name}
                      className='size-18 shrink-0 rounded-none! object-cover'
                    />
                  </Badge>
                )}
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center justify-between'>
                    <p className='truncate font-medium text-base'>
                      {product.name}
                    </p>
                    <Stepper
                      value={qty}
                      max={max}
                      onIncrement={() => handleIncrement(pid, product)}
                      onDecrement={() => handleDecrement(pid)}
                      disabled={isPending}
                      isComplete={isComplete}
                    />
                  </div>
                  <p className='md:text-base text-sm text-muted-foreground'>
                    <div className='md:flex md:items-center md:space-x-2 whitespace-nowrap'>
                      <span className='text-foreground/80'>
                        ${(price / 100).toFixed(2)}
                      </span>{' '}
                      <span className='md:flex hidden'>&middot;</span>
                      <br className='md:hidden flex' />
                      <span className='md:pt-0 -pt-2'>
                        {formatDenominationDisplay(
                          variation.denominationPerUnit,
                          variation.unitLabel,
                        )}
                      </span>
                    </div>
                  </p>
                </div>
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
            selectedProducts={bundleTotalDisplay?.selectedProducts ?? []}
          />
        )}

        <div className='mt-4 flex items-center justify-between pt-4 px-3 md:px-0'>
          <div className='flex flex-col md:flex-row md:items-center space-x-2'>
            <span className='font-medium opacity-80 md:text-base text-sm'>
              Total:{' '}
              {isComplete && (
                <span
                  className={cn({
                    'line-through decoration-dark-table dark:decoration-zinc-700 decoration-1 font-light opacity-50 text-base':
                      isComplete,
                  })}>
                  ${(subtotalCents / 100).toFixed(2)}
                </span>
              )}
            </span>
            <div className='font-semibold flex items-center space-x-1 md:space-x-2'>
              <span
                className={cn({
                  hidden: isComplete,
                })}>
                ${(subtotalCents / 100).toFixed(2)}
              </span>
              <span
                id='bundle-total'
                className='text-terpenes font-semibold text-lg'>
                {bundleTotalDisplay && isComplete
                  ? ` $${(bundleTotalDisplay.bundleTotalCents / 100).toFixed(2)} `
                  : null}
              </span>
              {isComplete && (
                <div className='flex items-center justify-center bg-terpenes dark:bg-white rounded-md px-1 md:px-2 md:py-0.5'>
                  <span className='dark:text-terpenes text-white text-sm font-normal md:font-medium'>
                    <span className='text-xs tracking-tight md:tracking-normal'>
                      Saved
                    </span>
                    <span className='font-medium md:font-semibold ml-1'>
                      $
                      {(
                        (subtotalCents -
                          (bundleTotalDisplay?.bundleTotalCents ?? 0)) /
                        100
                      ).toFixed(0)}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
          <ViewTransition>
            <Button
              color='primary'
              size='lg'
              radius='none'
              onPress={handleAddToCart}
              isDisabled={!isComplete || isPending || bundleAlreadyInCart}
              className='bg-terpenes rounded-none! px-3.5'
              startContent={
                isPending ? (
                  <Icon name='spinners-ring' className='size-4' />
                ) : (
                  <Icon name='box-bold' className='size-5' />
                )
              }>
              {bundleAlreadyInCart
                ? 'Bundle already in cart'
                : isComplete
                  ? 'Add to cart'
                  : 'Complete bundle'}
            </Button>
          </ViewTransition>
        </div>
      </CardBody>
    </Card>
  )
}
