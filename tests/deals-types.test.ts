import {describe, expect, test} from 'bun:test'
import {
  dealDocToBundleConfig,
  DEFAULT_BUILD_YOUR_OWN_OZ_CONFIG,
  type BundleConfig,
  type BundleVariation,
} from '@/app/lobby/(store)/deals/lib/deal-types'

const LEGACY_DEAL_IDS = [
  'build-your-own-oz',
  'mix-match-4oz',
  'extracts-3g',
  'extracts-7g',
  'edibles-prerolls-5',
  'edibles-prerolls-10',
] as const

describe('dealDocToBundleConfig', () => {
  test('converts Convex deal doc to BundleConfig', () => {
    const doc = {
      id: 'test-deal',
      title: 'Test',
      description: 'Desc',
      categorySlugs: ['flower'],
      variations: [
        {totalUnits: 4, denominationPerUnit: 0.25, unitLabel: 'oz'},
      ],
      maxPerStrain: 1,
      order: 0,
      enabled: true,
      updatedAt: 0,
    }
    const config = dealDocToBundleConfig(doc)
    expect(config.id).toBe('test-deal')
    expect(config.title).toBe('Test')
    expect(config.variations).toHaveLength(1)
    expect(config.variations[0].totalUnits).toBe(4)
    expect(config.variations[0].denominationPerUnit).toBe(0.25)
    expect(config.maxPerStrain).toBe(1)
  })

  test('preserves optional fields', () => {
    const doc = {
      id: 'x',
      title: 'X',
      description: 'X',
      categorySlugs: [] as string[],
      variations: [
        {
          totalUnits: 8,
          denominationPerUnit: 0.125,
          denominationLabel: '⅛',
          unitLabel: 'oz',
        },
      ],
      defaultVariationIndex: 0,
      maxPerStrain: 2,
      lowStockThreshold: 3,
      order: 0,
      enabled: true,
      updatedAt: 0,
    }
    const config = dealDocToBundleConfig(doc)
    expect(config.defaultVariationIndex).toBe(0)
    expect(config.lowStockThreshold).toBe(3)
    expect(config.variations[0].denominationLabel).toBe('⅛')
  })
})

describe('DEFAULT_BUILD_YOUR_OWN_OZ_CONFIG', () => {
  test('has required BundleConfig shape', () => {
    const config = DEFAULT_BUILD_YOUR_OWN_OZ_CONFIG as BundleConfig
    expect(config.id).toBe('build-your-own-oz')
    expect(config.title).toBeDefined()
    expect(typeof config.title).toBe('string')
    expect(config.description).toBeDefined()
    expect(Array.isArray(config.categorySlugs)).toBe(true)
    expect(config.variations.length).toBeGreaterThan(0)
    expect(config.maxPerStrain).toBeGreaterThan(0)
  })

  test('variations have required BundleVariation shape', () => {
    for (const v of DEFAULT_BUILD_YOUR_OWN_OZ_CONFIG.variations as BundleVariation[]) {
      expect(typeof v.totalUnits).toBe('number')
      expect(v.totalUnits).toBeGreaterThan(0)
      expect(typeof v.denominationPerUnit).toBe('number')
      expect(v.denominationPerUnit).toBeGreaterThan(0)
      expect(typeof v.unitLabel).toBe('string')
    }
  })

  test('has two variations (⅛ and ¼)', () => {
    expect(DEFAULT_BUILD_YOUR_OWN_OZ_CONFIG.variations).toHaveLength(2)
  })

  test('first variation is 8x⅛ oz', () => {
    const v = DEFAULT_BUILD_YOUR_OWN_OZ_CONFIG.variations[0]
    expect(v.totalUnits).toBe(8)
    expect(v.denominationPerUnit).toBe(0.125)
    expect(v.unitLabel).toBe('oz')
  })

  test('has maxPerStrain 2 and lowStockThreshold 3', () => {
    expect(DEFAULT_BUILD_YOUR_OWN_OZ_CONFIG.maxPerStrain).toBe(2)
    expect(DEFAULT_BUILD_YOUR_OWN_OZ_CONFIG.lowStockThreshold).toBe(3)
  })
})

describe('legacy deal ids', () => {
  test('LEGACY_DEAL_IDS are non-empty strings', () => {
    for (const id of LEGACY_DEAL_IDS) {
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    }
  })
})
