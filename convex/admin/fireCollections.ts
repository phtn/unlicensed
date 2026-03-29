import {slugify} from '../../lib/slug'
import type {FireCollectionEntry} from './d'

const DEFAULT_FIRE_COLLECTION_TITLE = 'Fire Collection'

export function normalizeFireCollectionProductIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  )
}

function normalizeFireCollectionEntry(
  value: unknown,
  index: number,
): FireCollectionEntry {
  const collection =
    value && typeof value === 'object'
      ? (value as Partial<FireCollectionEntry>)
      : {}

  const fallbackId = `fire-collection-${index + 1}`
  const rawTitle =
    typeof collection.title === 'string' && collection.title.trim()
      ? collection.title.trim()
      : index === 0
        ? DEFAULT_FIRE_COLLECTION_TITLE
        : `Collection ${index + 1}`

  const rawId =
    typeof collection.id === 'string' && collection.id.trim()
      ? collection.id.trim()
      : fallbackId

  return {
    id: slugify(rawId) || fallbackId,
    title: rawTitle,
    enabled: collection.enabled !== false,
    order:
      typeof collection.order === 'number' && Number.isFinite(collection.order)
        ? collection.order
        : index,
    productIds: normalizeFireCollectionProductIds(collection.productIds),
    sourceCategorySlug:
      typeof collection.sourceCategorySlug === 'string' &&
      collection.sourceCategorySlug.trim()
        ? collection.sourceCategorySlug.trim()
        : undefined,
  }
}

export function normalizeFireCollectionsValue(
  value: unknown,
): FireCollectionEntry[] {
  if (
    value &&
    typeof value === 'object' &&
    'collections' in value &&
    Array.isArray(value.collections)
  ) {
    return value.collections
      .map((entry, index) => normalizeFireCollectionEntry(entry, index))
      .sort((a, b) => a.order - b.order)
      .map((entry, index) => ({...entry, order: index}))
  }

  if (
    value &&
    typeof value === 'object' &&
    'productIds' in value &&
    Array.isArray(value.productIds)
  ) {
    return [
      {
        id: 'fire-collection',
        title: DEFAULT_FIRE_COLLECTION_TITLE,
        enabled: true,
        order: 0,
        productIds: normalizeFireCollectionProductIds(value.productIds),
        sourceCategorySlug: undefined,
      },
    ]
  }

  return []
}
