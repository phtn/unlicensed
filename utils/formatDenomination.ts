import {
  mapNumericFractions,
  mapNumericGrams,
} from '@/app/admin/(routes)/inventory/product/product-schema'

/**
 * Formats denomination + unit for display. For oz: &lt; 1 shows grams only (e.g. "3.5 g"),
 * 1+ shows oz (e.g. "1 oz"). Other units show fraction + unit.
 */
export function formatDenominationDisplay(
  denom: string | number,
  unit: string,
): string {
  const denomStr = String(denom)
  const value = Number(denom)
  const fraction = mapNumericFractions[denomStr] ?? denomStr
  const grams = mapNumericGrams[denomStr]

  if (unit === 'oz' && value < 1 && grams) {
    return `${grams} g`
  }
  if (unit === 'oz' && value >= 1) {
    return `${fraction} oz`
  }
  return `${fraction} ${unit}`
}
