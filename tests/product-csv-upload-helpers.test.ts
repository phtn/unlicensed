import {describe, expect, test} from 'bun:test'
import {
  CSV_DENOM_KEYS,
  EXPECTED_CSV_HEADERS,
  parseProductsCsv,
} from '../app/admin/(routes)/inventory/product/csv-import/lib'
import {
  buildRowsWithConflicts,
  getPreviewCellIssue,
  getPreviewColumns,
  getRowPreviewIssues,
  mapImportRowErrors,
  seedDefaultDenominationStock,
  seedDefaultImage,
  seedDenominationColumnsFromMaps,
} from '../app/admin/(routes)/inventory/tools/product-csv-upload-helpers'

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

describe('product CSV upload helpers', () => {
  test('getPreviewColumns hides internal fields and keeps status columns', () => {
    const parseResult = parseProductsCsv(
      buildCsv({
        _id: EXISTING_PRODUCT_ID,
        name: 'Existing Flower',
        slug: 'existing-flower',
        categorySlug: 'flower',
        priceCents: '3500',
      }),
    )

    const columns = getPreviewColumns(parseResult, parseResult.rows)

    expect(columns[0]).toBe('#')
    expect(columns.at(-1)).toBe('Status')
    expect(columns).not.toContain('_id')
    expect(columns).not.toContain('_creationTime')
    expect(columns).toContain('name')
    expect(columns).toContain('slug')
  })

  test('seedDenominationColumnsFromMaps expands JSON denomination maps into preview columns and product fields', () => {
    const parseResult = parseProductsCsv(
      buildCsv({
        name: 'Mapped Flower',
        slug: 'mapped-flower',
        categorySlug: 'flower',
        inventoryMode: 'by_denomination',
        priceByDenomination: '{"0.25":4500,"1":"16000"}',
        stockByDenomination: '{"0.25":5,"1":"8"}',
      }),
    )

    const seeded = seedDenominationColumnsFromMaps(parseResult)
    const row = seeded.rows[0]

    expect(seeded.headers).toContain('price_0.25')
    expect(seeded.headers).toContain('stock_0.25')
    expect(seeded.headers).toContain('price_1')
    expect(seeded.headers).toContain('stock_1')
    expect(row.raw['price_0.25']).toBe('4500')
    expect(row.raw.stock_1).toBe('8')
    expect(row.product.priceByDenomination).toEqual({0.25: 4500, 1: 16000})
    expect(row.product.stockByDenomination).toEqual({0.25: 5, 1: 8})
  })

  test('seedDefaultImage adds the default image when the CSV row is missing one', () => {
    const parseResult = parseProductsCsv(
      buildCsv({
        name: 'No Image Flower',
        slug: 'no-image-flower',
        categorySlug: 'flower',
      }),
    )

    const seeded = seedDefaultImage(parseResult)
    const row = seeded.rows[0]

    expect(seeded.headers).toContain('image')
    expect(row.raw.image).toBe('kg24p8cjdd0rr1fnsjzspxxa1182b51r')
    expect(row.product.image).toBe('kg24p8cjdd0rr1fnsjzspxxa1182b51r')
  })

  test('seedDefaultImage does not inject a default image for update rows with a blank image cell', () => {
    const parseResult = parseProductsCsv(
      buildCsv({
        _id: EXISTING_PRODUCT_ID,
        name: 'Existing Flower',
        slug: 'existing-flower',
        categorySlug: 'flower',
        image: '',
      }),
    )

    const seeded = seedDefaultImage(parseResult)
    const row = seeded.rows[0]

    expect(row.raw.image).toBe('')
    expect(row.product.image).toBeUndefined()
  })

  test('seedDefaultDenominationStock fills default stock for non-shared inventory rows', () => {
    const parseResult = parseProductsCsv(
      buildCsv({
        name: 'Default Stock Flower',
        slug: 'default-stock-flower',
        categorySlug: 'flower',
        inventoryMode: 'by_denomination',
      }),
    )

    const seeded = seedDefaultDenominationStock(parseResult)
    const row = seeded.rows[0]
    const firstDenomination = CSV_DENOM_KEYS[0]

    expect(seeded.headers).toContain(`stock_${firstDenomination}`)
    expect(row.raw[`stock_${firstDenomination}`]).toBe('0')
    expect(row.product.stockByDenomination).toEqual(
      Object.fromEntries(CSV_DENOM_KEYS.map((key) => [key, 0])),
    )
  })

  test('seedDefaultDenominationStock does not inject default stock for shared inventory rows', () => {
    const parseResult = parseProductsCsv(
      buildCsv({
        name: 'Shared Flower',
        slug: 'shared-flower',
        categorySlug: 'flower',
        inventoryMode: 'shared',
        masterStockQuantity: '10',
        masterStockUnit: 'lb',
      }),
    )

    const seeded = seedDefaultDenominationStock(parseResult)
    const row = seeded.rows[0]

    expect(row.raw['stock_0.125']).toBe('')
    expect(row.product.stockByDenomination).toBeUndefined()
  })

  test('seedDefaultDenominationStock does not inject default stock for update rows with blank stock cells', () => {
    const parseResult = parseProductsCsv(
      buildCsv({
        _id: EXISTING_PRODUCT_ID,
        name: 'Existing Flower',
        slug: 'existing-flower',
        categorySlug: 'flower',
        inventoryMode: 'by_denomination',
      }),
    )

    const seeded = seedDefaultDenominationStock(parseResult)
    const row = seeded.rows[0]

    expect(row.raw['stock_0.125']).toBe('')
    expect(row.product.stockByDenomination).toBeUndefined()
  })

  test('buildRowsWithConflicts derives a slug from the name when the slug cell is blank', () => {
    const parseResult = parseProductsCsv(
      buildCsv({
        name: 'Blue Dream',
        slug: '',
        categorySlug: 'flower',
      }),
    )

    const rows = buildRowsWithConflicts(
      parseResult,
      new Map(),
      new Set(['flower']),
    )

    expect(rows).toBeDefined()
    expect(rows?.[0].raw.slug).toBe('blue-dream')
    expect(rows?.[0].product.slug).toBe('blue-dream')
    expect(rows?.[0].conflict).toBeNull()
  })

  test('buildRowsWithConflicts appends the category slug when a derived slug already exists', () => {
    const parseResult = parseProductsCsv(
      buildCsv({
        name: 'Blue Dream',
        slug: '',
        categorySlug: 'flower',
      }),
    )

    const rows = buildRowsWithConflicts(
      parseResult,
      new Map([['blue-dream', EXISTING_PRODUCT_ID]]),
      new Set(['flower']),
    )

    expect(rows).toBeDefined()
    expect(rows?.[0].raw.slug).toBe('blue-dream-flower')
    expect(rows?.[0].product.slug).toBe('blue-dream-flower')
    expect(rows?.[0].conflict).toBeNull()
  })

  test('buildRowsWithConflicts allows same-_id replacements to keep an existing slug', () => {
    const parseResult = parseProductsCsv(
      buildCsv({
        _id: EXISTING_PRODUCT_ID,
        name: 'Existing Flower',
        slug: 'existing-flower',
        categorySlug: 'flower',
      }),
    )

    const rows = buildRowsWithConflicts(
      parseResult,
      new Map([['existing-flower', EXISTING_PRODUCT_ID]]),
      new Set(['flower']),
    )

    expect(rows).toBeDefined()
    expect(rows?.[0].conflict).toBeNull()
    expect(rows?.[0].errors).not.toContain(
      'Slug "existing-flower" already exists',
    )
  })

  test('buildRowsWithConflicts keeps a blank slug untouched for update rows', () => {
    const parseResult = parseProductsCsv(
      buildCsv({
        _id: EXISTING_PRODUCT_ID,
        name: 'Existing Flower',
        slug: '',
        categorySlug: 'flower',
      }),
    )

    const rows = buildRowsWithConflicts(
      parseResult,
      new Map([['existing-flower', EXISTING_PRODUCT_ID]]),
      new Set(['flower']),
    )

    expect(rows).toBeDefined()
    expect(rows?.[0].raw.slug).toBe('')
    expect(rows?.[0].product.slug).toBeUndefined()
    expect(rows?.[0].conflict).toBeNull()
    expect(rows?.[0].errors).toEqual([])
  })

  test('buildRowsWithConflicts adds category errors and slug conflicts for invalid replacement targets', () => {
    const parseResult = parseProductsCsv(
      buildCsv({
        name: 'Conflicting Flower',
        slug: 'existing-flower',
        categorySlug: 'missing-category',
      }),
    )

    const rows = buildRowsWithConflicts(
      parseResult,
      new Map([['existing-flower', OTHER_PRODUCT_ID]]),
      new Set(['flower']),
    )

    expect(rows).toBeDefined()
    expect(rows?.[0].conflict).toBe('slug')
    expect(rows?.[0].errors).toContain('Category "missing-category" not found')
    expect(rows?.[0].errors).toContain('Slug "existing-flower" already exists')
  })

  test('buildRowsWithConflicts flags later create rows that duplicate a slug inside the same import', () => {
    const parseResult = parseProductsCsv(
      buildCsv(
        {
          name: 'Duplicate Flower First',
          slug: 'duplicate-flower',
          categorySlug: 'flower',
        },
        {
          name: 'Duplicate Flower Second',
          slug: 'duplicate-flower',
          categorySlug: 'flower',
        },
      ),
    )

    const rows = buildRowsWithConflicts(
      parseResult,
      new Map(),
      new Set(['flower']),
    )

    expect(rows).toBeDefined()
    expect(rows?.[0].conflict).toBeNull()
    expect(rows?.[1].conflict).toBe('slug')
    expect(rows?.[1].errors).toContain('Slug "duplicate-flower" already exists')
  })

  test('getPreviewCellIssue maps validation messages to required, type, and conflict labels', () => {
    const typedResult = parseProductsCsv(
      buildCsv({
        name: '',
        slug: 'bad-flower',
        categorySlug: 'flower',
        priceCents: 'abc',
        effects: 'not-json',
        inventoryMode: 'broken',
      }),
    )
    const typedRow = typedResult.rows[0]

    expect(getPreviewCellIssue(typedRow, 'name')).toEqual({
      label: 'REQUIRED',
      message: 'Name is required and must be at least 2 characters',
    })
    expect(getPreviewCellIssue(typedRow, 'priceCents')).toEqual({
      label: 'NUMBER TYPE',
      message: 'priceCents must be a number',
    })
    expect(getPreviewCellIssue(typedRow, 'effects')).toEqual({
      label: 'ARRAY TYPE',
      message: 'effects must be a JSON array',
    })
    expect(getPreviewCellIssue(typedRow, 'inventoryMode')).toEqual({
      label: 'VALUE TYPE',
      message: 'inventoryMode must be by_denomination or shared',
    })

    const conflictRows = buildRowsWithConflicts(
      parseProductsCsv(
        buildCsv({
          name: 'Conflict Flower',
          slug: 'existing-flower',
          categorySlug: 'flower',
        }),
      ),
      new Map([['existing-flower', OTHER_PRODUCT_ID]]),
      new Set(['flower']),
    )

    const conflictRow = conflictRows?.[0]

    expect(conflictRow).toBeDefined()
    if (!conflictRow) {
      throw new Error('Expected conflict row to be defined')
    }

    expect(getPreviewCellIssue(conflictRow, 'slug')).toEqual({
      label: 'CONFLICT',
      message: 'Slug already exists',
    })
  })

  test('getRowPreviewIssues returns issue entries with the matching columns', () => {
    const parseResult = parseProductsCsv(
      buildCsv({
        name: 'Bad Flower',
        slug: 'bad-flower',
        categorySlug: 'flower',
        priceCents: 'abc',
        effects: 'not-json',
      }),
    )

    const columns = getPreviewColumns(parseResult, parseResult.rows)
    const issues = getRowPreviewIssues(parseResult.rows[0], columns)

    expect(issues).toEqual(
      expect.arrayContaining([
        {
          column: 'priceCents',
          label: 'NUMBER TYPE',
          message: 'priceCents must be a number',
        },
        {
          column: 'effects',
          label: 'ARRAY TYPE',
          message: 'effects must be a JSON array',
        },
      ]),
    )
  })

  test('mapImportRowErrors remaps backend indices to the original CSV row numbers after filtering invalid rows', () => {
    const parseResult = parseProductsCsv(
      buildCsv(
        {
          _id: EXISTING_PRODUCT_ID,
          name: 'Existing Flower',
          slug: 'existing-flower',
          categorySlug: 'flower',
          priceCents: '3500',
        },
        {
          name: 'Broken Flower',
          slug: 'broken-flower',
          categorySlug: '',
          priceCents: '2800',
        },
        {
          name: 'New Flower',
          slug: 'new-flower',
          categorySlug: 'flower',
          priceCents: '2800',
        },
      ),
    )

    const rows = buildRowsWithConflicts(
      parseResult,
      new Map([['existing-flower', EXISTING_PRODUCT_ID]]),
      new Set(['flower']),
    )
    const validRows =
      rows?.filter((row) => row.errors.length === 0 && row.conflict === null) ??
      []

    const errors = mapImportRowErrors(
      [
        {
          rowIndex: 1,
          slug: 'new-flower',
          message: 'Category "flower" not found.',
        },
      ],
      validRows,
    )

    expect(validRows).toHaveLength(2)
    expect(errors).toEqual([
      {
        rowIndex: 3,
        slug: 'new-flower',
        message: 'Category "flower" not found.',
      },
    ])
  })
})
