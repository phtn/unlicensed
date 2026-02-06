/**
 * Unit price in cents for one unit of the selected denomination.
 * Uses priceByDenomination when available (values in dollars), otherwise
 * falls back to priceCents * denomination.
 */
export function getUnitPriceCents(
  product: {
    priceCents?: number
    priceByDenomination?: Record<string, number>
  },
  denomination: number | undefined,
): number {
  const denom = denomination ?? 1
  const byDenom = product.priceByDenomination
  if (byDenom && Object.keys(byDenom).length > 0) {
    const key = String(denom)
    const priceDollars = byDenom[key]
    if (typeof priceDollars === 'number' && priceDollars >= 0) {
      return Math.round(priceDollars)
    }
  }
  return (product.priceCents ?? 0) * denom
}
