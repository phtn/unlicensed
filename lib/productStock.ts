/**
 * Product stock can be stored as a single `stock` number (legacy) or per-denomination
 * in `stockByDenomination`. This helper returns the total inventory count.
 * Accepts Convex Doc<'products'>, StoreProduct, or any object with optional stock fields.
 */
export function getTotalStock(product: unknown): number {
  if (product == null || typeof product !== 'object') return 0
  const p = product as { stock?: number; stockByDenomination?: Record<string, number> }
  const byDenom = p.stockByDenomination
  if (byDenom != null && Object.keys(byDenom).length > 0) {
    return Object.values(byDenom).reduce((a, b) => a + b, 0)
  }
  return p.stock ?? 0
}
