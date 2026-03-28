import {describe, expect, test} from 'bun:test'
import {
  mergeDefinedCsvImportFields,
  sortProductCsvImportRowsForProcessing,
} from '../lib/product-csv-import'

const REPLACEMENT_ID_A = 'replaceproducta1234567890'
const REPLACEMENT_ID_B = 'replaceproductb1234567890'

describe('product CSV import ordering', () => {
  test('processes replacement rows before create rows while preserving relative order', () => {
    const rows = [
      {name: 'Create A'},
      {_id: REPLACEMENT_ID_A, name: 'Replace A'},
      {name: 'Create B'},
      {_id: REPLACEMENT_ID_B, name: 'Replace B'},
    ]

    const orderedRows = sortProductCsvImportRowsForProcessing(rows)

    expect(orderedRows.map(({rowIndex}) => rowIndex)).toEqual([1, 3, 0, 2])
    expect(orderedRows.map(({row}) => row.name)).toEqual([
      'Replace A',
      'Replace B',
      'Create A',
      'Create B',
    ])
  })

  test('mergeDefinedCsvImportFields only overwrites fields provided by the CSV row', () => {
    const existingProduct = {
      name: 'Existing Flower',
      available: true,
      featured: true,
      categorySlug: 'flower',
      priceCents: 4200,
    }

    const importedRow = {
      name: 'Updated Flower',
      available: undefined,
      featured: false,
      priceCents: undefined,
    }

    expect(mergeDefinedCsvImportFields(existingProduct, importedRow)).toEqual({
      name: 'Updated Flower',
      available: true,
      featured: false,
      categorySlug: 'flower',
      priceCents: 4200,
    })
  })
})
