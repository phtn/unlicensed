import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Checkbox} from '@base-ui/react'
import {Popover} from '@base-ui/react/popover'
import {Select, SelectItem} from '@heroui/react'
import type {ColumnFiltersState} from '@tanstack/react-table'
import {Column} from '@tanstack/react-table'
import {useQueryState} from 'nuqs'
import {useId, useMemo} from 'react'
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
}: Props<T>) => {
  const baseId = useId()

  // Subscribe to filters search param so the component re-renders when the URL changes
  const columnFiltersParser = useMemo(() => createColumnFiltersParser(), [])
  const [columnFiltersParam] = useQueryState('filters', columnFiltersParser)
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

  const handleColumnAdd = (columnId: string) => {
    if (!activeFilterColumns.some((col) => col.id === columnId)) {
      onAddFilterColumn?.(columnId)
    }
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

  return (
    <Popover.Root>
      <Popover.Trigger
        className='md:flex hidden'
        render={
          <Button
            className={cn(
              'relative flex h-7.5 items-center justify-center rounded-sm space-x-2 px-3.5 text-sm select-none transition-colors duration-75',
              'data-pressed:bg-gray-100 dark:data-pressed:bg-dark-table/50 ',
              'bg-sidebar/50 dark:bg-dark-table/10',
              'hover:bg-sidebar/60 dark:hover:bg-dark-table/50',
              'active:bg-sidebar dark:active:bg-dark-table/20',
              'focus-visible:bg-none focus-visible:outline-1 focus-visible:-outline-offset-1',
            )}>
            {totalActiveFilters > 0 ? (
              <span className='bg-indigo-500 dark:bg-indigo-400 text-white w-5 -ml-1 rounded-sm font-okxs font-semibold'>
                {totalActiveFilters > 99 ? '99+' : totalActiveFilters}
              </span>
            ) : (
              <Icon
                name='filter-bold'
                className={cn('size-4 dark:opacity-80')}
              />
            )}
            <span className='capitalize hidden md:flex text-sm opacity-90 font-brk'>
              Filter
            </span>
          </Button>
        }></Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          sideOffset={4}
          align={'end'}
          collisionAvoidance={{side: 'flip', align: 'none'}}
          positionMethod='fixed'>
          <Popover.Popup className='w-54 p-2 border border-dark-table/15 bg-sidebar dark:bg-dark-table rounded-2xl'>
            <div>
              {/* Add Filter Section */}
              {availableColumns.length > 0 && (
                <>
                  <div className='mb-2'>
                    <Select
                      placeholder='Add Columns'
                      selectedKeys={new Set()}
                      onSelectionChange={(keys) => {
                        const key = keys === 'all' ? null : Array.from(keys)[0]
                        if (key) handleColumnAdd(String(key))
                      }}
                      variant='bordered'
                      classNames={{
                        trigger:
                          'w-full h-9 border-none min-h-9 rounded-lg shadow-none font-okxs opacity-100 dark:hover:bg-origin/60 dark:bg-origin/40',
                        value: 'text-sm font-okxs font-semibold opacity-100',
                      }}
                      popoverProps={{
                        classNames: {
                          content: 'z-60 min-w-64 p-2 m-1 rounded-2xl',
                          base: 'p-1',
                        },
                      }}>
                      {availableColumns.map((column) => (
                        <SelectItem
                          key={column.id}
                          className='capitalize outline-none '
                          textValue={
                            typeof column.columnDef.header === 'string'
                              ? column.columnDef.header
                              : column.id
                          }>
                          {typeof column.columnDef.header === 'string'
                            ? column.columnDef.header
                            : column.id}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </>
              )}

              {/* Active Filters */}
              {activeFiltersData.map((filterData, columnIndex) => (
                <div key={filterData.column.id} className=' mb-4 last:mb-0'>
                  {/* Filter Header */}
                  <div className='flex items-center justify-between px-0 py-1.5 w-full'>
                    <div className='flex items-center space-x-2 text-sm font-medium'>
                      <Icon
                        name='minus-square-fill'
                        className='size-4 text-indigo-500 dark:text-indigo-400'
                      />
                      <span className='font-okxs font-medium capitalize'>
                        {typeof filterData.column.columnDef.header === 'string'
                          ? filterData.column.columnDef.header
                          : filterData.column.id}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleColumnRemove(filterData.column.id)}
                      className='h-6 w-3 p-0 text-muted-foreground hover:text-destructive'>
                      <Icon name='x' className='size-3' />
                    </Button>
                  </div>

                  {/* Filter Values */}
                  <div className='max-h-32 overflow-y-auto [scrollbar-gutter:stable]'>
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
                          className={cn(
                            'flex h-8 ml-5 px-1.5 font-brk items-center hover:bg-dark-table/10 dark:hover:bg-origin/30 rounded-sm',
                            {
                              'bg-indigo-500 dark:bg-origin/80 hover:bg-indigo-400 dark:hover:bg-origin/50 text-white dark:text-indigo-400 opacity-100':
                                isChecked,
                            },
                          )}>
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
                            className={cn(
                              'flex grow justify-between gap-2 font-brk text-xs',
                            )}>
                            <span className='truncate'>{labelText}</span>
                            <span className='text-xs shrink-0'>{count}</span>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {activeFilterColumns.length === 0 && (
                <div className='px-2 py-2 font-brk text-center text-xs opacity-60'>
                  no active filters
                </div>
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
