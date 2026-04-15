type ProductPriceLike = {
  onSale?: boolean
  priceCents?: number
  priceByDenomination?: Record<string, number>
  salePriceByDenomination?: Record<string, number>
}

export type UnitPriceBreakdown = {
  unitCents: number
  regularCents: number
  saleCents?: number
  isOnSale: boolean
}

export const getDenominationPriceCents = (
  priceMap: Record<string, number> | undefined,
  denomination: number,
): number | undefined => {
  if (!priceMap) return undefined

  const exact = priceMap[String(denomination)]
  if (typeof exact === 'number') return Math.round(exact)

  const matched = Object.entries(priceMap).find(
    ([key]) => Number(key) === denomination,
  )

  return typeof matched?.[1] === 'number' ? Math.round(matched[1]) : undefined
}

/**
 * Regular unit price in cents for one unit of the selected denomination.
 * Uses priceByDenomination when available (values in cents), otherwise
 * falls back to priceCents * denomination.
 * Accepts Convex Doc<'products'>, StoreProduct, or any object with price fields.
 */
export function getRegularUnitPriceCents(
  product: unknown,
  denomination: number | undefined,
): number {
  const p = (product != null && typeof product === 'object'
    ? product
    : {}) as ProductPriceLike
  const denom = denomination ?? 1
  const denominationCents = getDenominationPriceCents(
    p.priceByDenomination,
    denom,
  )

  if (denominationCents !== undefined && denominationCents >= 0) {
    return denominationCents
  }

  return (p.priceCents ?? 0) * denom
}

export function getUnitPriceBreakdown(
  product: unknown,
  denomination: number | undefined,
): UnitPriceBreakdown {
  const p = (product != null && typeof product === 'object'
    ? product
    : {}) as ProductPriceLike
  const denom = denomination ?? 1
  const regularCents = getRegularUnitPriceCents(p, denom)
  const saleCents = getDenominationPriceCents(p.salePriceByDenomination, denom)
  const isOnSale =
    p.onSale === true &&
    saleCents !== undefined &&
    saleCents >= 0 &&
    saleCents < regularCents

  return {
    unitCents: isOnSale ? saleCents : regularCents,
    regularCents,
    saleCents: isOnSale ? saleCents : undefined,
    isOnSale,
  }
}

/**
 * Effective unit price in cents for one unit of the selected denomination.
 * Uses a valid sale denomination price when onSale is enabled; otherwise
 * returns the regular denomination price.
 */
export function getUnitPriceCents(
  product: unknown,
  denomination: number | undefined,
): number {
  return getUnitPriceBreakdown(product, denomination).unitCents
}

const getBundleTotalCentsWithPrice = (
  products: Array<unknown>,
  denom: number,
  bundleAmount: number,
  getUnitPrice: (product: unknown, denomination: number | undefined) => number,
): number => {
  if (products.length === 0) return 0
  let sumCents = 0
  for (const p of products) {
    const direct = getUnitPrice(p, bundleAmount)
    const derived =
      denom > 0 ? getUnitPrice(p, denom) * (bundleAmount / denom) : 0
    const priceCents = direct > 0 ? direct : derived
    sumCents += priceCents
  }
  const avgCents = sumCents / products.length
  return Math.ceil(avgCents / 500) * 500
}

/** Bundle total: avg effective price for bundle amount across products, rounded up to nearest $5 */
export function getBundleTotalCents(
  products: Array<unknown>,
  denom: number,
  bundleAmount: number,
): number {
  return getBundleTotalCentsWithPrice(
    products,
    denom,
    bundleAmount,
    getUnitPriceCents,
  )
}

/** Bundle total using regular prices only, ignoring active sale pricing. */
export function getRegularBundleTotalCents(
  products: Array<unknown>,
  denom: number,
  bundleAmount: number,
): number {
  return getBundleTotalCentsWithPrice(
    products,
    denom,
    bundleAmount,
    getRegularUnitPriceCents,
  )
}
