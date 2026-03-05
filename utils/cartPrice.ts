type ProductPriceLike = {
  priceCents?: number
  priceByDenomination?: Record<string, number>
}

/**
 * Unit price in cents for one unit of the selected denomination.
 * Uses priceByDenomination when available (values in dollars), otherwise
 * falls back to priceCents * denomination.
 * Accepts Convex Doc<'products'>, StoreProduct, or any object with price fields.
 */
export function getUnitPriceCents(
  product: unknown,
  denomination: number | undefined,
): number {
  const p = (product != null && typeof product === 'object'
    ? product
    : {}) as ProductPriceLike
  const denom = denomination ?? 1
  const byDenom = p.priceByDenomination
  if (byDenom && Object.keys(byDenom).length > 0) {
    const key = String(denom)
    const priceDollars = byDenom[key]
    if (typeof priceDollars === 'number' && priceDollars >= 0) {
      return Math.round(priceDollars)
    }
  }
  return (p.priceCents ?? 0) * denom
}

/** Bundle total: avg price for bundle amount across products, rounded up to nearest $5 */
export function getBundleTotalCents(
  products: Array<unknown>,
  denom: number,
  bundleAmount: number,
): number {
  if (products.length === 0) return 0
  let sumCents = 0
  for (const p of products) {
    const direct = getUnitPriceCents(p, bundleAmount)
    const derived =
      denom > 0 ? getUnitPriceCents(p, denom) * (bundleAmount / denom) : 0
    const priceCents = direct > 0 ? direct : derived
    sumCents += priceCents
  }
  const avgCents = sumCents / products.length
  return Math.ceil(avgCents / 500) * 500
}
