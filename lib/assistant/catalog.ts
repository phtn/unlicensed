type AssistantCatalogAttribute = {
  name: string
  slug: string
}

export type AssistantCatalogCategory = {
  name: string
  slug: string
  href: string
  description?: string
  tiers: AssistantCatalogAttribute[]
  subcategories: AssistantCatalogAttribute[]
  brands: AssistantCatalogAttribute[]
}

export type AssistantCatalogProduct = {
  name: string
  slug: string
  href: string
  categorySlug: string
  categoryName?: string
  brand: string[]
  tier?: string
  tierLabel?: string
  subcategory?: string
  productType?: string
  strainType?: string
  available: boolean
  featured: boolean
}

export type AssistantCatalog = {
  categories: AssistantCatalogCategory[]
  products: AssistantCatalogProduct[]
}

export type AssistantLinkKind = 'category' | 'product'

type AssistantCatalogLinkEntry = {
  kind: AssistantLinkKind
  href: string
  label: string
}

export type AssistantCatalogLinkIndex = {
  entryByLabel: Map<string, AssistantCatalogLinkEntry>
  matcher: RegExp | null
}

export type AssistantTextSegment =
  | {type: 'text'; text: string}
  | {
      type: 'link'
      text: string
      href: string
      kind: AssistantLinkKind
    }

const SEARCH_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'can',
  'do',
  'for',
  'have',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'show',
  'that',
  'the',
  'to',
  'we',
  'what',
  'with',
  'you',
])

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatAttributeNames(
  items: AssistantCatalogAttribute[],
  limit = 6,
): string {
  if (items.length === 0) return 'none'
  const names = items
    .map((item) => item.name.trim())
    .filter((item) => item.length > 0)
    .slice(0, limit)

  if (items.length > limit) {
    names.push(`+${items.length - limit} more`)
  }

  return names.join(', ')
}

function pluralizeLabel(label: string): string {
  if (/s$/i.test(label)) return label
  if (/y$/i.test(label)) return `${label.slice(0, -1)}ies`
  return `${label}s`
}

function buildCategoryAliases(category: AssistantCatalogCategory): string[] {
  const labels = new Set<string>()
  const trimmedName = category.name.trim()

  if (trimmedName) {
    labels.add(trimmedName)
    labels.add(pluralizeLabel(trimmedName))
  }

  const slugLabel = category.slug
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-')

  if (slugLabel) {
    labels.add(slugLabel)
  }

  return Array.from(labels)
}

function addLinkEntry(
  map: Map<string, AssistantCatalogLinkEntry>,
  entry: AssistantCatalogLinkEntry,
) {
  const normalizedLabel = normalizeText(entry.label)
  if (!normalizedLabel) return

  const existing = map.get(normalizedLabel)
  if (
    !existing ||
    entry.label.length > existing.label.length ||
    (entry.kind === 'product' && existing.kind !== 'product')
  ) {
    map.set(normalizedLabel, entry)
  }
}

export function createAssistantCatalogLinkIndex(
  catalog: AssistantCatalog | null | undefined,
): AssistantCatalogLinkIndex | null {
  if (!catalog) return null

  const entryByLabel = new Map<string, AssistantCatalogLinkEntry>()

  for (const category of catalog.categories) {
    for (const label of buildCategoryAliases(category)) {
      addLinkEntry(entryByLabel, {
        kind: 'category',
        href: category.href,
        label,
      })
    }
  }

  for (const product of catalog.products) {
    const label = product.name.trim()
    if (!label) continue

    addLinkEntry(entryByLabel, {
      kind: 'product',
      href: product.href,
      label,
    })
  }

  const labels = Array.from(entryByLabel.values())
    .map((entry) => entry.label)
    .sort((left, right) => right.length - left.length)

  if (labels.length === 0) {
    return {
      entryByLabel,
      matcher: null,
    }
  }

  const pattern = labels
    .map((label) => escapeRegExp(label).replace(/\s+/g, '\\s+'))
    .join('|')

  return {
    entryByLabel,
    matcher: new RegExp(
      `(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`,
      'giu',
    ),
  }
}

export function linkifyAssistantText(
  text: string,
  linkIndex: AssistantCatalogLinkIndex | null | undefined,
): AssistantTextSegment[] {
  if (!text) return [{type: 'text', text}]
  if (!linkIndex?.matcher) return [{type: 'text', text}]

  const matcher = new RegExp(linkIndex.matcher.source, linkIndex.matcher.flags)
  const segments: AssistantTextSegment[] = []
  let lastIndex = 0

  for (const match of text.matchAll(matcher)) {
    const matchedText = match[0]
    const start = match.index ?? 0

    if (start > lastIndex) {
      segments.push({type: 'text', text: text.slice(lastIndex, start)})
    }

    const entry = linkIndex.entryByLabel.get(normalizeText(matchedText))
    if (entry) {
      segments.push({
        type: 'link',
        text: matchedText,
        href: entry.href,
        kind: entry.kind,
      })
    } else {
      segments.push({type: 'text', text: matchedText})
    }

    lastIndex = start + matchedText.length
  }

  if (lastIndex < text.length) {
    segments.push({type: 'text', text: text.slice(lastIndex)})
  }

  return segments.length > 0 ? segments : [{type: 'text', text}]
}

function getSearchTokens(searchText: string): string[] {
  return Array.from(
    new Set(
      (searchText.match(/[\p{L}\p{N}]+/gu) ?? [])
        .map((token) => token.toLowerCase())
        .filter(
          (token) =>
            token.length > 1 && !SEARCH_STOP_WORDS.has(token.toLowerCase()),
        ),
    ),
  )
}

function scoreAgainstTokens(value: string | undefined, tokens: string[]): number {
  const normalizedValue = normalizeText(value ?? '')
  if (!normalizedValue) return 0

  let score = 0
  for (const token of tokens) {
    if (normalizedValue === token) {
      score += 24
      continue
    }

    if (normalizedValue.includes(token)) {
      score += 8
    }
  }

  return score
}

function scoreProduct(
  product: AssistantCatalogProduct,
  normalizedSearch: string,
  tokens: string[],
): number {
  const normalizedName = normalizeText(product.name)
  let score = 0

  if (normalizedSearch) {
    if (normalizedName === normalizedSearch) {
      score += 160
    } else if (
      normalizedName.includes(normalizedSearch) ||
      normalizedSearch.includes(normalizedName)
    ) {
      score += 80
    }
  }

  score += scoreAgainstTokens(product.name, tokens) * 4
  score += scoreAgainstTokens(product.categoryName ?? product.categorySlug, tokens)
  score += scoreAgainstTokens(product.subcategory, tokens)
  score += scoreAgainstTokens(product.productType, tokens)
  score += scoreAgainstTokens(product.strainType, tokens)
  score += scoreAgainstTokens(product.tierLabel ?? product.tier, tokens)

  for (const brand of product.brand) {
    score += scoreAgainstTokens(brand, tokens) * 2
  }

  if (product.available) score += 2
  if (product.featured) score += 1

  return score
}

function isBroadCatalogQuery(searchText: string): boolean {
  return /\b(available|browse|catalog|categories|carry|have|menu|products|selection|sell|stock)\b/i.test(
    searchText,
  )
}

export function buildAssistantCatalogPrompt(
  catalog: AssistantCatalog | null | undefined,
  searchText: string,
): string | null {
  if (!catalog) return null
  if (catalog.categories.length === 0 && catalog.products.length === 0) {
    return null
  }

  const normalizedSearch = normalizeText(searchText)
  const searchTokens = getSearchTokens(searchText)
  const broadCatalogQuery = isBroadCatalogQuery(searchText)
  const countsByCategory = new Map<string, number>()

  for (const product of catalog.products) {
    const currentCount = countsByCategory.get(product.categorySlug) ?? 0
    countsByCategory.set(product.categorySlug, currentCount + 1)
  }

  const scoredProducts = catalog.products
    .map((product) => ({
      product,
      score: scoreProduct(product, normalizedSearch, searchTokens),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score
      if (left.product.featured !== right.product.featured) {
        return left.product.featured ? -1 : 1
      }
      return left.product.name.localeCompare(right.product.name)
    })

  let selectedProducts: AssistantCatalogProduct[] = []

  if (broadCatalogQuery && catalog.products.length <= 120) {
    selectedProducts = [...catalog.products].sort((left, right) =>
      left.name.localeCompare(right.name),
    )
  } else {
    selectedProducts = scoredProducts
      .filter(({score}) => broadCatalogQuery || score > 0)
      .slice(0, broadCatalogQuery ? 40 : 24)
      .map(({product}) => product)

    if (selectedProducts.length === 0 && broadCatalogQuery) {
      selectedProducts = scoredProducts.slice(0, 24).map(({product}) => product)
    }
  }

  const categoryLines = catalog.categories.map((category) => {
    const productCount = countsByCategory.get(category.slug) ?? 0

    return `- ${category.name} | href=${category.href} | products=${productCount} | tiers=${formatAttributeNames(category.tiers)} | subcategories=${formatAttributeNames(category.subcategories)} | brands=${formatAttributeNames(category.brands)}`
  })

  const productLines = selectedProducts.map((product) => {
    const details = [
      `href=${product.href}`,
      `category=${product.categoryName ?? product.categorySlug}`,
    ]

    if (product.brand.length > 0) {
      details.push(`brands=${product.brand.join(', ')}`)
    }
    if (product.tierLabel ?? product.tier) {
      details.push(`tier=${product.tierLabel ?? product.tier}`)
    }
    if (product.subcategory) {
      details.push(`subcategory=${product.subcategory}`)
    }
    if (product.productType) {
      details.push(`type=${product.productType}`)
    }
    details.push(`available=${product.available ? 'yes' : 'no'}`)

    return `- ${product.name} | ${details.join(' | ')}`
  })

  const sections = [
    '## Runtime Catalog Context',
    'Use this live catalog snapshot as the source of truth for product discovery and internal links.',
    'When you mention a category or product from this list, prefer a markdown link using the exact href.',
    '',
    '### Categories',
    ...categoryLines,
  ]

  if (productLines.length > 0) {
    sections.push('', '### Relevant Products', ...productLines)
  }

  return sections.join('\n')
}
