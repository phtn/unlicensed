import {slugify} from './slug'

type AttributeEntryLike = {
  name?: string | null
  slug?: string | null
}

type AttributeInput = string | AttributeEntryLike

type AttributeInputs = readonly AttributeInput[] | null | undefined

type NormalizedAttributeEntry = {
  name: string
  slug: string
}

const trimToUndefined = (value: string | null | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const normalizeAttributeEntry = (
  entry: AttributeInput,
): NormalizedAttributeEntry | null => {
  if (typeof entry === 'string') {
    const name = trimToUndefined(entry)
    if (!name) return null
    const slug = slugify(name)
    return slug ? {name, slug} : null
  }

  if (!entry || typeof entry !== 'object') {
    return null
  }

  const name = trimToUndefined(entry.name)
  if (!name) return null

  const slugSource = trimToUndefined(entry.slug) ?? name
  const slug = slugify(slugSource)
  return slug ? {name, slug} : null
}

export const normalizeAttributeEntries = (
  entries: AttributeInputs,
): NormalizedAttributeEntry[] =>
  (entries ?? []).flatMap((entry) => {
    const normalized = normalizeAttributeEntry(entry)
    return normalized ? [normalized] : []
  })

export const resolveAttributeSlug = (
  value: string | null | undefined,
  entries: AttributeInputs,
): string | undefined => {
  const trimmedValue = trimToUndefined(value)
  if (!trimmedValue) return undefined

  const normalizedEntries = normalizeAttributeEntries(entries)
  if (normalizedEntries.length === 0) {
    return undefined
  }

  const slugValue = slugify(trimmedValue)
  const match = normalizedEntries.find(
    (entry) =>
      entry.slug === trimmedValue ||
      entry.name === trimmedValue ||
      entry.slug === slugValue,
  )

  return match?.slug
}

export const resolveAttributeSlugs = (
  values: readonly string[] | null | undefined,
  entries: AttributeInputs,
): string[] | undefined => {
  if (!values?.length) return undefined

  const normalizedValues = values
    .map((value) => {
      const trimmedValue = trimToUndefined(value)
      if (!trimmedValue) return undefined
      return resolveAttributeSlug(trimmedValue, entries) ?? trimmedValue
    })
    .filter((value): value is string => Boolean(value))

  if (normalizedValues.length === 0) {
    return undefined
  }

  return [...new Set(normalizedValues)]
}

export const normalizeComparableAttributeValue = (
  value: string | null | undefined,
  entries?: AttributeInputs,
): string | undefined => {
  const trimmedValue = trimToUndefined(value)
  if (!trimmedValue) return undefined

  return (
    resolveAttributeSlug(trimmedValue, entries) ??
    slugify(trimmedValue) ??
    trimmedValue
  )
}
