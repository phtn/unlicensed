import {describe, expect, test} from 'bun:test'
import {
  parseSelectionsString,
  serializeSelections,
  BUNDLE_PARAM_KEYS,
} from '@/app/lobby/(store)/deals/searchParams'
import type {BundleType} from '@/app/lobby/(store)/deals/lib/deal-types'

describe('parseSelectionsString', () => {
  test('returns empty map for empty string', () => {
    expect(parseSelectionsString('')).toEqual(new Map())
  })

  test('returns empty map for whitespace-only string', () => {
    expect(parseSelectionsString('   ')).toEqual(new Map())
  })

  test('parses single product:id', () => {
    const result = parseSelectionsString('prod123:2')
    expect(result.size).toBe(1)
    expect(result.get('prod123')).toEqual({
      productId: 'prod123',
      quantity: 2,
    })
  })

  test('parses multiple products', () => {
    const result = parseSelectionsString('id1:2,id2:1,id3:5')
    expect(result.size).toBe(3)
    expect(result.get('id1')).toEqual({productId: 'id1', quantity: 2})
    expect(result.get('id2')).toEqual({productId: 'id2', quantity: 1})
    expect(result.get('id3')).toEqual({productId: 'id3', quantity: 5})
  })

  test('skips malformed parts (missing quantity)', () => {
    const result = parseSelectionsString('id1:2,id2:,id3:1')
    expect(result.size).toBe(2)
    expect(result.get('id1')).toEqual({productId: 'id1', quantity: 2})
    expect(result.get('id3')).toEqual({productId: 'id3', quantity: 1})
  })

  test('skips invalid quantity (NaN)', () => {
    const result = parseSelectionsString('id1:abc,id2:1')
    expect(result.size).toBe(1)
    expect(result.get('id2')).toEqual({productId: 'id2', quantity: 1})
  })

  test('skips zero or negative quantity', () => {
    const result = parseSelectionsString('id1:0,id2:-1,id3:1')
    expect(result.size).toBe(1)
    expect(result.get('id3')).toEqual({productId: 'id3', quantity: 1})
  })

  test('trims product ids', () => {
    const result = parseSelectionsString('  id1  :2  ')
    expect(result.size).toBe(1)
    expect(result.get('id1')).toEqual({
      productId: 'id1',
      quantity: 2,
    })
  })
})

describe('serializeSelections', () => {
  test('returns empty string for empty map', () => {
    expect(serializeSelections(new Map())).toBe('')
  })

  test('serializes single entry', () => {
    const map = new Map([
      ['prod123', {productId: 'prod123', quantity: 2}],
    ])
    expect(serializeSelections(map)).toBe('prod123:2')
  })

  test('serializes multiple entries', () => {
    const map = new Map([
      ['id1', {productId: 'id1', quantity: 2}],
      ['id2', {productId: 'id2', quantity: 1}],
      ['id3', {productId: 'id3', quantity: 5}],
    ])
    const result = serializeSelections(map)
    expect(result).toContain('id1:2')
    expect(result).toContain('id2:1')
    expect(result).toContain('id3:5')
    expect(result.split(',')).toHaveLength(3)
  })

  test('filters out entries with quantity <= 0', () => {
    const map = new Map([
      ['id1', {productId: 'id1', quantity: 2}],
      ['id2', {productId: 'id2', quantity: 0}],
      ['id3', {productId: 'id3', quantity: -1}],
    ])
    const result = serializeSelections(map)
    expect(result).toBe('id1:2')
  })

  test('round-trip: parse then serialize preserves data', () => {
    const input = 'prod_a:3,prod_b:1,prod_c:2'
    const parsed = parseSelectionsString(input)
    const serialized = serializeSelections(parsed)
    const reparsed = parseSelectionsString(serialized)
    expect(reparsed.size).toBe(parsed.size)
    for (const [id, val] of parsed) {
      expect(reparsed.get(id)).toEqual(val)
    }
  })

  test('round-trip: serialize then parse preserves data', () => {
    const map = new Map([
      ['p1', {productId: 'p1', quantity: 2}],
      ['p2', {productId: 'p2', quantity: 1}],
    ])
    const serialized = serializeSelections(map)
    const parsed = parseSelectionsString(serialized)
    expect(parsed.size).toBe(map.size)
    for (const [id, val] of map) {
      expect(parsed.get(id)).toEqual(val)
    }
  })
})

describe('BUNDLE_PARAM_KEYS', () => {
  const bundleTypes: BundleType[] = [
    'build-your-own-oz',
    'mix-match-4oz',
    'extracts-3g',
    'extracts-7g',
    'edibles-prerolls-5',
    'edibles-prerolls-10',
  ]

  test('has keys for all bundle types', () => {
    for (const id of bundleTypes) {
      const keys = BUNDLE_PARAM_KEYS[id]
      expect(keys).toBeDefined()
      expect(keys.v).toBeDefined()
      expect(keys.s).toBeDefined()
      expect(typeof keys.v).toBe('string')
      expect(typeof keys.s).toBe('string')
    }
  })

  test('variation keys are unique per bundle', () => {
    const vKeys = bundleTypes.map((id) => BUNDLE_PARAM_KEYS[id].v)
    expect(new Set(vKeys).size).toBe(bundleTypes.length)
  })

  test('selection keys are unique per bundle', () => {
    const sKeys = bundleTypes.map((id) => BUNDLE_PARAM_KEYS[id].s)
    expect(new Set(sKeys).size).toBe(bundleTypes.length)
  })
})
