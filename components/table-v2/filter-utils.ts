import type {Column} from '@tanstack/react-table'

const FILTER_OBJECT_LABEL_KEYS = [
  'label',
  'name',
  'title',
  'slug',
  'id',
  '_id',
  'value',
] as const

const stableStringify = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value !== 'object') return String(value)

  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => stableStringify(item)))
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => a.localeCompare(b),
  )

  return JSON.stringify(
    Object.fromEntries(
      entries.map(([key, entryValue]) => [key, stableStringify(entryValue)]),
    ),
  )
}

const getObjectCandidate = (value: Record<string, unknown>): string | null => {
  for (const key of FILTER_OBJECT_LABEL_KEYS) {
    const candidate = value[key]
    if (
      typeof candidate === 'string' &&
      candidate.trim().length > 0
    ) {
      return candidate.trim()
    }
    if (typeof candidate === 'number' || typeof candidate === 'boolean') {
      return String(candidate)
    }
  }

  return null
}

export const getFilterValueToken = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value.map((item) => getFilterValueToken(item)).join(' | ')
  }
  if (typeof value === 'object') {
    return getObjectCandidate(value as Record<string, unknown>) ?? stableStringify(value)
  }
  return String(value)
}

export const getFilterValueLabel = (value: unknown): string => {
  if (typeof value === 'boolean') {
    return value ? 'Active' : 'Inactive'
  }
  if (value === null || value === undefined) {
    return 'Empty'
  }
  if (typeof value === 'string') {
    return value.trim().length > 0 ? value : 'Empty'
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Empty'
    return value.map((item) => getFilterValueLabel(item)).join(', ')
  }
  if (typeof value === 'object') {
    return (
      getObjectCandidate(value as Record<string, unknown>) ??
      stableStringify(value) ??
      'Empty'
    )
  }
  return String(value)
}

export const getFilterMatchTokens = (value: unknown): string[] => {
  if (value === null || value === undefined) return ['']
  if (Array.isArray(value)) {
    const itemTokens = value.flatMap((item) => getFilterMatchTokens(item))
    const joinedToken = getFilterValueToken(value)
    return [...new Set([...itemTokens, joinedToken].filter(Boolean))]
  }

  return [getFilterValueToken(value)]
}

export const formatColumnId = (id: string): string => {
  return id
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export const getColumnHeaderText = <T,>(column: Column<T, unknown>): string => {
  const header = column.columnDef.header

  if (typeof header === 'string') {
    return header
  }

  return formatColumnId(column.id)
}
