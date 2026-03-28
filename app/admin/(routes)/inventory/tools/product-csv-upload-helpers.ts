import {getProductCsvImportRowId} from '@/lib/product-csv-import'
import {slugify} from '@/lib/slug'
import {CSV_DENOM_KEYS} from '../product/csv-import/constants'
import {
  applySlugConflicts,
  OMIT_FROM_IMPORT_HEADERS,
  type ParsedRow,
  type ParseResult,
} from '../product/csv-import/lib'

const DEFAULT_PRODUCT_IMAGE_STORAGE_ID = 'kg24p8cjdd0rr1fnsjzspxxa1182b51r'
const DEFAULT_DENOMINATION_STOCK = 0

export type PreviewCellIssue = {
  label: 'REQUIRED' | 'NUMBER TYPE' | 'ARRAY TYPE' | 'VALUE TYPE' | 'CONFLICT'
  message: string
}

export type PreviewIssueEntry = PreviewCellIssue & {
  column: string
}

export type ImportRowError = {
  rowIndex: number
  slug?: string
  message: string
}

/** CSV column order for preview: #, ...file headers (excluding _id, _creationTime), Status */
export function getPreviewColumns(
  fileParseResult: ParseResult | null,
  displayRows: ParsedRow[],
): string[] {
  const headers =
    fileParseResult?.headers ??
    (displayRows.length > 0 ? Object.keys(displayRows[0].raw) : [])
  const visible = headers.filter((h) => !OMIT_FROM_IMPORT_HEADERS.has(h))
  return ['#', ...visible, 'Status']
}

export function parseDenominationMapCell(
  value: string | undefined,
): Record<string, number> {
  if (!value?.trim()) return {}

  try {
    const parsed = JSON.parse(value) as unknown
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([key, rawValue]) => {
        const normalizedKey = key.trim()
        const numericValue =
          typeof rawValue === 'number'
            ? rawValue
            : typeof rawValue === 'string'
              ? Number(rawValue)
              : Number.NaN

        if (!normalizedKey || !Number.isFinite(numericValue)) {
          return []
        }

        return [[normalizedKey, numericValue]]
      }),
    )
  } catch {
    return {}
  }
}

export function sortDenominationKeys(keys: Iterable<string>): string[] {
  const uniqueKeys = [...new Set(Array.from(keys).map((key) => key.trim()))]
    .filter(Boolean)
    .sort((a, b) => {
      const aKnownIndex = CSV_DENOM_KEYS.indexOf(
        a as (typeof CSV_DENOM_KEYS)[number],
      )
      const bKnownIndex = CSV_DENOM_KEYS.indexOf(
        b as (typeof CSV_DENOM_KEYS)[number],
      )

      if (aKnownIndex !== -1 && bKnownIndex !== -1) {
        return aKnownIndex - bKnownIndex
      }

      const aNum = Number(a)
      const bNum = Number(b)
      if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) {
        return aNum - bNum
      }

      return a.localeCompare(b, undefined, {numeric: true})
    })

  return uniqueKeys
}

export function seedDenominationColumnsFromMaps(
  parseResult: ParseResult,
): ParseResult {
  if (!parseResult.ok || parseResult.rows.length === 0) {
    return parseResult
  }

  const denominationKeys = new Set<string>()

  const rows = parseResult.rows.map((row) => {
    const priceByDenominationFromCell = parseDenominationMapCell(
      row.raw.priceByDenomination,
    )
    const stockByDenominationFromCell = parseDenominationMapCell(
      row.raw.stockByDenomination,
    )

    for (const key of Object.keys(priceByDenominationFromCell)) {
      denominationKeys.add(key)
    }
    for (const key of Object.keys(stockByDenominationFromCell)) {
      denominationKeys.add(key)
    }

    const nextRaw = {...row.raw}
    for (const [key, value] of Object.entries(priceByDenominationFromCell)) {
      const column = `price_${key}`
      if (!nextRaw[column]?.trim()) {
        nextRaw[column] = String(value)
      }
    }
    for (const [key, value] of Object.entries(stockByDenominationFromCell)) {
      const column = `stock_${key}`
      if (!nextRaw[column]?.trim()) {
        nextRaw[column] = String(value)
      }
    }

    const parsedProductPriceByDenomination =
      row.product.priceByDenomination != null &&
      typeof row.product.priceByDenomination === 'object' &&
      !Array.isArray(row.product.priceByDenomination)
        ? (row.product.priceByDenomination as Record<string, number>)
        : {}

    const parsedProductStockByDenomination =
      row.product.stockByDenomination != null &&
      typeof row.product.stockByDenomination === 'object' &&
      !Array.isArray(row.product.stockByDenomination)
        ? (row.product.stockByDenomination as Record<string, number>)
        : {}

    const mergedPriceByDenomination = {
      ...priceByDenominationFromCell,
      ...parsedProductPriceByDenomination,
    }
    const mergedStockByDenomination = {
      ...stockByDenominationFromCell,
      ...parsedProductStockByDenomination,
    }

    return {
      ...row,
      raw: nextRaw,
      product: {
        ...row.product,
        priceByDenomination:
          Object.keys(mergedPriceByDenomination).length > 0
            ? mergedPriceByDenomination
            : undefined,
        stockByDenomination:
          Object.keys(mergedStockByDenomination).length > 0
            ? mergedStockByDenomination
            : undefined,
      },
    }
  })

  const seededHeaders = sortDenominationKeys(denominationKeys).flatMap(
    (key) => [`price_${key}`, `stock_${key}`],
  )
  const headers = [
    ...parseResult.headers,
    ...seededHeaders.filter((header) => !parseResult.headers.includes(header)),
  ]

  return {...parseResult, headers, rows}
}

export function seedDefaultImage(parseResult: ParseResult): ParseResult {
  if (!parseResult.ok || parseResult.rows.length === 0) {
    return parseResult
  }

  const rows = parseResult.rows.map((row) => {
    if (getProductCsvImportRowId(row.product)) {
      return row
    }

    if (row.raw.image?.trim() || String(row.product.image ?? '').trim()) {
      return row
    }

    return {
      ...row,
      raw: {
        ...row.raw,
        image: DEFAULT_PRODUCT_IMAGE_STORAGE_ID,
      },
      product: {
        ...row.product,
        image: DEFAULT_PRODUCT_IMAGE_STORAGE_ID,
      },
    }
  })

  const headers = parseResult.headers.includes('image')
    ? parseResult.headers
    : [...parseResult.headers, 'image']

  return {...parseResult, headers, rows}
}

export function seedDefaultDenominationStock(
  parseResult: ParseResult,
): ParseResult {
  if (!parseResult.ok || parseResult.rows.length === 0) {
    return parseResult
  }

  const rows = parseResult.rows.map((row) => {
    if (getProductCsvImportRowId(row.product)) {
      return row
    }

    if (
      row.product.inventoryMode === 'shared' ||
      row.product.inventoryMode === 'shared_weight'
    ) {
      return row
    }

    const parsedProductStockByDenomination =
      row.product.stockByDenomination != null &&
      typeof row.product.stockByDenomination === 'object' &&
      !Array.isArray(row.product.stockByDenomination)
        ? (row.product.stockByDenomination as Record<string, number>)
        : {}

    const nextRaw = {...row.raw}
    const nextStockByDenomination = {...parsedProductStockByDenomination}

    for (const key of CSV_DENOM_KEYS) {
      const column = `stock_${key}`
      const rawValue = nextRaw[column]?.trim()

      if (!rawValue) {
        nextRaw[column] = String(DEFAULT_DENOMINATION_STOCK)
      }

      if (nextStockByDenomination[key] === undefined) {
        nextStockByDenomination[key] = DEFAULT_DENOMINATION_STOCK
      }
    }

    return {
      ...row,
      raw: nextRaw,
      product: {
        ...row.product,
        stockByDenomination: nextStockByDenomination,
      },
    }
  })

  const headers = [
    ...parseResult.headers,
    ...CSV_DENOM_KEYS.map((key) => `stock_${key}`).filter(
      (header) => !parseResult.headers.includes(header),
    ),
  ]

  return {...parseResult, headers, rows}
}

export function getPreviewCellIssue(
  row: ParsedRow,
  column: string,
): PreviewCellIssue | null {
  if (column === 'slug' && row.conflict === 'slug') {
    return {
      label: 'CONFLICT',
      message: 'Slug already exists',
    }
  }

  for (const error of row.errors) {
    if (column === 'name' && error.startsWith('Name is required')) {
      return {label: 'REQUIRED', message: error}
    }
    if (
      column === 'categorySlug' &&
      error === 'Category (categorySlug) is required'
    ) {
      return {label: 'REQUIRED', message: error}
    }
    if (
      column === 'categorySlug' &&
      error.startsWith('Category "') &&
      error.endsWith('" not found')
    ) {
      return {label: 'VALUE TYPE', message: error}
    }
    if (column === 'availableDenominations' && error.startsWith(`${column} `)) {
      return {label: 'ARRAY TYPE', message: error}
    }
    if (column === 'popularDenomination' && error.startsWith(`${column} `)) {
      return {label: 'ARRAY TYPE', message: error}
    }
    if (column === 'effects' && error.startsWith(`${column} `)) {
      return {label: 'ARRAY TYPE', message: error}
    }
    if (column === 'terpenes' && error.startsWith(`${column} `)) {
      return {label: 'ARRAY TYPE', message: error}
    }
    if (column === 'gallery' && error.startsWith(`${column} `)) {
      return {label: 'ARRAY TYPE', message: error}
    }
    if (column === 'flavorNotes' && error.startsWith(`${column} `)) {
      return {label: 'ARRAY TYPE', message: error}
    }
    if (column === 'variants' && error.startsWith(`${column} `)) {
      return {label: 'ARRAY TYPE', message: error}
    }
    if (
      column === 'eligibleDenominationForDeals' &&
      error.startsWith(`${column} `)
    ) {
      return {label: 'ARRAY TYPE', message: error}
    }
    if (column === 'highMargins' && error.startsWith(`${column} `)) {
      return {label: 'ARRAY TYPE', message: error}
    }
    if (column === 'brandCollaborators' && error.startsWith(`${column} `)) {
      return {label: 'ARRAY TYPE', message: error}
    }
    if (column === 'tags' && error.startsWith(`${column} `)) {
      return {label: 'ARRAY TYPE', message: error}
    }
    if (column === 'priceCents' && error.startsWith('priceCents must')) {
      return {label: 'NUMBER TYPE', message: error}
    }
    if (column === 'rating' && error.startsWith('rating must')) {
      return {label: 'NUMBER TYPE', message: error}
    }
    if (column === 'noseRating' && error.startsWith('noseRating must')) {
      return {label: 'NUMBER TYPE', message: error}
    }
    if (error === `${column} must be a number`) {
      return {label: 'NUMBER TYPE', message: error}
    }
    if (column === 'inventoryMode' && error.startsWith('inventoryMode must')) {
      return {label: 'VALUE TYPE', message: error}
    }
    if (
      column === 'masterStockQuantity' &&
      error.startsWith('masterStockQuantity is required')
    ) {
      return {label: 'REQUIRED', message: error}
    }
    if (
      column === 'masterStockUnit' &&
      error.startsWith('masterStockUnit is required')
    ) {
      return {label: 'REQUIRED', message: error}
    }
    if (column === 'packagingMode' && error.startsWith('packagingMode must')) {
      return {label: 'VALUE TYPE', message: error}
    }
    if (column === 'dealType' && error.startsWith('dealType must')) {
      return {label: 'VALUE TYPE', message: error}
    }
    if (
      column === 'slug' &&
      error.startsWith('Slug "') &&
      error.endsWith('" already exists')
    ) {
      return {label: 'CONFLICT', message: error}
    }
  }

  return null
}

export function getRowPreviewIssues(
  row: ParsedRow,
  columns: string[],
): PreviewIssueEntry[] {
  return columns.flatMap((column) => {
    if (column === '#' || column === 'Status') return []
    const issue = getPreviewCellIssue(row, column)
    return issue ? [{column, ...issue}] : []
  })
}

export function buildRowsWithConflicts(
  fileParseResult: ParseResult | null,
  existingProductsBySlug: Map<string, string>,
  validCategorySlugs: Set<string>,
): ParsedRow[] | undefined {
  if (!fileParseResult?.ok || !fileParseResult.rows.length) return

  const rows = fileParseResult.rows.map((row) => {
    const raw = {...row.raw}
    const product = {...row.product}
    const errors = [...row.errors]
    const rowId = getProductCsvImportRowId(product)
    const slugFieldPresent = Object.hasOwn(raw, 'slug')

    if (!rowId && slugFieldPresent && !String(raw.slug ?? '').trim()) {
      const nameSlug = slugify(String(product.name ?? ''))
      if (nameSlug) {
        let nextSlug = nameSlug
        const existingProductId = existingProductsBySlug.get(nameSlug)
        if (existingProductId && existingProductId !== rowId) {
          const categorySlug = slugify(String(product.categorySlug ?? ''))
          if (categorySlug) {
            nextSlug = slugify(`${nameSlug}-${categorySlug}`)
            const categorySlugOwner = existingProductsBySlug.get(nextSlug)
            if (categorySlugOwner && categorySlugOwner !== rowId) {
              nextSlug = slugify(
                `${nameSlug}-${categorySlug}-${new Date().getMinutes()}`,
              )
            }
          }
        }
        raw.slug = nextSlug
        product.slug = nextSlug
      }
    }

    const catSlug = product.categorySlug as string | undefined
    if (
      catSlug != null &&
      catSlug.trim() !== '' &&
      !validCategorySlugs.has(catSlug.trim())
    ) {
      errors.push(`Category "${catSlug}" not found`)
    }

    return {
      ...row,
      raw,
      product,
      errors,
      conflict: row.conflict as ParsedRow['conflict'],
    }
  })

  applySlugConflicts(rows, existingProductsBySlug)
  return rows
}

export function mapImportRowErrors(
  errors: ImportRowError[],
  validRows: ParsedRow[],
): ImportRowError[] {
  return errors.map((error) => ({
    ...error,
    rowIndex: validRows[error.rowIndex]?.rowIndex ?? error.rowIndex + 1,
  }))
}
