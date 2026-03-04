import {
  mapNumericFractions,
  mapNumericGrams,
} from '@/app/admin/(routes)/inventory/product/product-schema'

/**
 * Formats denomination + unit for display. Unit is compared case-insensitively.
 * For oz: &lt; 1 shows grams only (e.g. "3.5 g"); exactly 1 shows "Oz"; &gt; 1 shows fraction + "oz" (e.g. "2 oz").
 * Other units show fraction + unit.
 */
export function formatDenominationDisplay(
  denom: string | number,
  unit: string,
): string {
  const denomStr = String(denom)
  const value = Number(denom)
  const unitLower = unit?.toLowerCase() ?? ''
  const fraction = mapNumericFractions[denomStr] ?? denomStr
  const grams = mapNumericGrams[denomStr]

  if (unitLower === 'oz' && value < 1 && grams) {
    return `${grams} g`
  }
  if (unitLower === 'oz' && value === 1) {
    return 'Oz'
  }
  if (unitLower === 'oz' && value > 1) {
    return `${fraction} oz`
  }
  return `${fraction} ${unit}`
}
