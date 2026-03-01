import {describe, expect, test} from 'bun:test'
import {
  BUNDLE_CONFIGS,
  type BundleType,
  type BundleConfig,
  type BundleVariation,
} from '@/app/lobby/(store)/deals/lib/deal-types'

const BUNDLE_TYPES: BundleType[] = [
  'build-your-own-oz',
  'mix-match-4oz',
  'extracts-3g',
  'extracts-7g',
  'edibles-prerolls-5',
  'edibles-prerolls-10',
]

describe('BUNDLE_CONFIGS', () => {
  test('has config for every BundleType', () => {
    for (const id of BUNDLE_TYPES) {
      expect(BUNDLE_CONFIGS[id]).toBeDefined()
    }
  })

  test('each config has required fields', () => {
    for (const id of BUNDLE_TYPES) {
      const config = BUNDLE_CONFIGS[id] as BundleConfig
      expect(config.id).toBe(id)
      expect(config.title).toBeDefined()
      expect(typeof config.title).toBe('string')
      expect(config.description).toBeDefined()
      expect(typeof config.description).toBe('string')
      expect(config.categorySlugs).toBeDefined()
      expect(Array.isArray(config.categorySlugs)).toBe(true)
      expect(config.variations).toBeDefined()
      expect(Array.isArray(config.variations)).toBe(true)
      expect(config.variations.length).toBeGreaterThan(0)
      expect(typeof config.maxPerStrain).toBe('number')
      expect(config.maxPerStrain).toBeGreaterThan(0)
    }
  })

  test('each variation has required fields', () => {
    for (const id of BUNDLE_TYPES) {
      const config = BUNDLE_CONFIGS[id] as BundleConfig
      for (const v of config.variations as BundleVariation[]) {
        expect(typeof v.totalUnits).toBe('number')
        expect(v.totalUnits).toBeGreaterThan(0)
        expect(typeof v.denominationPerUnit).toBe('number')
        expect(v.denominationPerUnit).toBeGreaterThan(0)
        expect(v.unitLabel).toBeDefined()
        expect(typeof v.unitLabel).toBe('string')
      }
    }
  })

  test('defaultVariationIndex is valid when present', () => {
    for (const id of BUNDLE_TYPES) {
      const config = BUNDLE_CONFIGS[id] as BundleConfig
      const idx = config.defaultVariationIndex
      if (idx !== undefined) {
        expect(idx).toBeGreaterThanOrEqual(0)
        expect(idx).toBeLessThan(config.variations.length)
      }
    }
  })

  test('lowStockThreshold is positive when present', () => {
    for (const id of BUNDLE_TYPES) {
      const config = BUNDLE_CONFIGS[id] as BundleConfig
      const threshold = config.lowStockThreshold
      if (threshold !== undefined) {
        expect(threshold).toBeGreaterThan(0)
      }
    }
  })

  describe('build-your-own-oz', () => {
    const config = BUNDLE_CONFIGS['build-your-own-oz']

    test('has two variations (⅛ and ¼)', () => {
      expect(config.variations).toHaveLength(2)
    })

    test('first variation is 8x⅛ oz', () => {
      const v = config.variations[0]
      expect(v.totalUnits).toBe(8)
      expect(v.denominationPerUnit).toBe(0.125)
      expect(v.unitLabel).toBe('oz')
    })

    test('second variation is 4x¼ oz', () => {
      const v = config.variations[1]
      expect(v.totalUnits).toBe(4)
      expect(v.denominationPerUnit).toBe(0.25)
      expect(v.unitLabel).toBe('oz')
    })

    test('has maxPerStrain 2 and lowStockThreshold 3', () => {
      expect(config.maxPerStrain).toBe(2)
      expect(config.lowStockThreshold).toBe(3)
    })
  })

  describe('mix-match-4oz', () => {
    const config = BUNDLE_CONFIGS['mix-match-4oz']

    test('has single variation 4x1 oz', () => {
      expect(config.variations).toHaveLength(1)
      expect(config.variations[0].totalUnits).toBe(4)
      expect(config.variations[0].denominationPerUnit).toBe(1)
    })

    test('maxPerStrain is 1', () => {
      expect(config.maxPerStrain).toBe(1)
    })
  })

  describe('extracts bundles', () => {
    test('extracts-3g: 3 units of 1g', () => {
      const config = BUNDLE_CONFIGS['extracts-3g']
      expect(config.variations[0].totalUnits).toBe(3)
      expect(config.variations[0].denominationPerUnit).toBe(1)
      expect(config.variations[0].unitLabel).toBe('g')
    })

    test('extracts-7g: 7 units of 1g', () => {
      const config = BUNDLE_CONFIGS['extracts-7g']
      expect(config.variations[0].totalUnits).toBe(7)
      expect(config.variations[0].denominationPerUnit).toBe(1)
    })
  })

  describe('edibles-prerolls bundles', () => {
    test('both use edibles and pre-rolls categories', () => {
      const config5 = BUNDLE_CONFIGS['edibles-prerolls-5']
      const config10 = BUNDLE_CONFIGS['edibles-prerolls-10']
      expect(config5.categorySlugs).toContain('edibles')
      expect(config5.categorySlugs).toContain('pre-rolls')
      expect(config10.categorySlugs).toContain('edibles')
      expect(config10.categorySlugs).toContain('pre-rolls')
    })

    test('5 and 10 units respectively', () => {
      expect(BUNDLE_CONFIGS['edibles-prerolls-5'].variations[0].totalUnits).toBe(5)
      expect(BUNDLE_CONFIGS['edibles-prerolls-10'].variations[0].totalUnits).toBe(10)
    })
  })
})
