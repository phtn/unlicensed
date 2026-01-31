import {useToggle} from '@/hooks/use-toggle'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Checkbox, Toolbar} from '@base-ui/react'
import {Popover} from '@base-ui/react/popover'
import {Select} from '@base-ui/react/select'
import {Badge} from '@heroui/react'
import type {ColumnFiltersState} from '@tanstack/react-table'
import {Column} from '@tanstack/react-table'
import {useQueryState} from 'nuqs'
import {useId, useMemo, useState} from 'react'
import {createColumnFiltersParser} from './parsers-v2'

interface Props<T> {
  columns: Column<T, unknown>[]
  activeFilterColumns?: Column<T, unknown>[]
  onAddFilterColumn?: (columnId: string) => void
  onRemoveFilterColumn?: (columnId: string) => void
  isMobile: boolean
}
export const Filter = <T,>({
  columns,
  activeFilterColumns = [],
  onAddFilterColumn,
  onRemoveFilterColumn,
  isMobile,
}: Props<T>) => {
  const baseId = useId()

  // Subscribe to filters search param so the component re-renders when the URL changes
  const columnFiltersParser = useMemo(
    () => createColumnFiltersParser(),
    [],
  )
  const [columnFiltersParam] = useQueryState(
    'filters',
    columnFiltersParser,
  )
  const filtersFromUrl = (columnFiltersParam ?? []) as ColumnFiltersState

  // Get filterable columns (exclude select and actions columns)
  const filterableColumns = useMemo(
    () =>
      columns.filter(
        (col) =>
          col.getCanFilter() && col.id !== 'select' && col.id !== 'actions',
      ),
    [columns],
  )

  // Get available columns (not currently being filtered)
  const availableColumns = useMemo(
    () =>
      filterableColumns.filter(
        (col) =>
          !activeFilterColumns.some((activeCol) => activeCol.id === col.id),
      ),
    [filterableColumns, activeFilterColumns],
  )

  // Get all active filters data - selectedValues from URL param so UI stays in sync with URL
  const activeFiltersData = useMemo(() => {
    return activeFilterColumns.map((column) => {
      const facetedValues = column.getFacetedUniqueValues()
      const filterInUrl = filtersFromUrl.find((f) => f.id === column.id)
      const selectedValues = (filterInUrl?.value ??
        column.getFilterValue()) as (string | number | boolean)[]
      return {
        column,
        uniqueValues: Array.from(facetedValues.keys()).toSorted(),
        valueCounts: facetedValues as Map<string | number | boolean, number>,
        selectedValues: Array.isArray(selectedValues) ? selectedValues : [],
      }
    })
  }, [activeFilterColumns, filtersFromUrl])

  // Calculate total active filter count - reactive to filter changes
  const totalActiveFilters = useMemo(() => {
    return activeFiltersData.reduce((total, filterData) => {
      return total + filterData.selectedValues.length
    }, 0)
  }, [activeFiltersData])

  const [addColumnValue, setAddColumnValue] = useState<string | null>(null)

  const handleColumnAdd = (columnId: string) => {
    if (!activeFilterColumns.some((col) => col.id === columnId)) {
      onAddFilterColumn?.(columnId)
    }
    setAddColumnValue(null)
  }

  const handleColumnRemove = (columnId: string) => {
    onRemoveFilterColumn?.(columnId)
  }

  const formatLabel = (value: unknown) => {
    if (typeof value === 'boolean') {
      return value ? 'Active' : 'Inactive'
    }
    if (typeof value === 'string' && value.length === 0) {
      return 'Empty'
    }
    return String(value)
  }

  const {on, toggle} = useToggle(false)

  return (
    <Popover.Root>
      <Popover.Trigger
        onClick={toggle}
        className='md:flex hidden'
        render={
          <Toolbar.Button
            className={cn(
              'relative flex h-7.5 items-center justify-center rounded-sm space-x-2 px-3.5 text-sm select-none data-pressed:bg-gray-100 focus-visible:bg-none focus-visible:outline-2 focus-visible:-outline-offset-1 hover:bg-sidebar/60 active:bg-sidebar dark:active:bg-dark-table/20 dark:hover:bg-dark-table/50 dark:bg-transparent transition-colors duration-75',
              {'bg-dark-table/5 dark:bg-dark-table/50 border': on},
            )}>
            <Icon
              name='filter-bold'
              className={cn(
                'size-4',
                (totalActiveFilters > 0 || activeFilterColumns.length > 0) &&
                  'text-mac-indigo opacity-100',
              )}
            />
            <span className='capitalize hidden md:flex text-sm opacity-90 font-brk'>
              Filter
            </span>
            {totalActiveFilters > 0 && (
              <Badge className='absolute bg-mac-indigo rounded-full -top-1.5 md:-top-0.5 left-full -translate-x-3.5 md:-translate-1/2 size-5 aspect-square px-1 text-white font-space'>
                {totalActiveFilters > 99 ? '99+' : totalActiveFilters}
              </Badge>
            )}
          </Toolbar.Button>
        }></Popover.Trigger>
      <Popover.Portal onPointerLeave={toggle}>
        <Popover.Positioner sideOffset={4} align={'end'}>
          <Popover.Popup className='w-54 p-3 border border-dark-table/15 bg-sidebar dark:bg-dark-table rounded-2xl'>
            <div>
              {/* Add Filter Section */}
              {availableColumns.length > 0 && (
                <>
                  <div className='mb-3'>
                    <div className='hidden _flex items-center px-2 py-1.5 space-x-2 text-sm font-medium tracking-tight font-figtree'>
                      <Icon
                        name='plus'
                        className='size-3.5 text-mac-blue dark:text-primary-hover'
                      />
                      <span className='italic capitalize opacity-60'>
                        Add Filter
                      </span>
                    </div>
                    <Select.Root
                      value={addColumnValue}
                      onValueChange={(value: string | null, _eventDetails) => {
                        if (value) handleColumnAdd(value)
                        else setAddColumnValue(null)
                      }}>
                      <Select.Trigger className='w-full flex items-center space-x-2 text-sm font-medium tracking-tight font-figtree h-10 rounded-2xl shadow-none'>
                        <Icon name='plus' className='size-5' />
                        <Select.Value placeholder='Add Columns' />
                      </Select.Trigger>
                      <Select.Portal className='z-60 min-w-44 p-3 rounded-3xl'>
                        <Select.List>
                          {availableColumns.map((column) => (
                            <Select.Item key={column.id} value={column.id}>
                              {typeof column.columnDef.header === 'string'
                                ? column.columnDef.header
                                : column.id}
                            </Select.Item>
                          ))}
                        </Select.List>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                  <div className='h-0.5 bg-origin/50 my-2' />
                </>
              )}

              {/* Active Filters */}
              {activeFiltersData.map((filterData, columnIndex) => (
                <div key={filterData.column.id} className='mb-4 last:mb-0'>
                  {/* Filter Header */}
                  <div className='flex items-center justify-between px-2 py-1.5'>
                    <div className='flex items-center space-x-2 text-sm font-medium tracking-tight font-figtree'>
                      <Icon
                        name='re-up.ph'
                        className='size-3.5 text-mac-blue dark:text-primary-hover'
                      />
                      <span className='italic capitalize opacity-60'>
                        {typeof filterData.column.columnDef.header === 'string'
                          ? filterData.column.columnDef.header
                          : filterData.column.id}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleColumnRemove(filterData.column.id)}
                      className='h-6 w-6 p-0 text-muted-foreground hover:text-destructive'>
                      <Icon name='x' className='size-3' />
                    </Button>
                  </div>

                  {/* Filter Values */}
                  <div className='max-h-32 overflow-y-auto'>
                    {filterData.uniqueValues.map((value, i) => {
                      const id = `v-${baseId}-${columnIndex}-${i}`
                      // Normalize value to string for consistent comparison
                      const vStr = String(value)
                      const labelText = formatLabel(value)
                      const count = filterData.valueCounts.get(value) ?? 0
                      // Check if this value is in the selected filters
                      const isChecked = filterData.selectedValues.some(
                        (selected) => {
                          // Compare normalized strings for consistency
                          return String(selected) === vStr || selected === value
                        },
                      )

                      return (
                        <div
                          key={id}
                          className='flex h-10 px-3 items-center gap-2 hover:bg-origin/80 rounded-lg'>
                          <Checkbox.Root
                            id={id}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const column = activeFilterColumns.find(
                                (col) => col.id === filterData.column.id,
                              )
                              if (!column) return

                              const currentFilter = column.getFilterValue() as (
                                | string
                                | number
                                | boolean
                              )[]
                              const newFilterValue = currentFilter
                                ? [...currentFilter]
                                : []

                              if (!!checked) {
                                // Add value if not already present (check both string and original value)
                                const alreadyExists = newFilterValue.some(
                                  (fv) => String(fv) === vStr || fv === value,
                                )
                                if (!alreadyExists) {
                                  // Store as string for consistency
                                  newFilterValue.push(vStr)
                                }
                              } else {
                                // Remove value if present (check both string and original value)
                                const index = newFilterValue.findIndex(
                                  (fv) => String(fv) === vStr || fv === value,
                                )
                                if (index > -1) {
                                  newFilterValue.splice(index, 1)
                                }
                              }

                              column.setFilterValue(
                                newFilterValue.length
                                  ? newFilterValue
                                  : undefined,
                              )
                            }}
                          />
                          <label
                            htmlFor={id}
                            className='flex grow justify-between gap-2 font-sans text-sm'>
                            <span className='truncate'>{labelText}</span>
                            <span className='text-muted-foreground text-xs shrink-0'>
                              {count}
                            </span>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {activeFilterColumns.length === 0 && (
                <div className='px-2 py-4 text-center text-sm text-muted-foreground'>
                  No active filters.
                </div>
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
