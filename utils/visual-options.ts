export const DEFAULT_VISUAL_OPTION = 'Color'

type VariantOption = {
  name: string
  value: string
}

type VariantLike = {
  selectedOptions?: VariantOption[]
} & Record<string, unknown>

type CombinationLike = VariantLike & {
  color?: unknown
}

function isObjectRecord(
  value: unknown,
): value is Record<string, unknown> & {selectedOptions?: unknown} {
  return typeof value === 'object' && value !== null
}

function isVariantOption(value: unknown): value is VariantOption {
  return (
    isObjectRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.value === 'string'
  )
}

export function getVisualOptionName(override?: string): string {
  return override || DEFAULT_VISUAL_OPTION
}

export function removeVisualOptionFromSlug(
  slug: string,
  optionName = DEFAULT_VISUAL_OPTION,
): string {
  const pattern = new RegExp(`-${optionName.toLowerCase()}_[^_]+`, 'i')
  return slug.replace(pattern, '')
}

export function getVisualOptionFromSlug(
  slug: string,
  optionName = DEFAULT_VISUAL_OPTION,
): string | null {
  const pattern = new RegExp(`-${optionName.toLowerCase()}_([^_]+)`, 'i')
  const m = slug.match(pattern)
  return m ? decodeURIComponent(m[1]).toLowerCase() : null
}

export function createVisualOptionSlug(
  baseSlug: string,
  value?: string,
  optionName = DEFAULT_VISUAL_OPTION,
): string {
  const clean = removeVisualOptionFromSlug(baseSlug, optionName)
  return value
    ? `${clean}-${optionName.toLowerCase()}_${encodeURIComponent(value)}`
    : clean
}

function slugifyOptionName(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function slugifyOptionValue(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export function createOptionNameMapping(
  options: Record<string, string>,
): Record<string, string> {
  const mapping: Record<string, string> = {}
  Object.keys(options).forEach((key) => {
    const slugified = slugifyOptionName(key)
    mapping[slugified] = key
  })
  return mapping
}

export function removeMultiOptionFromSlug(slug: string): string {
  const doubleDashIndex = slug.indexOf('--')
  return doubleDashIndex !== -1 ? slug.substring(0, doubleDashIndex) : slug
}

export function getMultiOptionFromSlug(slug: string): Record<string, string> {
  const options: Record<string, string> = {}

  const parts = slug.split('--')
  if (parts.length < 2) return options

  const optionsString = parts[1]

  const pattern = /([a-z0-9]+)_([a-z0-9]+)/g
  let match

  while ((match = pattern.exec(optionsString)) !== null) {
    const optionName = match[1]
    const optionValue = match[2]
    options[optionName] = optionValue
  }

  return options
}

export function createMultiOptionSlug(
  baseSlug: string,
  options: Record<string, string>,
): string {
  const clean = removeMultiOptionFromSlug(baseSlug)
  const optionParts = Object.entries(options)
    .filter(([, value]) => value)
    .map(
      ([key, value]) =>
        `${slugifyOptionName(key)}_${slugifyOptionValue(value)}`,
    )
    .sort()
    .join('-')

  return optionParts ? `${clean}--${optionParts}` : clean
}

export function getVisualOptionValueFromCombination(
  combination: CombinationLike | null | undefined,
  optionName = DEFAULT_VISUAL_OPTION,
): string | undefined {
  if (!isObjectRecord(combination)) {
    return undefined
  }

  if (
    optionName.toLowerCase() === 'color' &&
    typeof combination.color === 'string'
  ) {
    return combination.color
  }

  const lowerOptionName = optionName.toLowerCase()

  const directMatch = Object.entries(combination).find(
    ([key, value]) =>
      key.toLowerCase() === lowerOptionName && typeof value === 'string',
  )
  if (directMatch) {
    return directMatch[1] as string
  }

  if (Array.isArray(combination.selectedOptions)) {
    const option = combination.selectedOptions.find(
      (opt) =>
        isVariantOption(opt) && opt.name.toLowerCase() === lowerOptionName,
    )
    if (option) {
      return option.value
    }
  }

  return undefined
}

export function getAllOptionValuesFromCombination(
  combination: CombinationLike | null | undefined,
): Record<string, string> {
  const options: Record<string, string> = {}

  if (
    isObjectRecord(combination) &&
    combination.selectedOptions &&
    Array.isArray(combination.selectedOptions)
  ) {
    combination.selectedOptions.forEach((option) => {
      if (isVariantOption(option)) {
        options[option.name.toLowerCase()] = option.value.toLowerCase()
      }
    })
    return options
  }

  if (isObjectRecord(combination)) {
    const excludedKeys = [
      'id',
      'availableForSale',
      'price',
      'title',
      'quantityAvailable',
      'selectedOptions',
    ]
    Object.entries(combination).forEach(([key, value]) => {
      if (
        !excludedKeys.includes(key) &&
        value !== undefined &&
        value !== null &&
        typeof value !== 'object'
      ) {
        options[key.toLowerCase()] = String(value).toLowerCase()
      }
    })
  }

  return options
}

export function getOriginalOptionValue(
  variants: VariantLike[],
  slugifiedOptionName: string,
  slugifiedOptionValue: string,
): string | null {
  for (const variant of variants) {
    if (!Array.isArray(variant.selectedOptions)) continue

    for (const option of variant.selectedOptions) {
      if (!isVariantOption(option)) continue
      const optionNameSlug = slugifyOptionName(option.name)
      const optionValueSlug = slugifyOptionValue(option.value)

      if (
        optionNameSlug === slugifiedOptionName &&
        optionValueSlug === slugifiedOptionValue
      ) {
        return option.value
      }
    }
  }

  return null
}

export function filterImagesByVisualOption<T extends {url: string}>(
  images: T[],
  value: string | null,
  optionName = DEFAULT_VISUAL_OPTION,
): T[] {
  if (!value) return images
  const slugNeedle = `-${optionName.toLowerCase()}_${encodeURIComponent(
    value,
  ).toLowerCase()}`
  const matches = images.filter((img) =>
    img.url.toLowerCase().includes(slugNeedle),
  )
  return matches.length > 0 ? matches : images
}

export function getImagesForCarousel<T extends {url: string}>(
  images: T[],
  value: string | null,
  optionName = DEFAULT_VISUAL_OPTION,
): {images: T[]; activeIndex: number} {
  if (!value || images.length <= 1) {
    return {images, activeIndex: 0}
  }

  const needle = `-${optionName.toLowerCase()}_${encodeURIComponent(
    value,
  ).toLowerCase()}`
  const matchingImages = images.filter((img) =>
    img.url.toLowerCase().includes(needle),
  )

  if (matchingImages.length > 0) {
    const firstMatch = matchingImages[0]
    const activeIndex = images.findIndex((img) => img === firstMatch)
    return {images, activeIndex: Math.max(0, activeIndex)}
  }

  return {images, activeIndex: 0}
}

export function getCombinationByVisualOption(
  variants: VariantLike[],
  visualValue: string | null,
  optionName = DEFAULT_VISUAL_OPTION,
): VariantLike | undefined {
  if (!visualValue || variants.length <= 1) {
    return variants.find(Boolean)
  }

  return variants.find((variant) =>
    Array.isArray(variant.selectedOptions) &&
    variant.selectedOptions.some(
      (option) =>
        isVariantOption(option) &&
        option.name.toLowerCase() === optionName.toLowerCase() &&
        option.value.toLowerCase() === visualValue.toLowerCase(),
    ),
  )
}

export function getCombinationByMultiOption(
  variants: VariantLike[],
  slugOptions: Record<string, string>,
): VariantLike | undefined {
  if (Object.keys(slugOptions).length === 0 || variants.length <= 1) {
    return variants.find(Boolean)
  }

  return variants.find((variant) => {
    if (!variant.selectedOptions) return false

    return Object.entries(slugOptions).every(
      ([slugOptionName, slugOptionValue]) =>
        variant.selectedOptions?.some((option) => {
          if (!isVariantOption(option)) return false
          const optionNameSlug = slugifyOptionName(option.name)
          const optionValueSlug = slugifyOptionValue(option.value)

          return (
            optionNameSlug === slugOptionName &&
            optionValueSlug === slugOptionValue
          )
        }),
    )
  })
}

export function hasValidVisualOption(
  variants: VariantLike[],
  visualValue: string | null,
  optionName = DEFAULT_VISUAL_OPTION,
): boolean {
  if (!visualValue) return true

  return variants.some((variant) =>
    Array.isArray(variant.selectedOptions) &&
    variant.selectedOptions.some(
      (option) =>
        isVariantOption(option) &&
        option.name.toLowerCase() === optionName.toLowerCase() &&
        option.value.toLowerCase() === visualValue.toLowerCase(),
    ),
  )
}

export function hasValidMultiOption(
  variants: VariantLike[],
  slugOptions: Record<string, string>,
): boolean {
  if (Object.keys(slugOptions).length === 0) return true

  return variants.some((variant) => {
    if (!variant.selectedOptions) return false

    return Object.entries(slugOptions).every(
      ([slugOptionName, slugOptionValue]) =>
        variant.selectedOptions?.some((option) => {
          if (!isVariantOption(option)) return false
          const optionNameSlug = slugifyOptionName(option.name)
          const optionValueSlug = slugifyOptionValue(option.value)

          return (
            optionNameSlug === slugOptionName &&
            optionValueSlug === slugOptionValue
          )
        }),
    )
  })
}
