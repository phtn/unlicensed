import {describe, expect, test} from 'bun:test'
import {
  EXPECTED_CSV_HEADERS,
  applySlugConflicts,
  parseProductsCsv,
} from '../app/admin/(routes)/inventory/product/csv-import/lib'

const EXISTING_PRODUCT_ID = 'existingproduct1234567890'
const OTHER_PRODUCT_ID = 'otherproduct1234567890123'

function escapeCsvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function buildCsvRow(values: Partial<Record<string, string>>): string {
  return EXPECTED_CSV_HEADERS.map((header) =>
    escapeCsvCell(values[header] ?? ''),
  ).join(',')
}

function buildCsv(...rows: Array<Partial<Record<string, string>>>): string {
  return [EXPECTED_CSV_HEADERS.join(','), ...rows.map(buildCsvRow)].join('\n')
}

describe('product CSV import', () => {
  test('includes shared inventory and packaging headers in the export format', () => {
    expect(EXPECTED_CSV_HEADERS).toContain('inventoryMode')
    expect(EXPECTED_CSV_HEADERS).toContain('masterStockQuantity')
    expect(EXPECTED_CSV_HEADERS).toContain('masterStockUnit')
    expect(EXPECTED_CSV_HEADERS).toContain('packagingMode')
    expect(EXPECTED_CSV_HEADERS).toContain('stockUnit')
    expect(EXPECTED_CSV_HEADERS).toContain('startingWeight')
    expect(EXPECTED_CSV_HEADERS).toContain('remainingWeight')
  })

  test('returns a file error for an empty CSV', () => {
    expect(parseProductsCsv('').fileError).toBe('File is empty')
  })

  test('parses CSV files with a UTF-8 BOM header prefix', () => {
    const result = parseProductsCsv(
      `\uFEFF${buildCsv({
        name: 'BOM Flower',
        slug: 'bom-flower',
        categorySlug: 'flower',
      })}`,
    )

    expect(result.ok).toBe(true)
    expect(result.headers[0]).toBe(EXPECTED_CSV_HEADERS[0])
    expect(result.rows[0].product.name).toBe('BOM Flower')
    expect(result.rows[0].errors).toEqual([])
  })

  test('parses multiline quoted fields without splitting a product into multiple rows', () => {
    const result = parseProductsCsv(
      buildCsv({
        name: 'Story Flower',
        slug: 'story-flower',
        categorySlug: 'flower',
        description:
          'Top shelf,\nwith a second line and "quoted" tasting notes.',
      }),
    )

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].product.description).toBe(
      'Top shelf,\nwith a second line and "quoted" tasting notes.',
    )
    expect(result.rows[0].errors).toEqual([])
  })

  test('parses legacy shared_weight rows and normalizes them to shared inventory', () => {
    const result = parseProductsCsv(
      buildCsv({
        name: 'Shared Flower',
        slug: 'shared-flower',
        categorySlug: 'flower',
        priceCents: '1200',
        unit: 'oz',
        availableDenominations: '[0.5,1]',
        inventoryMode: 'shared_weight',
        masterStockQuantity: '10',
        masterStockUnit: 'lb',
        stockByDenomination: '{"0.5":25}',
      }),
    )

    expect(result.ok).toBe(true)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].errors).toEqual([])
    expect(result.rows[0].product.inventoryMode).toBe('shared')
    expect(result.rows[0].product.masterStockQuantity).toBe(10)
    expect(result.rows[0].product.masterStockUnit).toBe('lb')
    expect(result.rows[0].product.stock).toBeUndefined()
    expect(result.rows[0].product.stockByDenomination).toBeUndefined()
  })

  test('parses packaging fields from CSV rows', () => {
    const result = parseProductsCsv(
      buildCsv({
        name: 'Bulk Flower',
        slug: 'bulk-flower',
        categorySlug: 'flower',
        priceCents: '4500',
        unit: 'oz',
        packagingMode: 'bulk',
        stockUnit: 'oz',
        startingWeight: '160',
        remainingWeight: '124.5',
      }),
    )

    expect(result.ok).toBe(true)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].errors).toEqual([])
    expect(result.rows[0].product.packagingMode).toBe('bulk')
    expect(result.rows[0].product.stockUnit).toBe('oz')
    expect(result.rows[0].product.startingWeight).toBe(160)
    expect(result.rows[0].product.remainingWeight).toBe(124.5)
  })

  test('preserves _id values so matching rows can replace existing products', () => {
    const result = parseProductsCsv(
      buildCsv({
        _id: EXISTING_PRODUCT_ID,
        name: 'Existing Flower',
        slug: 'existing-flower',
        categorySlug: 'flower',
        priceCents: '3500',
      }),
    )

    expect(result.rows[0].product._id).toBe(EXISTING_PRODUCT_ID)

    applySlugConflicts(
      result.rows,
      new Map([['existing-flower', EXISTING_PRODUCT_ID]]),
    )

    expect(result.rows[0].conflict).toBeNull()
    expect(result.rows[0].errors).toEqual([])
  })

  test('treats blank boolean cells on update rows as omitted values', () => {
    const result = parseProductsCsv(
      buildCsv({
        _id: EXISTING_PRODUCT_ID,
        name: 'Existing Flower',
        slug: 'existing-flower',
        categorySlug: 'flower',
        available: '',
        featured: '',
        eligibleForRewards: '',
      }),
    )

    expect(result.rows[0].product.available).toBeUndefined()
    expect(result.rows[0].product.featured).toBeUndefined()
    expect(result.rows[0].product.eligibleForRewards).toBeUndefined()
    expect(result.rows[0].errors).toEqual([])
  })

  test('still parses explicit false boolean values from CSV rows', () => {
    const result = parseProductsCsv(
      buildCsv({
        name: 'False Flower',
        slug: 'false-flower',
        categorySlug: 'flower',
        available: 'false',
        featured: '0',
        eligibleForRewards: 'false',
      }),
    )

    expect(result.rows[0].product.available).toBe(false)
    expect(result.rows[0].product.featured).toBe(false)
    expect(result.rows[0].product.eligibleForRewards).toBe(false)
    expect(result.rows[0].errors).toEqual([])
  })

  test('flags slug conflicts when the row does not own the existing slug', () => {
    const result = parseProductsCsv(
      buildCsv({
        name: 'Conflicting Flower',
        slug: 'existing-flower',
        categorySlug: 'flower',
        priceCents: '3500',
      }),
    )

    applySlugConflicts(
      result.rows,
      new Map([['existing-flower', OTHER_PRODUCT_ID]]),
    )

    expect(result.rows[0].conflict).toBe('slug')
    expect(result.rows[0].errors).toContain(
      'Slug "existing-flower" already exists',
    )
  })

  test('prefers replacement rows over create rows when the same slug appears in one import', () => {
    const result = parseProductsCsv(
      buildCsv(
        {
          name: 'Fresh Drop Duplicate',
          slug: 'fresh-drop',
          categorySlug: 'flower',
          priceCents: '3500',
        },
        {
          _id: EXISTING_PRODUCT_ID,
          name: 'Fresh Drop',
          slug: 'fresh-drop',
          categorySlug: 'flower',
          priceCents: '4200',
        },
      ),
    )

    applySlugConflicts(result.rows, new Map())

    expect(result.rows[0].conflict).toBe('slug')
    expect(result.rows[0].errors).toContain('Slug "fresh-drop" already exists')
    expect(result.rows[1].conflict).toBeNull()
    expect(result.rows[1].errors).toEqual([])
  })

  test('requires master stock fields for shared inventory rows without denomination stock input', () => {
    const result = parseProductsCsv(
      buildCsv({
        name: 'Shared Flower',
        slug: 'shared-flower',
        categorySlug: 'flower',
        inventoryMode: 'shared',
        unit: 'oz',
      }),
    )

    expect(result.rows[0].errors).toContain(
      'masterStockQuantity is required and must be a non-negative number when inventoryMode is shared',
    )
    expect(result.rows[0].errors).toContain(
      'masterStockUnit is required when inventoryMode is shared',
    )
  })

  test('accepts shared inventory rows when per-denomination stock is provided', () => {
    const result = parseProductsCsv(
      buildCsv({
        name: 'Shared Flower',
        slug: 'shared-flower',
        categorySlug: 'flower',
        inventoryMode: 'shared',
        stockByDenomination: '{"0.125":6,"0.25":10}',
      }),
    )

    expect(result.rows[0].errors).not.toContain(
      'masterStockQuantity is required and must be a non-negative number when inventoryMode is shared',
    )
    expect(result.rows[0].errors).not.toContain(
      'masterStockUnit is required when inventoryMode is shared',
    )
  })

  test('accepts shared inventory rows when denomination stock is provided via exported stock columns', () => {
    const result = parseProductsCsv(
      buildCsv({
        name: 'Shared Export Flower',
        slug: 'shared-export-flower',
        categorySlug: 'flower',
        inventoryMode: 'shared',
        'stock_0.125': '6',
      }),
    )

    expect(result.rows[0].errors).not.toContain(
      'masterStockQuantity is required and must be a non-negative number when inventoryMode is shared',
    )
    expect(result.rows[0].errors).not.toContain(
      'masterStockUnit is required when inventoryMode is shared',
    )
  })

  test('reports numeric field type errors with field-specific messages', () => {
    const result = parseProductsCsv(
      buildCsv({
        name: 'Typed Flower',
        slug: 'typed-flower',
        categorySlug: 'flower',
        priceCents: 'abc',
        rating: 'oops',
        'stock_0.125': 'bad',
      }),
    )

    expect(result.rows[0].errors).toContain('priceCents must be a number')
    expect(result.rows[0].errors).toContain('rating must be a number')
    expect(result.rows[0].errors).toContain('stock_0.125 must be a number')
  })

  test('reports array field type errors with field-specific messages', () => {
    const result = parseProductsCsv(
      buildCsv({
        name: 'Array Flower',
        slug: 'array-flower',
        categorySlug: 'flower',
        effects: 'not-json',
        tags: '{"bad":"shape"}',
      }),
    )

    expect(result.rows[0].errors).toContain('effects must be a JSON array')
    expect(result.rows[0].errors).toContain('tags must be a JSON array')
  })

  test('reports invalid enum values with explicit messages', () => {
    const result = parseProductsCsv(
      buildCsv({
        name: 'Enum Flower',
        slug: 'enum-flower',
        categorySlug: 'flower',
        inventoryMode: 'broken',
        packagingMode: 'bagged',
        dealType: 'unknown',
      }),
    )

    expect(result.rows[0].errors).toContain(
      'inventoryMode must be by_denomination or shared',
    )
    expect(result.rows[0].errors).toContain(
      'packagingMode must be bulk or prepack',
    )
    expect(result.rows[0].errors).toContain(
      'dealType must be withinTier or acrossTiers',
    )
  })
})
