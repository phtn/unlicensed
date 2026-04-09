import {describe, expect, test} from 'bun:test'
import {globalFilterFn} from '../components/table-v2/filter-fns'

const createRow = (values: Record<string, unknown>) =>
  ({
    getValue: (columnId: string) => values[columnId],
  }) as Parameters<typeof globalFilterFn>[0]

describe('globalFilterFn', () => {
  test('matches product names by the provided column id', () => {
    const row = createRow({
      name: 'Blue Dream',
      categorySlug: 'flower',
    })

    expect(globalFilterFn(row, 'name', 'blue')).toBe(true)
    expect(globalFilterFn(row, 'name', 'dream')).toBe(true)
    expect(globalFilterFn(row, 'categorySlug', 'blue')).toBe(false)
  })

  test('normalizes diacritics and whitespace for text matches', () => {
    const row = createRow({
      name: '  Crème   Brûlée  ',
    })

    expect(globalFilterFn(row, 'name', 'creme brulee')).toBe(true)
  })

  test('matches array and object-backed cell values through filter tokens', () => {
    const row = createRow({
      availableDenominations: [0.125, 1],
      vendor: {name: 'Top Shelf'},
    })

    expect(globalFilterFn(row, 'availableDenominations', '0.125')).toBe(true)
    expect(globalFilterFn(row, 'vendor', 'top shelf')).toBe(true)
  })
})
