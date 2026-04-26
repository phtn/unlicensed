import {describe, expect, test} from 'bun:test'
import {
  normalizeComparableAttributeValue,
  resolveAttributeSlug,
  resolveAttributeSlugs,
} from '../lib/product-attribute-normalization'

describe('product attribute normalization', () => {
  test('resolves category attribute names and slugs to the stored slug', () => {
    const options = [
      {name: 'Fresh Frozen', slug: 'fresh-frozen'},
      {name: 'Live Rosin', slug: 'live-rosin'},
    ]

    expect(resolveAttributeSlug('Fresh Frozen', options)).toBe('fresh-frozen')
    expect(resolveAttributeSlug('fresh-frozen', options)).toBe('fresh-frozen')
    expect(resolveAttributeSlug('Live Rosin', options)).toBe('live-rosin')
  })

  test('supports legacy string-only attribute lists', () => {
    const legacyOptions = ['Tier 1', 'Persy Badder', 'Live Rosin Badder']

    expect(resolveAttributeSlug('Tier 1', legacyOptions)).toBe('tier-1')
    expect(resolveAttributeSlug('tier-1', legacyOptions)).toBe('tier-1')
    expect(resolveAttributeSlug('Persy Badder', legacyOptions)).toBe(
      'persy-badder',
    )
  })

  test('normalizes and deduplicates multi-select values', () => {
    const options = [
      {name: 'CBX', slug: 'cbx'},
      {name: 'Happy Heads', slug: 'happy-heads'},
    ]

    expect(
      resolveAttributeSlugs([' CBX ', 'cbx', 'Happy Heads'], options),
    ).toEqual(['cbx', 'happy-heads'])
  })

  test('creates comparable filter values even when stored data uses labels', () => {
    const options = ['Live Rosin Badder']

    expect(
      normalizeComparableAttributeValue('Live Rosin Badder', options),
    ).toBe('live-rosin-badder')
    expect(normalizeComparableAttributeValue('live-rosin-badder', options)).toBe(
      'live-rosin-badder',
    )
  })
})
