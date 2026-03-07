/**
 * CSV import for products: parse export-format CSV and validate rows.
 * Matches the export format from products-data.tsx (PRODUCT_CSV_FIELDS + denom columns).
 * _id and _creationTime are accepted in the CSV (from export) but omitted on insert; Convex creates them.
 */

const DENOM_KEYS = [
  '0.125',
  '0.25',
  '0.5',
  '1',
  '2',
  '3',
  '3.5',
  '4',
  '5',
  '6',
  '7',
  '8',
]

const PRODUCT_CSV_FIELDS = [
  '_id',
  '_creationTime',
  'name',
  'slug',
  'base',
  'categoryId',
  'categorySlug',
  'shortDescription',
  'description',
  'priceCents',
  'unit',
  'availableDenominations',
  'popularDenomination',
  'thcPercentage',
  'cbdPercentage',
  'effects',
  'terpenes',
  'limited',
  'featured',
  'available',
  'stock',
  'stockByDenomination',
  'priceByDenomination',
  'rating',
  'image',
  'gallery',
  'consumption',
  'flavorNotes',
  'potencyLevel',
  'potencyProfile',
  'weightGrams',
  'brand',
  'lineage',
  'noseRating',
  'variants',
  'tier',
  'eligibleForRewards',
  'eligibleForDeals',
  'onSale',
  'eligibleDenominationForDeals',
  'eligibleForUpgrade',
  'upgradePrice',
  'dealType',
  'productType',
  'netWeight',
  'netWeightUnit',
  'subcategory',
  'batchId',
  'archived',
] as const

const DENOM_HEADERS = DENOM_KEYS.flatMap((k) => [`price_${k}`, `stock_${k}`])
export const EXPECTED_CSV_HEADERS = [...PRODUCT_CSV_FIELDS, ...DENOM_HEADERS]

/** CSV columns that are not sent on insert (created by Convex). Shown in export but omitted in preview/import. */
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
  for (const k of DENOM_KEYS) {
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

  return {
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
    stock: parseNum(get('stock')),
    stockByDenomination:
      Object.keys(stockByDenomination).length > 0
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
    netWeight: parseNum(get('netWeight')),
    netWeightUnit: get('netWeightUnit') || undefined,
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
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0)
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

/** Client-side row validation (required fields, types). Does not check category existence or slug conflict. */
function validateRow(
  product: Record<string, unknown>,
  rowIndex: number,
  raw: Record<string, string>,
): string[] {
  const errors: string[] = []
  const name = product.name
  if (name == null || String(name).trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters')
  }
  const categorySlug = product.categorySlug
  if (categorySlug == null || String(categorySlug).trim() === '') {
    errors.push('Category (categorySlug) is required')
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
  existingSlugs: Set<string>,
): void {
  const slugify = (value: string): string =>
    value
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

  for (const row of rows) {
    const name = row.product.name
    const slugRaw = (row.product.slug as string) ?? ''
    const slug = slugRaw ? slugify(slugRaw) : slugify(String(name ?? ''))
    if (slug && existingSlugs.has(slug)) {
      row.conflict = 'slug'
      if (!row.errors.includes(`Slug "${slug}" already exists`)) {
        row.errors.push(`Slug "${slug}" already exists`)
      }
    }
  }
}

/** Default import title from current timestamp. */
export function defaultImportTitle(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}
