import {describe, expect, test} from 'bun:test'
import {sortProductCsvImportRowsForProcessing} from '../lib/product-csv-import'

describe('product CSV import ordering', () => {
  test('processes replacement rows before create rows while preserving relative order', () => {
    const rows = [
      {name: 'Create A'},
      {_id: 'prod_existing_1', name: 'Replace A'},
      {name: 'Create B'},
      {_id: 'prod_existing_2', name: 'Replace B'},
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
})
