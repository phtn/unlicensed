/** Default tiers per category; used for seeding and for migrating legacy flat arrays. */
export const DEFAULT_PRODUCT_TIERS: Record<string, string[]> = {
  flower: ['B', 'A', 'AA', 'AAA', 'AAAA', 'RARE'],
  extract: [
    'Cured Resin',
    'Fresh Frozen',
    'Live Resin',
    'Full Melt',
    'Half Melt',
  ],
  vape: [
    'Distillate',
    'Live Resin',
    'Cured Resin',
    'Liquid Diamonds',
    'Sauce',
    'Live Rosin',
    'Cured Rosin',
  ],
}

/** Stored format: array of single-key objects. */
export type ProductTiersStored = Array<
  { flower: string[] } | { extract: string[] } | { vape: string[] }
>

/** Default tiers in stored array format for seeding. */
export const DEFAULT_PRODUCT_TIERS_AS_ARRAY: ProductTiersStored = [
  { flower: [...DEFAULT_PRODUCT_TIERS.flower] },
  { extract: [...DEFAULT_PRODUCT_TIERS.extract] },
  { vape: [...DEFAULT_PRODUCT_TIERS.vape] },
]

/** Distributes a legacy flat tier array into flower / extract / vape (object form). */
export function distributeFlatTiers(
  flat: string[],
): Record<string, string[]> {
  const flowerSet = new Set(DEFAULT_PRODUCT_TIERS.flower)
  const extractSet = new Set(DEFAULT_PRODUCT_TIERS.extract)
  const vapeSet = new Set(DEFAULT_PRODUCT_TIERS.vape)
  const flower: string[] = []
  const extract: string[] = []
  const vape: string[] = []
  for (const tier of flat) {
    if (flowerSet.has(tier)) flower.push(tier)
    else if (extractSet.has(tier)) extract.push(tier)
    else if (vapeSet.has(tier)) vape.push(tier)
    else flower.push(tier)
  }
  return { flower, extract, vape }
}

/** Converts object form to stored array form. */
export function tiersObjectToArray(
  obj: Record<string, string[]>,
): ProductTiersStored {
  return [
    { flower: obj.flower ?? [] },
    { extract: obj.extract ?? [] },
    { vape: obj.vape ?? [] },
  ]
}
