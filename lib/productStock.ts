/**
 * Product stock can be stored as a single `stock` number (legacy) or per-denomination
 * in `stockByDenomination`. This helper returns the total inventory count.
 */
export function getTotalStock(product: {
  stock?: number
  stockByDenomination?: Record<string, number>
}): number {
  const byDenom = product.stockByDenomination
  if (byDenom != null && Object.keys(byDenom).length > 0) {
    return Object.values(byDenom).reduce((a, b) => a + b, 0)
  }
  return product.stock ?? 0
}
