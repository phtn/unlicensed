import {parseAsInteger, parseAsString, parseAsStringEnum} from 'nuqs'

import type {
  ColumnFiltersState,
  RowPinningState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'

// Pagination parser factory (default page size 100)
export const createPaginationParser = (defaultPageSize = 100) => ({
  pageIndex: parseAsInteger.withDefault(0),
  pageSize: parseAsInteger.withDefault(defaultPageSize),
})

export const paginationParser = createPaginationParser(100)

export const createLoadedCountParser = (defaultLoadedCount = 100) => ({
  parse: (value: string | null): number => {
    const parsed = value == null ? Number.NaN : Number(value)

    if (!Number.isFinite(parsed) || parsed < 1) {
      return defaultLoadedCount
    }

    return Math.floor(parsed)
  },
  serialize: (value: number): string => {
    if (!Number.isFinite(value) || value < 1) {
      return String(defaultLoadedCount)
    }

    return String(Math.floor(value))
  },
  defaultValue: defaultLoadedCount,
})

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

// Column filters parser - format: "id1:value1,value2|id2:|id3" (empty value = active column, no values selected)
export const createColumnFiltersParser = () => ({
  parse: (value: string | null): ColumnFiltersState => {
    if (!value) {
      return []
    }
    try {
      const filters: ColumnFiltersState = []
      const filterGroups = value.split('|')
      for (const group of filterGroups) {
        const colonIndex = group.indexOf(':')
        const columnId = colonIndex >= 0 ? group.slice(0, colonIndex) : group
        const valuesStr = colonIndex >= 0 ? group.slice(colonIndex + 1) : ''
        if (columnId) {
          const values =
            valuesStr.length > 0 ? valuesStr.split(',').filter(Boolean) : []
          filters.push({
            id: columnId,
            value: values,
          })
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
        const values = Array.isArray(filter.value) ? filter.value : []
        return `${filter.id}:${values.join(',')}`
      })
      .join('|')
  },
  defaultValue: [] as ColumnFiltersState,
})

// Column visibility parser - format: "id1,id2" for hidden columns,
// "id:1" for columns explicitly shown over a hidden default.
export const createColumnVisibilityParser = (
  defaultColumnVisibility: VisibilityState = {},
) => ({
  parse: (value: string | null): VisibilityState => {
    if (!value) {
      return defaultColumnVisibility
    }
    try {
      const visibility: VisibilityState = {...defaultColumnVisibility}
      const columns = value.split(',').filter(Boolean)
      columns.forEach((column) => {
        const [id, visibilityValue] = column.split(':')
        if (!id) {
          return
        }

        visibility[id] =
          visibilityValue === '1' || visibilityValue === 'true'
      })
      return visibility
    } catch {
      return defaultColumnVisibility
    }
  },
  serialize: (value: VisibilityState): string => {
    if (!value) {
      return ''
    }

    const columnIds = new Set([
      ...Object.keys(defaultColumnVisibility),
      ...Object.keys(value),
    ])

    return Array.from(columnIds)
      .flatMap((id) => {
        const visible = value[id] !== false
        const defaultVisible = defaultColumnVisibility[id] !== false

        if (visible === defaultVisible) {
          return []
        }

        return visible ? `${id}:1` : id
      })
      .join(',')
  },
  defaultValue: defaultColumnVisibility,
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

// Row pinning parser - format: "id1,id2,id3" for top-pinned rows.
export const createRowPinningParser = () => ({
  parse: (value: string | null): RowPinningState => {
    if (!value) {
      return {top: [], bottom: []}
    }
    try {
      return {
        top: value.split(',').filter(Boolean),
        bottom: [],
      }
    } catch {
      return {top: [], bottom: []}
    }
  },
  serialize: (value: RowPinningState): string => {
    if (!value?.top?.length) {
      return ''
    }

    return value.top.join(',')
  },
  defaultValue: {top: [], bottom: []} as RowPinningState,
})

// Select mode parser (boolean)
export const selectModeParser = parseAsStringEnum([
  'true',
  'false',
]).withDefault('false')
