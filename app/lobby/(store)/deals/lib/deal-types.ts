import type {Id} from '@/convex/_generated/dataModel'

/** Deal id is a string (e.g. from Convex). Legacy literal union kept for typing where needed. */
export type BundleType = string

export interface BundleVariation {
  totalUnits: number
  denominationPerUnit: number
  denominationLabel?: string
  unitLabel: string
}

export interface BundleConfig {
  id: string
  title: string
  description: string
  categorySlugs: string[]
  variations: BundleVariation[]
  defaultVariationIndex?: number
  maxPerStrain: number
  lowStockThreshold?: number
}

/** Default config for "Build Your Own Oz" used in tests and seed. */
export const DEFAULT_BUILD_YOUR_OWN_OZ_CONFIG: BundleConfig = {
  id: 'build-your-own-oz',
  title: 'Build Your Own Oz',
  description:
    'Select 8 of ⅛ oz (3.5g) or 4 of ¼ oz (7g) — mix strains your way',
  categorySlugs: ['flower'],
  variations: [
    {
      totalUnits: 8,
      denominationPerUnit: 0.125,
      denominationLabel: '⅛',
      unitLabel: 'oz',
    },
    {
      totalUnits: 4,
      denominationPerUnit: 0.25,
      denominationLabel: '¼',
      unitLabel: 'oz',
    },
  ],
  defaultVariationIndex: 0,
  maxPerStrain: 2,
  lowStockThreshold: 3,
}

/** Converts a Convex deal document to BundleConfig for store/cart usage. */
export function dealDocToBundleConfig(
  doc: {
    id: string
    title: string
    description: string
    categorySlugs: string[]
    variations: Array<{
      totalUnits: number
      denominationPerUnit: number
      denominationLabel?: string
      unitLabel: string
    }>
    defaultVariationIndex?: number
    maxPerStrain: number
    lowStockThreshold?: number
  },
): BundleConfig {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    categorySlugs: doc.categorySlugs,
    variations: doc.variations,
    defaultVariationIndex: doc.defaultVariationIndex,
    maxPerStrain: doc.maxPerStrain,
    lowStockThreshold: doc.lowStockThreshold,
  }
}

export interface PendingBundleItem {
  productId: Id<'products'>
  productName: string
  quantity: number
  denomination: number
  priceCents: number
}

export interface PendingDeal {
  bundleType: BundleType
  items: PendingBundleItem[]
  totalSelected: number
  requiredTotal: number
}
