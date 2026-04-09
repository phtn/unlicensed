import type {Row} from '@tanstack/react-table'
import {getFilterMatchTokens, getFilterValueToken} from './filter-utils'

/**
 * Normalizes text for better matching by:
 * - Converting to lowercase
 * - Trimming whitespace
 * - Normalizing unicode characters (e.g., é → e)
 * - Collapsing multiple spaces
 */
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/\s+/g, ' ') // Collapse multiple spaces
}

/**
 * Improved generic filter function for text-based columns
 * - Better null/undefined handling (only excludes when actively filtering)
 * - Text normalization for better matching
 * - Handles array filter values (from multi-select filtering)
 */
export const filterFn = <T,>(
  row: Row<T>,
  columnId: string,
  filterValue: unknown,
): boolean => {
  const value = row.getValue(columnId)

  if (
    !filterValue ||
    (typeof filterValue === 'string' && filterValue.trim() === '')
  ) {
    return true
  }

  if (value === null || value === undefined) {
    return false
  }

  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) return true
    const rowTokens = getFilterMatchTokens(value)
    const normalizedRowTokens = rowTokens.map((token) => normalizeText(token))
    return filterValue.some((fv) => {
      const normalizedFilterValue = normalizeText(getFilterValueToken(fv))
      return (
        normalizedRowTokens.some(
          (token) =>
            token === normalizedFilterValue ||
            token.includes(normalizedFilterValue),
        ) || fv === value
      )
    })
  }

  const filterStr = String(filterValue).trim()
  if (filterStr === '') return true

  const normalizedValue = normalizeText(String(value))
  const normalizedFilter = normalizeText(filterStr)

  return normalizedValue.includes(normalizedFilter)
}

export const multiSelectFilterFn = <T,>(
  row: Row<T>,
  columnId: string,
  filterValue: (string | number | boolean)[],
): boolean => {
  if (!filterValue?.length) return true
  const rowValue = row.getValue(columnId)
  const rowTokens = getFilterMatchTokens(rowValue)

  return filterValue.some((fv) => {
    const filterToken = getFilterValueToken(fv)
    return rowTokens.includes(filterToken) || fv === rowValue
  })
}

export const groupFilter = <T,>(
  row: Row<T>,
  columnId: string,
  filterValue: unknown,
): boolean => {
  const value = row.getValue(columnId)

  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) return true
    const rowTokens = getFilterMatchTokens(value)
    return filterValue.some((fv) => {
      const filterToken = getFilterValueToken(fv)
      return rowTokens.includes(filterToken) || fv === value
    })
  }

  if (filterValue == null || filterValue === '') return true
  const filterToken = getFilterValueToken(filterValue)
  return (
    value === filterValue || getFilterMatchTokens(value).includes(filterToken)
  )
}

/**
 * Global filter invoked once per globally searchable column by TanStack Table.
 * Match only the current column id so global search respects each column's value.
 */
export const globalFilterFn = <T,>(
  row: Row<T>,
  columnId: string,
  filterValue: string,
): boolean => {
  if (!filterValue || filterValue.trim() === '') {
    return true
  }

  const value = row.getValue(columnId)

  if (value === null || value === undefined) {
    return false
  }

  const normalizedFilter = normalizeText(filterValue)
  const rowTokens = getFilterMatchTokens(value)

  return rowTokens.some((token) =>
    normalizeText(token).includes(normalizedFilter),
  )
}
