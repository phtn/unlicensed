import {parseAsInteger, parseAsString, parseAsStringEnum} from 'nuqs'

import type {
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'

// Pagination parser
export const paginationParser = {
  pageIndex: parseAsInteger.withDefault(0),
  pageSize: parseAsInteger.withDefault(15),
}

// Search parser
export const searchParser = parseAsString.withDefault('')

// Sorting parser - format: "id:asc" or "id:desc"
export const createSortingParser = () => ({
  parse: (value: string | null): SortingState => {
    if (!value) {
      return []
    }
    try {
      const parts = value.split(':')
      if (parts.length === 2) {
        return [{id: parts[0], desc: parts[1] === 'desc'}]
      }
      return []
    } catch {
      return []
    }
  },
  serialize: (value: SortingState): string => {
    if (!value || value.length === 0) {
      return ''
    }
    const sort = value[0]
    return `${sort.id}:${sort.desc ? 'desc' : 'asc'}`
  },
  defaultValue: [] as SortingState,
})

// Column filters parser - format: "id1:value1,value2|id2:value3"
export const createColumnFiltersParser = () => ({
  parse: (value: string | null): ColumnFiltersState => {
    if (!value) {
      return []
    }
    try {
      const filters: ColumnFiltersState = []
      const filterGroups = value.split('|')
      for (const group of filterGroups) {
        const [columnId, valuesStr] = group.split(':')
        if (columnId && valuesStr) {
          const values = valuesStr.split(',').filter(Boolean)
          if (values.length > 0) {
            filters.push({
              id: columnId,
              value: values,
            })
          }
        }
      }
      return filters
    } catch {
      return []
    }
  },
  serialize: (value: ColumnFiltersState): string => {
    if (!value || value.length === 0) {
      return ''
    }
    return value
      .map((filter) => {
        if (Array.isArray(filter.value) && filter.value.length > 0) {
          return `${filter.id}:${filter.value.join(',')}`
        }
        return null
      })
      .filter((v): v is string => v !== null)
      .join('|')
  },
  defaultValue: [] as ColumnFiltersState,
})

// Column visibility parser - format: "id1,id2" (hidden columns)
export const createColumnVisibilityParser = () => ({
  parse: (value: string | null): VisibilityState => {
    if (!value) {
      return {}
    }
    try {
      const hiddenColumns = value.split(',').filter(Boolean)
      const visibility: VisibilityState = {}
      // All columns are visible by default, so we only track hidden ones
      hiddenColumns.forEach((id) => {
        visibility[id] = false
      })
      return visibility
    } catch {
      return {}
    }
  },
  serialize: (value: VisibilityState): string => {
    if (!value) {
      return ''
    }
    const hiddenColumns = Object.entries(value)
      .filter(([, visible]) => visible === false)
      .map(([id]) => id)
    return hiddenColumns.join(',')
  },
  defaultValue: {} as VisibilityState,
})

// Row selection parser - format: "id1,id2,id3"
export const createRowSelectionParser = () => ({
  parse: (value: string | null): RowSelectionState => {
    if (!value) {
      return {}
    }
    try {
      const selectedIds = value.split(',').filter(Boolean)
      const selection: RowSelectionState = {}
      selectedIds.forEach((id) => {
        selection[id] = true
      })
      return selection
    } catch {
      return {}
    }
  },
  serialize: (value: RowSelectionState): string => {
    if (!value) {
      return ''
    }
    const selectedIds = Object.keys(value).filter((id) => value[id] === true)
    return selectedIds.join(',')
  },
  defaultValue: {} as RowSelectionState,
})

// Select mode parser (boolean)
export const selectModeParser = parseAsStringEnum([
  'true',
  'false',
]).withDefault('false')
