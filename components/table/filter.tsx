import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Badge,
  Button,
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectItem,
} from '@heroui/react'
import {Column} from '@tanstack/react-table'
import {useId, useMemo} from 'react'

interface Props<T> {
  columns: Column<T, unknown>[]
  activeFilterColumns?: Column<T, unknown>[]
  onFilterColumnsChange?: (columns: Column<T, unknown>[]) => void
  isMobile: boolean
}
export const Filter = <T,>({
  columns,
  activeFilterColumns = [],
  onFilterColumnsChange,
  isMobile,
}: Props<T>) => {
  const baseId = useId()

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

  // Get all active filters data - reactive to column filter changes
  // Read filter values to ensure they're tracked as dependencies
  const activeFiltersData = useMemo(() => {
    // Read all filter values first to ensure they're tracked
    const filterValues = activeFilterColumns.map((col) => col.getFilterValue())

    return activeFilterColumns.map((column, index) => {
      const facetedValues = column.getFacetedUniqueValues()
      const filterValue = filterValues[index] as string[] | undefined

      return {
        column,
        uniqueValues: Array.from(facetedValues.keys()).sort(),
        valueCounts: facetedValues as Map<string | number | boolean, number>,
        selectedValues: filterValue ?? [],
      }
    })
  }, [activeFilterColumns])

  // Calculate total active filter count - reactive to filter changes
  const totalActiveFilters = useMemo(() => {
    return activeFiltersData.reduce((total, filterData) => {
      return total + filterData.selectedValues.length
    }, 0)
  }, [activeFiltersData])

  const handleColumnAdd = (columnId: string) => {
    const column = filterableColumns.find((col) => col.id === columnId)
    if (column && !activeFilterColumns.some((col) => col.id === columnId)) {
      const newActiveColumns = [...activeFilterColumns, column]
      onFilterColumnsChange?.(newActiveColumns)
    }
  }

  const handleColumnRemove = (columnId: string) => {
    const column = activeFilterColumns.find((col) => col.id === columnId)
    if (column) {
      // Clear the filter before removing
      column.setFilterValue(undefined)
      const newActiveColumns = activeFilterColumns.filter(
        (col) => col.id !== columnId,
      )
      onFilterColumnsChange?.(newActiveColumns)
    }
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='flat'
          className={cn(
            'relative data-[state=open]:bg-origin/60 rounded-sm border -space-x-px select-none h-7.5 ps-1 aspect-square',
          )}>
          <Icon
            name='search'
            className={cn(
              'size-4 md:size-5 opacity-60',
              (totalActiveFilters > 0 || activeFilterColumns.length > 0) &&
                'text-mac-indigo opacity-100',
            )}
          />
          <span className='capitalize hidden md:flex'>filter</span>
          {totalActiveFilters > 0 && (
            <Badge className='absolute bg-mac-indigo rounded-full -top-1.5 md:-top-0.5 left-full -translate-x-3.5 md:-translate-1/2 size-5 aspect-square px-1 text-white font-space'>
              {totalActiveFilters > 99 ? '99+' : totalActiveFilters}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto min-w-44 p-3 rounded-3xl'>
        <div>
          {/* Add Filter Section */}
          {availableColumns.length > 0 && (
            <>
              <div className='mb-3'>
                <div className='hidden _flex items-center px-2 py-1.5 space-x-2 text-sm font-medium tracking-tight font-figtree'>
                  <Icon
                    name='tag-light'
                    className='size-3.5 text-mac-blue dark:text-primary-hover'
                  />
                  <span className='italic capitalize opacity-60'>
                    Add Filter
                  </span>
                </div>
                <Select
                  placeholder='Add Columns'
                  selectedKeys={[]}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string
                    if (selectedKey) {
                      handleColumnAdd(selectedKey)
                    }
                  }}
                  className='w-full mt-1 h-10 rounded-2xl shadow-none bg-origin'>
                  {availableColumns.map((column) => (
                    <SelectItem key={column.id}>
                      {typeof column.columnDef.header === 'string'
                        ? column.columnDef.header
                        : column.id}
                    </SelectItem>
                  ))}
                </Select>
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
                    name='search'
                    className='size-3.5 text-mac-blue dark:text-primary-hover'
                  />
                  <span className='italic capitalize opacity-60'>
                    {typeof filterData.column.columnDef.header === 'string'
                      ? filterData.column.columnDef.header
                      : filterData.column.id}
                  </span>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleColumnRemove(filterData.column.id)}
                  className='h-6 w-6 p-0 text-muted-foreground hover:text-destructive'>
                  <Icon name='alert-rhombus' className='size-3' />
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
                      <Checkbox
                        id={id}
                        isSelected={isChecked}
                        onValueChange={(checked) => {
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

                          if (checked) {
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
                            newFilterValue.length ? newFilterValue : undefined,
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
      </PopoverContent>
    </Popover>
  )
}
