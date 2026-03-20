/**
 * CSV import for products: parse export-format CSV and validate rows.
 * Matches the export format from products-data.tsx (PRODUCT_CSV_FIELDS + denom columns).
 * _id and _creationTime are accepted in the CSV (from export).
 * When _id is present, the import replaces that product; _creationTime is ignored.
 */
import {getProductCsvImportRowId} from '@/lib/product-csv-import'
import {slugify} from '@/lib/slug'
import {CSV_DENOM_KEYS, DENOM_HEADERS, EXPECTED_CSV_HEADERS} from './constants'

export {CSV_DENOM_KEYS, EXPECTED_CSV_HEADERS}

const VALID_INVENTORY_MODES = new Set([
  'by_denomination',
  'shared',
  'shared_weight',
])
const VALID_PACKAGING_MODES = new Set(['bulk', 'prepack'])

/** CSV columns hidden from preview. They are still parsed from the CSV. */
export const OMIT_FROM_IMPORT_HEADERS = new Set(['_id', '_creationTime'])

/** Parse a single CSV line respecting quoted fields (handles "" as escape). */
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      let value = ''
      i++
      while (i < line.length) {
        if (line[i] === '"') {
          if (line[i + 1] === '"') {
            value += '"'
            i += 2
          } else {
            i++
            break
          }
        } else {
          value += line[i]
          i++
        }
      }
      result.push(value)
      if (line[i] === ',') i++
    } else {
      let value = ''
      while (i < line.length && line[i] !== ',') {
        value += line[i]
        i++
      }
      result.push(value.trim())
      if (line[i] === ',') i++
    }
  }
  return result
}

/** Split CSV text into logical rows while preserving embedded newlines inside quoted cells. */
function parseCsvRows(csvText: string): string[] {
  const normalizedText =
    csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText
  const rows: string[] = []
  let currentRow = ''
  let inQuotes = false

  for (let index = 0; index < normalizedText.length; index++) {
    const char = normalizedText[index]

    if (char === '"') {
      if (inQuotes && normalizedText[index + 1] === '"') {
        currentRow += '""'
        index++
        continue
      }

      inQuotes = !inQuotes
      currentRow += char
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentRow.trim().length > 0) {
        rows.push(currentRow)
      }
      currentRow = ''

      if (char === '\r' && normalizedText[index + 1] === '\n') {
        index++
      }
      continue
    }

    currentRow += char
  }

  if (currentRow.trim().length > 0) {
    rows.push(currentRow)
  }

  return rows
}

function parseBool(v: string): boolean | undefined {
  const s = (v ?? '').toLowerCase().trim()
  if (s === 'true' || s === '1') return true
  if (s === 'false' || s === '0' || s === '') return false
  return undefined
}

function parseNum(v: string): number | undefined {
  if (v === '' || v == null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function normalizeInventoryMode(
  value: string,
): 'by_denomination' | 'shared' | undefined {
  const normalizedValue = value.trim().toLowerCase()
  if (normalizedValue === 'by_denomination') return 'by_denomination'
  if (normalizedValue === 'shared' || normalizedValue === 'shared_weight') {
    return 'shared'
  }
  return undefined
}

function parseJsonArrayOrRecord(value: string): unknown {
  if (!value || value.trim() === '') return undefined
  try {
    const parsed = JSON.parse(value) as unknown
    if (
      Array.isArray(parsed) ||
      (parsed !== null && typeof parsed === 'object')
    )
      return parsed
    return undefined
  } catch {
    return undefined
  }
}

/** Map a raw CSV row (record of string values) to a product-like object for Convex. */
function rawRowToProduct(
  raw: Record<string, string>,
  denomHeaders: string[],
): Record<string, unknown> {
  const priceByDenomination: Record<string, number> = {}
  const stockByDenomination: Record<string, number> = {}
  for (const k of CSV_DENOM_KEYS) {
    const priceKey = `price_${k}`
    const stockKey = `stock_${k}`
    if (denomHeaders.includes(priceKey)) {
      const p = parseNum(raw[priceKey])
      if (p !== undefined) priceByDenomination[k] = p
    }
    if (denomHeaders.includes(stockKey)) {
      const s = parseNum(raw[stockKey])
      if (s !== undefined) stockByDenomination[k] = s
    }
  }

  const get = (key: string): string => raw[key] ?? ''
  const inventoryMode = (() => {
    const rawValue = get('inventoryMode').trim()
    if (!VALID_INVENTORY_MODES.has(rawValue)) {
      return normalizeInventoryMode(rawValue)
    }
    return normalizeInventoryMode(rawValue)
  })()
  const packagingMode = (() => {
    const rawValue = get('packagingMode').trim()
    return VALID_PACKAGING_MODES.has(rawValue) ? rawValue : undefined
  })()

  const availableDenoms = parseJsonArrayOrRecord(
    get('availableDenominations'),
  ) as number[] | undefined
  const popularDenom = parseJsonArrayOrRecord(get('popularDenomination')) as
    | number[]
    | undefined
  const effects = parseJsonArrayOrRecord(get('effects')) as string[] | undefined
  const terpenes = parseJsonArrayOrRecord(get('terpenes')) as
    | string[]
    | undefined
  const flavorNotes = parseJsonArrayOrRecord(get('flavorNotes')) as
    | string[]
    | undefined
  const gallery = parseJsonArrayOrRecord(get('gallery')) as
    | (string | unknown)[]
    | undefined
  const variants = parseJsonArrayOrRecord(get('variants')) as
    | Array<{label: string; price: number}>
    | undefined
  const eligibleDenomDeals = parseJsonArrayOrRecord(
    get('eligibleDenominationForDeals'),
  ) as number[] | undefined
  const parsedBrand = parseJsonArrayOrRecord(get('brand')) as
    | string[]
    | undefined
  const parsedHighMargins = parseJsonArrayOrRecord(get('highMargins')) as
    | string[]
    | undefined
  const parsedBrandCollaborators = parseJsonArrayOrRecord(
    get('brandCollaborators'),
  ) as string[] | undefined
  const parsedTags = parseJsonArrayOrRecord(get('tags')) as string[] | undefined

  return {
    _id: get('_id') || undefined,
    name: get('name') || undefined,
    slug: get('slug') || undefined,
    base: get('base') || undefined,
    categorySlug: get('categorySlug') || undefined,
    shortDescription: get('shortDescription') || undefined,
    description: get('description') || undefined,
    priceCents: parseNum(get('priceCents')),
    unit: get('unit') || undefined,
    availableDenominations: Array.isArray(availableDenoms)
      ? availableDenoms
      : undefined,
    popularDenomination: Array.isArray(popularDenom) ? popularDenom : undefined,
    thcPercentage: parseNum(get('thcPercentage')),
    cbdPercentage: parseNum(get('cbdPercentage')),
    effects: Array.isArray(effects) ? effects : undefined,
    terpenes: Array.isArray(terpenes) ? terpenes : undefined,
    limited: parseBool(get('limited')),
    featured: parseBool(get('featured')),
    available: parseBool(get('available')),
    stock: inventoryMode === 'shared' ? undefined : parseNum(get('stock')),
    inventoryMode,
    masterStockQuantity: parseNum(get('masterStockQuantity')),
    masterStockUnit: get('masterStockUnit') || undefined,
    stockByDenomination:
      inventoryMode === 'shared'
        ? undefined
        : Object.keys(stockByDenomination).length > 0
          ? stockByDenomination
          : undefined,
    priceByDenomination:
      Object.keys(priceByDenomination).length > 0
        ? priceByDenomination
        : undefined,
    rating: parseNum(get('rating')),
    image: get('image') || undefined,
    gallery: Array.isArray(gallery) ? gallery : undefined,
    consumption: get('consumption') || undefined,
    flavorNotes: Array.isArray(flavorNotes) ? flavorNotes : undefined,
    potencyLevel: (() => {
      const plRaw = get('potencyLevel').trim()
      const plLower = plRaw.toLowerCase()
      return plLower === 'mild' || plLower === 'medium' || plLower === 'high'
        ? (plLower as 'mild' | 'medium' | 'high')
        : undefined
    })(),
    potencyProfile: get('potencyProfile') || undefined,
    weightGrams: parseNum(get('weightGrams')),
    brand: Array.isArray(parsedBrand)
      ? parsedBrand
      : get('brand')
        ? [get('brand')]
        : undefined,
    lineage: get('lineage') || undefined,
    noseRating: parseNum(get('noseRating')),
    variants: Array.isArray(variants) ? variants : undefined,
    tier: get('tier') || undefined,
    eligibleForRewards: parseBool(get('eligibleForRewards')),
    eligibleForDeals: parseBool(get('eligibleForDeals')),
    onSale: parseBool(get('onSale')),
    eligibleDenominationForDeals: Array.isArray(eligibleDenomDeals)
      ? eligibleDenomDeals
      : undefined,
    eligibleForUpgrade: parseBool(get('eligibleForUpgrade')),
    upgradePrice: parseNum(get('upgradePrice')),
    dealType: (() => {
      const raw = get('dealType').trim().toLowerCase()
      return raw === 'withintier' || raw === 'acrosstiers'
        ? raw === 'withintier'
          ? ('withinTier' as const)
          : ('acrossTiers' as const)
        : undefined
    })(),
    productType: get('productType') || undefined,
    strainType: get('strainType') || undefined,
    netWeight: parseNum(get('netWeight')),
    netWeightUnit: get('netWeightUnit') || undefined,
    highMargins: Array.isArray(parsedHighMargins)
      ? parsedHighMargins
      : undefined,
    brandCollaborators: Array.isArray(parsedBrandCollaborators)
      ? parsedBrandCollaborators
      : undefined,
    tags: Array.isArray(parsedTags) ? parsedTags : undefined,
    packagingMode,
    stockUnit: get('stockUnit') || undefined,
    packSize: parseNum(get('packSize')),
    startingWeight: parseNum(get('startingWeight')),
    remainingWeight: parseNum(get('remainingWeight')),
    subcategory: get('subcategory') || undefined,
    batchId: get('batchId') || undefined,
    archived: parseBool(get('archived')),
  }
}

export interface ParsedRow {
  rowIndex: number
  raw: Record<string, string>
  product: Record<string, unknown>
  errors: string[]
  conflict: 'slug' | null
}

export interface ParseResult {
  ok: boolean
  headers: string[]
  rows: ParsedRow[]
  fileError?: string
}

/** Parse CSV text into rows and map to product shape. Does not run full validation (category/slug conflict). */
export function parseProductsCsv(csvText: string): ParseResult {
  const lines = parseCsvRows(csvText)
  if (lines.length === 0) {
    return {ok: false, headers: [], rows: [], fileError: 'File is empty'}
  }

  const headers = parseCsvLine(lines[0])
  const denomHeaders = DENOM_HEADERS.filter((h) => headers.includes(h))
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const raw: Record<string, string> = {}
    headers.forEach((h, j) => {
      raw[h] = values[j] ?? ''
    })
    const product = rawRowToProduct(raw, denomHeaders)
    const errors = validateRow(product, i, raw)
    rows.push({
      rowIndex: i,
      raw,
      product,
      errors,
      conflict: null,
    })
  }

  return {
    ok: true,
    headers,
    rows,
  }
}

const VALID_DEAL_TYPES_LOWER = new Set(['withintier', 'acrosstiers'])
const VALID_INVENTORY_MODES_LOWER = new Set([
  'by_denomination',
  'shared',
  'shared_weight',
])
const VALID_PACKAGING_MODES_LOWER = new Set(['bulk', 'prepack'])
const NUMERIC_CSV_FIELDS = new Set([
  'priceCents',
  'thcPercentage',
  'cbdPercentage',
  'stock',
  'masterStockQuantity',
  'rating',
  'weightGrams',
  'noseRating',
  'upgradePrice',
  'netWeight',
  'packSize',
  'startingWeight',
  'remainingWeight',
  ...DENOM_HEADERS,
])
const ARRAY_CSV_FIELDS = [
  'availableDenominations',
  'popularDenomination',
  'effects',
  'terpenes',
  'gallery',
  'flavorNotes',
  'variants',
  'eligibleDenominationForDeals',
  'highMargins',
  'brandCollaborators',
  'tags',
] as const

function hasTypedValue(value: string | undefined): boolean {
  return (value ?? '').trim() !== ''
}

function isJsonArrayValue(value: string | undefined): boolean {
  const parsed = parseJsonArrayOrRecord(value ?? '')
  return Array.isArray(parsed)
}

/** Client-side row validation (required fields, types). Does not check category existence or slug conflict. */
function validateRow(
  product: Record<string, unknown>,
  rowIndex: number,
  raw: Record<string, string>,
): string[] {
  const errors: string[] = []
  const hasDenominationStockInput = (() => {
    const parsedStockByDenomination = parseJsonArrayOrRecord(
      raw.stockByDenomination ?? '',
    )

    if (
      parsedStockByDenomination != null &&
      typeof parsedStockByDenomination === 'object' &&
      !Array.isArray(parsedStockByDenomination)
    ) {
      return Object.keys(parsedStockByDenomination).length > 0
    }

    return Object.entries(raw).some(([key, value]) => {
      if (!key.startsWith('stock_')) return false
      return parseNum(value) !== undefined
    })
  })()
  const name = product.name
  if (name == null || String(name).trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters')
  }
  const categorySlug = product.categorySlug
  if (categorySlug == null || String(categorySlug).trim() === '') {
    errors.push('Category (categorySlug) is required')
  }
  for (const field of NUMERIC_CSV_FIELDS) {
    if (!hasTypedValue(raw[field])) continue
    if (parseNum(raw[field]) === undefined) {
      errors.push(`${field} must be a number`)
    }
  }
  for (const field of ARRAY_CSV_FIELDS) {
    if (!hasTypedValue(raw[field])) continue
    if (!isJsonArrayValue(raw[field])) {
      errors.push(`${field} must be a JSON array`)
    }
  }
  const priceCents = product.priceCents
  if (
    priceCents != null &&
    (typeof priceCents !== 'number' || priceCents < 0)
  ) {
    errors.push('priceCents must be a non-negative number')
  }
  if (
    product.rating != null &&
    (typeof product.rating !== 'number' ||
      product.rating < 0 ||
      product.rating > 5)
  ) {
    errors.push('rating must be between 0 and 5')
  }
  if (
    product.noseRating != null &&
    (typeof product.noseRating !== 'number' ||
      product.noseRating < 0 ||
      product.noseRating > 10)
  ) {
    errors.push('noseRating must be between 0 and 10')
  }
  const inventoryModeRaw = (raw.inventoryMode ?? '').trim()
  if (
    inventoryModeRaw !== '' &&
    !VALID_INVENTORY_MODES_LOWER.has(inventoryModeRaw.toLowerCase())
  ) {
    errors.push('inventoryMode must be by_denomination or shared')
  }
  // Exported rows can still carry per-denomination stock while marked shared.
  // Treat that as valid import input instead of forcing master stock fields.
  if (product.inventoryMode === 'shared' && !hasDenominationStockInput) {
    if (
      typeof product.masterStockQuantity !== 'number' ||
      product.masterStockQuantity < 0
    ) {
      errors.push(
        'masterStockQuantity is required and must be a non-negative number when inventoryMode is shared',
      )
    }
    if (
      product.masterStockUnit == null ||
      String(product.masterStockUnit).trim() === ''
    ) {
      errors.push('masterStockUnit is required when inventoryMode is shared')
    }
  }
  const packagingModeRaw = (raw.packagingMode ?? '').trim()
  if (
    packagingModeRaw !== '' &&
    !VALID_PACKAGING_MODES_LOWER.has(packagingModeRaw.toLowerCase())
  ) {
    errors.push('packagingMode must be bulk or prepack')
  }
  const dealTypeRaw = (raw.dealType ?? '').trim()
  if (
    dealTypeRaw !== '' &&
    !VALID_DEAL_TYPES_LOWER.has(dealTypeRaw.toLowerCase())
  ) {
    errors.push('dealType must be withinTier or acrossTiers')
  }
  return errors
}

/** Apply slug conflict from existing slugs set. Mutates rows in place. */
export function applySlugConflicts(
  rows: ParsedRow[],
  existingProductsBySlug: Map<string, string>,
): void {
  const addSlugConflict = (row: ParsedRow, slug: string) => {
    row.conflict = 'slug'
    if (!row.errors.includes(`Slug "${slug}" already exists`)) {
      row.errors.push(`Slug "${slug}" already exists`)
    }
  }

  const getRowSlug = (row: ParsedRow) => {
    const name = row.product.name
    const hasSlugField = Object.hasOwn(row.raw, 'slug')
    const slugRaw = (row.product.slug as string) ?? ''

    return slugRaw || hasSlugField
      ? slugify(slugRaw || String(name ?? ''))
      : ''
  }

  const preferredOwnersBySlug = new Map<
    string,
    {rowId?: string; rowIndex: number}
  >()

  const sortedRows = [...rows].sort((a, b) => {
    const aIsReplacement = getProductCsvImportRowId(a.product) != null
    const bIsReplacement = getProductCsvImportRowId(b.product) != null

    if (aIsReplacement !== bIsReplacement) {
      return aIsReplacement ? -1 : 1
    }

    return a.rowIndex - b.rowIndex
  })

  for (const row of sortedRows) {
    const slug = getRowSlug(row)
    if (!slug || preferredOwnersBySlug.has(slug)) {
      continue
    }

    preferredOwnersBySlug.set(slug, {
      rowId: getProductCsvImportRowId(row.product),
      rowIndex: row.rowIndex,
    })
  }

  for (const row of rows) {
    const rowId = getProductCsvImportRowId(row.product)
    const slug = getRowSlug(row)
    const preferredOwner = slug ? preferredOwnersBySlug.get(slug) : undefined
    const ownsSlugInImport =
      preferredOwner != null &&
      (preferredOwner.rowId != null
        ? preferredOwner.rowId === rowId
        : preferredOwner.rowIndex === row.rowIndex)

    if (slug && preferredOwner && !ownsSlugInImport) {
      addSlugConflict(row, slug)
      continue
    }

    const existingProductId = slug ? existingProductsBySlug.get(slug) : null
    if (existingProductId && existingProductId !== rowId) {
      addSlugConflict(row, slug)
      continue
    }

    row.conflict = null
  }
}

/** Default import title from current timestamp. */
export function defaultImportTitle(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}
