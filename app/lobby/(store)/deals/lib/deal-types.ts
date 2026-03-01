import type {Id} from '@/convex/_generated/dataModel'

export type BundleType =
  | 'build-your-own-oz'
  | 'mix-match-4oz'
  | 'extracts-3g'
  | 'extracts-7g'
  | 'edibles-prerolls-5'
  | 'edibles-prerolls-10'

export interface BundleVariation {
  totalUnits: number
  denominationPerUnit: number
  denominationLabel?: string
  unitLabel: string
}

export interface BundleConfig {
  id: BundleType
  title: string
  description: string
  categorySlugs: string[]
  /** Variations (e.g. 8x1/8 vs 4x1/4 for Build Your Own Oz) */
  variations: BundleVariation[]
  /** Default variation index */
  defaultVariationIndex?: number
  /** Max units of same product per bundle (e.g. 2 for Build Your Own Oz) */
  maxPerStrain: number
  /** When stock <= this, limit to 1 per strain */
  lowStockThreshold?: number
}

export const BUNDLE_CONFIGS: Record<BundleType, BundleConfig> = {
  'build-your-own-oz': {
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
  },
  'mix-match-4oz': {
    id: 'mix-match-4oz',
    title: 'Mix & Match 4 Oz',
    description: 'Pick up to 4 oz, 1 oz max per strain',
    categorySlugs: ['flower'],
    variations: [
      {
        totalUnits: 4,
        denominationPerUnit: 1,
        denominationLabel: '1',
        unitLabel: 'oz',
      },
    ],
    maxPerStrain: 1,
  },
  'extracts-3g': {
    id: 'extracts-3g',
    title: '3 x 1g Mix & Match',
    description: 'Pick 3 extracts, 1g each',
    categorySlugs: ['extracts'],
    variations: [{totalUnits: 3, denominationPerUnit: 1, unitLabel: 'g'}],
    maxPerStrain: 1,
  },
  'extracts-7g': {
    id: 'extracts-7g',
    title: '7 x 1g Mix & Match',
    description: 'Pick 7 extracts, 1g each',
    categorySlugs: ['extracts'],
    variations: [{totalUnits: 7, denominationPerUnit: 1, unitLabel: 'g'}],
    maxPerStrain: 1,
  },
  'edibles-prerolls-5': {
    id: 'edibles-prerolls-5',
    title: '5 x 1 Unit Mix & Match',
    description: 'Pick 5 edibles or pre-rolls',
    categorySlugs: ['edibles', 'pre-rolls'],
    variations: [{totalUnits: 5, denominationPerUnit: 1, unitLabel: 'unit'}],
    maxPerStrain: 1,
  },
  'edibles-prerolls-10': {
    id: 'edibles-prerolls-10',
    title: '10 x 1 Unit Mix & Match',
    description: 'Pick 10 edibles or pre-rolls',
    categorySlugs: ['edibles', 'pre-rolls'],
    variations: [{totalUnits: 10, denominationPerUnit: 1, unitLabel: 'unit'}],
    maxPerStrain: 1,
  },
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
