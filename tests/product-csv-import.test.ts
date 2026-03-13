import {describe, expect, test} from 'bun:test'
import {
  EXPECTED_CSV_HEADERS,
  parseProductsCsv,
} from '../app/admin/(routes)/inventory/product/csv-import/lib'

function escapeCsvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function buildCsvRow(values: Partial<Record<string, string>>): string {
  return EXPECTED_CSV_HEADERS.map((header) =>
    escapeCsvCell(values[header] ?? ''),
  ).join(',')
}

describe('product CSV import', () => {
  test('includes shared inventory fields in the expected headers', () => {
    expect(EXPECTED_CSV_HEADERS).toContain('inventoryMode')
    expect(EXPECTED_CSV_HEADERS).toContain('masterStockQuantity')
    expect(EXPECTED_CSV_HEADERS).toContain('masterStockUnit')
    expect(EXPECTED_CSV_HEADERS).toContain('packagingMode')
    expect(EXPECTED_CSV_HEADERS).toContain('stockUnit')
    expect(EXPECTED_CSV_HEADERS).toContain('startingWeight')
    expect(EXPECTED_CSV_HEADERS).toContain('remainingWeight')
  })

  test('parses shared-weight inventory rows without denomination stock', () => {
    const headers = EXPECTED_CSV_HEADERS.join(',')
    const row = buildCsvRow({
      name: 'Shared Flower',
      slug: 'shared-flower',
      categorySlug: 'flower',
      priceCents: '1200',
      unit: 'oz',
      availableDenominations: '[0.5,1]',
      inventoryMode: 'shared_weight',
      masterStockQuantity: '10',
      masterStockUnit: 'lb',
      'stock_0.5': '25',
      stockByDenomination: '{"0.5":25}',
    })

    const result = parseProductsCsv([headers, row].join('\n'))

    expect(result.ok).toBe(true)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].errors).toEqual([])
    expect(result.rows[0].product.inventoryMode).toBe('shared_weight')
    expect(result.rows[0].product.masterStockQuantity).toBe(10)
    expect(result.rows[0].product.masterStockUnit).toBe('lb')
    expect(result.rows[0].product.stock).toBeUndefined()
    expect(result.rows[0].product.stockByDenomination).toBeUndefined()
  })

  test('parses packaging fields from CSV rows', () => {
    const headers = EXPECTED_CSV_HEADERS.join(',')
    const row = buildCsvRow({
      name: 'Bulk Flower',
      slug: 'bulk-flower',
      categorySlug: 'flower',
      priceCents: '4500',
      unit: 'oz',
      packagingMode: 'bulk',
      stockUnit: 'oz',
      startingWeight: '160',
      remainingWeight: '124.5',
    })

    const result = parseProductsCsv([headers, row].join('\n'))

    expect(result.ok).toBe(true)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].errors).toEqual([])
    expect(result.rows[0].product.packagingMode).toBe('bulk')
    expect(result.rows[0].product.stockUnit).toBe('oz')
    expect(result.rows[0].product.startingWeight).toBe(160)
    expect(result.rows[0].product.remainingWeight).toBe(124.5)
  })
})
