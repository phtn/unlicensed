export const INVENTORY_MODES = [
  'by_denomination',
  'shared',
  'shared_weight',
] as const
export type InventoryMode = (typeof INVENTORY_MODES)[number]
export type NormalizedInventoryMode = 'by_denomination' | 'shared'

export type InventoryProductLike = {
  inventoryMode?: string
  masterStockQuantity?: number
  masterStockUnit?: string
  unit?: string
  stock?: number
  stockByDenomination?: Record<string, number>
}

const WEIGHT_UNIT_TO_GRAMS = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
} as const

type WeightUnit = keyof typeof WEIGHT_UNIT_TO_GRAMS

const WEIGHT_UNIT_ALIASES: Record<string, WeightUnit> = {
  mg: 'mg',
  milligram: 'mg',
  milligrams: 'mg',
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
}

const STOCK_PRECISION = 1_000_000

export function roundStockQuantity(value: number): number {
  return Math.round(value * STOCK_PRECISION) / STOCK_PRECISION
}

export function normalizeInventoryMode(
  value: string | undefined,
): NormalizedInventoryMode {
  return value === 'shared' || value === 'shared_weight'
    ? 'shared'
    : 'by_denomination'
}

export function normalizeWeightUnit(
  unit: string | undefined | null,
): WeightUnit | null {
  if (!unit) return null
  return WEIGHT_UNIT_ALIASES[unit.trim().toLowerCase()] ?? null
}

export function isWeightUnit(unit: string | undefined | null): boolean {
  return normalizeWeightUnit(unit) !== null
}

export function convertWeight(
  value: number,
  fromUnit: string | undefined | null,
  toUnit: string | undefined | null,
): number | null {
  if (!Number.isFinite(value)) return null

  const normalizedFrom = normalizeWeightUnit(fromUnit)
  const normalizedTo = normalizeWeightUnit(toUnit)
  if (!normalizedFrom || !normalizedTo) return null

  const grams = value * WEIGHT_UNIT_TO_GRAMS[normalizedFrom]
  return roundStockQuantity(grams / WEIGHT_UNIT_TO_GRAMS[normalizedTo])
}

export function usesSharedWeightInventory(product: unknown): boolean {
  if (product == null || typeof product !== 'object') return false
  const p = product as InventoryProductLike

  return (
    normalizeInventoryMode(p.inventoryMode) === 'shared' &&
    typeof p.masterStockQuantity === 'number' &&
    p.masterStockQuantity >= 0 &&
    normalizeWeightUnit(p.masterStockUnit) !== null &&
    normalizeWeightUnit(p.unit) !== null
  )
}

export function getSharedWeightLineQuantity(
  product: unknown,
  denomination: number | undefined,
  quantity: number,
): number | null {
  if (!usesSharedWeightInventory(product) || denomination === undefined) {
    return null
  }

  const p = product as InventoryProductLike
  return convertWeight(denomination * quantity, p.unit, p.masterStockUnit)
}

export function getStockDisplayUnit(product: unknown): string | null {
  if (product == null || typeof product !== 'object') return null
  const p = product as InventoryProductLike
  if (usesSharedWeightInventory(p)) {
    return normalizeWeightUnit(p.masterStockUnit)
  }
  return null
}

export function formatStockDisplay(product: unknown): string {
  const total = getTotalStock(product)
  const unit = getStockDisplayUnit(product)
  const value = Number.isInteger(total)
    ? String(total)
    : String(Number(total.toFixed(3)))
  return unit ? `${value} ${unit}` : value
}

/**
 * Product stock can be stored as:
 * - a shared master weight pool (`masterStockQuantity` + `masterStockUnit`)
 * - per-denomination counts (`stockByDenomination`)
 * - a single legacy count (`stock`)
 */
export function getTotalStock(product: unknown): number {
  if (product == null || typeof product !== 'object') return 0
  const p = product as InventoryProductLike

  if (usesSharedWeightInventory(p)) {
    return Math.max(0, roundStockQuantity(p.masterStockQuantity ?? 0))
  }

  const byDenom = p.stockByDenomination
  if (byDenom != null && Object.keys(byDenom).length > 0) {
    return Object.values(byDenom).reduce((a, b) => a + b, 0)
  }

  return p.stock ?? 0
}
