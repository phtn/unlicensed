'use client'

import {
  type BundleConfig,
  type BundleVariation,
  type PendingBundleItem,
} from '@/app/lobby/(store)/deals/lib/deal-types'
import {serializeSelections} from '@/app/lobby/(store)/deals/searchParams'
import type {StoreProduct} from '@/app/types'
import {api} from '@/convex/_generated/api'
import type {Id} from '@/convex/_generated/dataModel'
import {usePendingDeals} from '@/ctx/pending-deals'
import {
  type CartItemWithProduct,
  isBundleCartItemWithProducts,
  isProductCartItemWithProduct,
  useCart,
} from '@/hooks/use-cart'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {getBundleTotalCents, getUnitPriceCents} from '@/utils/cartPrice'
import {mapNumericGrams} from '@/utils/denominationMaps'
import {formatDenominationDisplay} from '@/utils/formatDenomination'
import {Badge, Button, Card} from '@heroui/react'
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

import {LegacyImage} from '@/components/ui/legacy-image'

type BundleSelection = {productId: Id<'products'>; quantity: number}
type BundleSelections = Map<string, BundleSelection>

const EMPTY_AVAILABLE_MAP: Record<string, number> = {}

function countSelectedUnits(selections: BundleSelections): number {
  let total = 0
  for (const selection of selections.values()) {
    total += selection.quantity
  }
  return total
}

/** Denominations equivalent to the given one (e.g. 0.125 oz = 3.5g for flower) */
function getEquivalentDenominations(
  denom: number,
  unitLabel: string,
): Set<number> {
  const equiv = new Set<number>([denom])
  if (unitLabel.toLowerCase() === 'oz') {
    const gram = mapNumericGrams[String(denom)]
    if (gram) equiv.add(Number(gram))
    if (denom === 3.5) equiv.add(0.125)
    if (denom === 7) equiv.add(0.25)
    if (denom === 14) equiv.add(0.5)
    if (denom === 28) equiv.add(1)
  }
  return equiv
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
  selections?: BundleSelections
  /** Controlled: called when variation changes */
  onVariationChange?: (index: number) => void
  /** Controlled: called when selections change */
  onSelectionsChange?: (selections: BundleSelections) => void
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
    } else if (isBundleCartItemWithProducts(item)) {
      for (const bi of item.bundleItems) {
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
  const [internalSelections, setInternalSelections] =
    useState<BundleSelections>(new Map())
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
      const requested =
        typeof index === 'function' ? index(variationIndex) : index
      const next = Math.max(
        0,
        Math.min(requested, config.variations.length - 1),
      )
      if (next === variationIndex) return
      if (isControlled) onVariationChange?.(next)
      else setInternalVariationIndex(next)

      if (isSelectionsControlled) {
        if (!isControlled) onSelectionsChange?.(new Map())
      } else {
        setInternalSelections(new Map())
      }
    },
    [
      config.variations.length,
      isControlled,
      isSelectionsControlled,
      onSelectionsChange,
      onVariationChange,
      variationIndex,
    ],
  )

  const setSelections = useCallback(
    (
      updater:
        | BundleSelections
        | ((prev: BundleSelections) => BundleSelections),
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
  const isAvailabilityLoading = availableMap === undefined
  const availableQuantities = availableMap ?? EMPTY_AVAILABLE_MAP

  const productMap = useMemo(
    () => new Map(products.map((p) => [String(p._id), p])),
    [products],
  )

  const filteredProducts = useMemo(() => {
    return filterProductsForVariation(
      products,
      variation,
      config,
      availableQuantities,
    )
  }, [products, variation, config, availableQuantities])

  const totalSelected = useMemo(
    () => countSelectedUnits(selections),
    [selections],
  )

  const requiredUnits = variation.totalUnits
  const remainingUnits = Math.max(0, requiredUnits - totalSelected)
  const isComplete = totalSelected === requiredUnits
  const isOverSelected = totalSelected > requiredUnits
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
    const map: BundleSelections = new Map()
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
      } else if (isBundleCartItemWithProducts(item)) {
        for (const bi of item.bundleItems) {
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
    () => countSelectedUnits(selectionsFromCart),
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
          isBundleCartItemWithProducts(item) &&
          item.bundleType === config.id &&
          item.variationIndex === vi
        ) {
          count += item.bundleItems.reduce((sum, bi) => sum + bi.quantity, 0)
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
          isBundleCartItemWithProducts(item) &&
          item.bundleType === config.id &&
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
      const available = availableQuantities[availKey] ?? 0
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
    [
      availableQuantities,
      cartQtyMap,
      config.id,
      denom,
      lowThreshold,
      maxPerStrain,
    ],
  )

  const maxSelectableForProduct = useCallback(
    (product: StoreProduct, currentQuantity: number) => {
      const inventoryMax = effectiveMaxPerProduct(product)
      return Math.min(inventoryMax, currentQuantity + remainingUnits)
    },
    [effectiveMaxPerProduct, remainingUnits],
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
      setSelections((prev) => {
        const current = prev.get(key)?.quantity ?? 0
        const remainingForPrev = Math.max(
          0,
          requiredUnits - countSelectedUnits(prev),
        )
        const max = Math.min(
          effectiveMaxPerProduct(product),
          current + remainingForPrev,
        )
        if (current >= max) return prev
        const next = new Map(prev)
        next.set(key, {
          productId,
          quantity: current + 1,
        })
        return next
      })
    },
    [effectiveMaxPerProduct, requiredUnits, setSelections],
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
    const bundleTotalCents = getBundleTotalCents(
      selectedProducts,
      denom,
      bundleAmount,
    )
    if (bundleTotalCents <= 0) return null
    return {
      bundleTotalCents,
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
  const bundleSavingsCents =
    bundleTotalDisplay && isComplete
      ? Math.max(0, subtotalCents - bundleTotalDisplay.bundleTotalCents)
      : 0

  return (
    <Card
      id={config.id}
      className='scroll-mt-28 md:scroll-mt-32 rounded-none! border border-foreground/20 overflow-hidden p-0'>
      <Card.Header className='flex flex-col items-start'>
        <div className='flex items-center justify-between w-full min-h-12 md:min-h-14 md:px-2 px-1'>
          <h2 className='flex items-center pl-1 space-x-4 font-clash text-lg md:text-xl font-semibold'>
            <span>{config.title}</span>
            {config.variations.length === 1 && (
              <div className='flex items-center space-x-2 md:space-x-3'>
                {config.categorySlugs.map((slug) => (
                  <span
                    key={slug}
                    className='font-clash font-medium md:text-base text-base capitalize px-2.5 py-0.5 rounded-full bg-foreground text-background whitespace-nowrap'>
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
                  <Badge.Anchor key={i} className='shrink-0'>
                    <Button
                      size='md'
                      variant={variationIndex === i ? 'primary' : 'secondary'}
                      onPress={() => setVariationIndex(i)}
                      className={cn(
                        'rounded-none! text-sm md:text-base bg-transparent text-foreground px-2',
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
                    {variationCartCount > 0 && (
                      <Badge color='accent' placement='top-right' size='sm'>
                        {variationCartCount}
                      </Badge>
                    )}
                  </Badge.Anchor>
                )
              })}
            </div>
          )}
        </div>
        <p className='text-xs sm:text-sm md:text-base text-muted-foreground md:px-3 px-1.5'>
          {config.description}
        </p>
        <div className='flex items-center justify-between md:px-3 px-2 w-full'>
          <div className='flex items-center font-clash font-medium md:gap-4 gap-1 py-1.5'>
            <span
              className={cn('md:text-xl', {
                'text-terpenes': isComplete,
                'text-danger': isOverSelected,
                'text-foreground/70': !isComplete && !isOverSelected,
              })}>
              {totalSelected} / {variation.totalUnits}
            </span>
            {totalFromCart > 0 && (
              <span
                id='from-cart'
                className='bg-brand text-white rounded-xs px-4 py-1 text-sm'>
                {totalFromCart} {totalFromCart === 1 ? 'item' : 'items'} from
                cart
              </span>
            )}
            {isOverSelected && (
              <span className='text-xs text-danger'>
                Remove {totalSelected - requiredUnits} to continue
              </span>
            )}
          </div>
          <div className='flex items-center justify-between space-x-2 px-0'>
            <div className='flex flex-col md:flex-row md:items-center space-x-2'>
              <span className='font-clash font-medium opacity-80 md:text-base text-sm space-x-2'>
                <span>Total:</span>
                {isComplete && (
                  <span
                    className={cn({
                      'line-through decoration-brand dark:decoration-light-brand/60 decoration-3 font-medium text-base px-1':
                        isComplete,
                    })}>
                    ${(subtotalCents / 100).toFixed(0)}
                  </span>
                )}
              </span>
              <div className='font-clash font-medium flex items-center space-x-1 md:space-x-2 md:min-w-14 min-w-10'>
                <span
                  className={cn({
                    hidden: isComplete,
                  })}>
                  ${(subtotalCents / 100).toFixed(0)}
                </span>
                <span
                  id='bundle-total'
                  className='text-terpenes font-semibold text-lg'>
                  {bundleTotalDisplay && isComplete
                    ? ` $${(bundleTotalDisplay.bundleTotalCents / 100).toFixed(0)} `
                    : null}
                </span>
                {isComplete && bundleTotalDisplay && bundleSavingsCents > 0 && (
                  <div className='hidden _flex items-center justify-center bg-terpenes dark:bg-white rounded-md px-1 md:px-2 md:py-0.5'>
                    <span className='dark:text-terpenes text-white text-sm font-normal md:font-medium'>
                      <span className='text-xs tracking-tight md:tracking-normal'>
                        Saved
                      </span>
                      <span className='font-medium md:font-semibold ml-1'>
                        ${(bundleSavingsCents / 100).toFixed(0)}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            <ViewTransition>
              <Button
                size='lg'
                onPress={handleAddToCart}
                isDisabled={!isComplete || isPending || bundleAlreadyInCart}
                className={cn('bg-terpenes rounded-none! px-3.5', {
                  'opacity-100!': bundleAlreadyInCart,
                })}>
                <span className='flex items-center gap-2'>
                  {isPending ? (
                    <Icon name='spinners-ring' className='size-4' />
                  ) : (
                    <Icon
                      name={isComplete ? 'bag-solid' : 'box-bold'}
                      className='size-5'
                    />
                  )}
                  <span>
                    {bundleAlreadyInCart
                      ? 'Bundle in cart'
                      : isOverSelected
                        ? 'Reduce selection'
                        : isComplete
                          ? 'Add bundle to cart'
                          : 'Complete bundle'}
                  </span>
                </span>
              </Button>
            </ViewTransition>
          </div>
        </div>
      </Card.Header>
      <Card.Content className='px-0 pb-0 border-t md:px-1 dark:bg-dark-table/20'>
        {!isAvailabilityLoading && (
          <div className='grid gap-1 sm:gap-0 sm:grid-cols-2 lg:grid-cols-3 max-h-80 overflow-y-auto'>
            {filteredProducts.map((product) => {
              const pid = product._id as Id<'products'>
              const qty = selections.get(String(pid))?.quantity ?? 0
              const max = maxSelectableForProduct(product, qty)
              const price = getUnitPriceCents(product, denom)
              const inCart = (cartQtyMap[`${pid}-${denom}`] ?? 0) > 0

              return (
                <div
                  key={product._id}
                  className='flex items-center gap-2 rounded-none p-1 dark:bg-background/20 hover:bg-sidebar/30'>
                  {product.image && (
                    <Badge.Anchor className='shrink-0'>
                      <LegacyImage
                        src={product.image}
                        alt={product.name}
                        loading='lazy'
                        className='size-16 shrink-0 rounded-none! object-cover'
                      />
                      {inCart && (
                        <Badge color='accent' placement='top-right' size='sm'>
                          <Icon
                            name='bag-solid'
                            className='size-3 text-white'
                          />
                        </Badge>
                      )}
                    </Badge.Anchor>
                  )}
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between'>
                      <p className='truncate font-medium text-base'>
                        {product.name}
                      </p>
                      <Stepper
                        value={qty}
                        max={max}
                        size='lg'
                        onIncrement={() => handleIncrement(pid, product)}
                        onDecrement={() => handleDecrement(pid)}
                        disabled={isPending}
                        isComplete={isComplete}
                      />
                    </div>
                    <div className='md:text-base text-sm text-muted-foreground'>
                      <div className='md:flex md:items-center md:space-x-2 whitespace-nowrap'>
                        <span className='font-clash font-medium text-foreground/80'>
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
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {isAvailabilityLoading && (
          <p className='py-6 text-center text-sm text-muted-foreground'>
            Checking availability…
          </p>
        )}

        {!isAvailabilityLoading && filteredProducts.length === 0 && (
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
      </Card.Content>
    </Card>
  )
}
