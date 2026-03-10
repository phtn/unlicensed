import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button as BaseButton, Checkbox} from '@base-ui/react'
import {Popover} from '@base-ui/react/popover'
import type {ColumnFiltersState} from '@tanstack/react-table'
import {Column} from '@tanstack/react-table'
import {useQueryState} from 'nuqs'
import {useId, useMemo} from 'react'
import {
  getColumnHeaderText,
  getFilterValueLabel,
  getFilterValueToken,
} from './filter-utils'
import {createColumnFiltersParser} from './parsers-v2'

interface Props<T> {
  columns: Column<T, unknown>[]
  activeFilterColumns?: Column<T, unknown>[]
  onAddFilterColumn?: (columnId: string) => void
  onRemoveFilterColumn?: (columnId: string) => void
  isMobile: boolean
}

type FilterOption = {
  count: number
  label: string
  rawValue: unknown
  token: string
}

export const Filter = <T,>({
  columns,
  activeFilterColumns = [],
  onAddFilterColumn,
  onRemoveFilterColumn,
}: Props<T>) => {
  const baseId = useId()

  const columnFiltersParser = useMemo(() => createColumnFiltersParser(), [])
  const [columnFiltersParam] = useQueryState('filters', columnFiltersParser)
  const filtersFromUrl = useMemo(
    () => (columnFiltersParam ?? []) as ColumnFiltersState,
    [columnFiltersParam],
  )

  const filterableColumns = useMemo(
    () =>
      columns.filter(
        (col) =>
          col.getCanFilter() && col.id !== 'select' && col.id !== 'actions',
      ),
    [columns],
  )

  const availableColumns = useMemo(
    () =>
      filterableColumns.filter(
        (col) =>
          !activeFilterColumns.some((activeCol) => activeCol.id === col.id),
      ),
    [filterableColumns, activeFilterColumns],
  )

  const activeFiltersData = useMemo(() => {
    return activeFilterColumns.map((column) => {
      const facetedValues = column.getFacetedUniqueValues()
      const filterInUrl = filtersFromUrl.find((f) => f.id === column.id)
      const selectedValues = (filterInUrl?.value ??
        column.getFilterValue()) as (string | number | boolean)[]
      const meta = column.columnDef.meta as
        | {filterOptions?: unknown[]}
        | undefined
      const metaFilterOptions = meta?.filterOptions

      const countByToken = new Map<string, number>()
      const rawValueByToken = new Map<string, unknown>()

      for (const [rawValue, count] of facetedValues.entries()) {
        const token = getFilterValueToken(rawValue)
        countByToken.set(token, (countByToken.get(token) ?? 0) + count)
        if (!rawValueByToken.has(token)) {
          rawValueByToken.set(token, rawValue)
        }
      }

      const optionSource = Array.isArray(metaFilterOptions)
        ? metaFilterOptions
        : Array.from(rawValueByToken.values())

      const uniqueValues = optionSource
        .map((rawValue) => {
          const token = getFilterValueToken(rawValue)
          return {
            rawValue,
            token,
            label: getFilterValueLabel(rawValue),
            count: countByToken.get(token) ?? 0,
          } satisfies FilterOption
        })
        .filter(
          (option, index, options) =>
            option.token.length > 0 &&
            options.findIndex(
              (candidate) => candidate.token === option.token,
            ) === index,
        )
        .sort((a, b) => a.label.localeCompare(b.label))

      return {
        column,
        selectedValues: Array.isArray(selectedValues) ? selectedValues : [],
        uniqueValues,
      }
    })
  }, [activeFilterColumns, filtersFromUrl])

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

  return (
    <Popover.Root>
      <Popover.Trigger
        className='hidden md:flex'
        render={
          <BaseButton
            className={cn(
              'relative flex h-7.5 items-center justify-center rounded-sm space-x-2 px-3.5 text-sm select-none transition-colors duration-75',
              'data-pressed:bg-gray-100 dark:data-pressed:bg-dark-table/50 ',
              'bg-sidebar/50 dark:bg-dark-table/10',
              'hover:bg-sidebar/60 dark:hover:bg-dark-table/50',
              'active:bg-sidebar dark:active:bg-dark-table/20',
              'focus-visible:bg-none focus-visible:outline-1 focus-visible:-outline-offset-1',
            )}>
            {totalActiveFilters > 0 ? (
              <span className='bg-indigo-500 font-okxs -ml-1 w-5 rounded-sm font-semibold text-white dark:bg-indigo-400'>
                {totalActiveFilters > 99 ? '99+' : totalActiveFilters}
              </span>
            ) : (
              <Icon
                name='filter-bold'
                className={cn('size-4 dark:opacity-80')}
              />
            )}
            <span className='text-sm font-brk capitalize opacity-90 flex'>
              Filter
            </span>
          </BaseButton>
        }
      />
      <Popover.Portal>
        <Popover.Positioner
          sideOffset={4}
          align='end'
          collisionAvoidance={{side: 'flip', align: 'none'}}
          positionMethod='fixed'>
          <Popover.Popup className='w-64 rounded-xl border border-dark-gray/30 bg-sidebar p-1 dark:bg-dark-table dark:text-zinc-200'>
            {availableColumns.length > 0 ? (
              <>
                <div className='flex items-center border-b border-dashed border-dark-gray/25 px-4 py-1 dark:border-zinc-800'>
                  <span className='text-sm font-okxs font-medium capitalize'>
                    Add filter
                  </span>
                </div>
                <div className='p-2'>
                  {availableColumns.map((column) => (
                    <button
                      key={column.id}
                      type='button'
                      onClick={() => handleColumnAdd(column.id)}
                      className={cn(
                        'flex h-8 w-full items-center justify-between rounded-sm px-3 text-left text-xs',
                        'text-origin hover:bg-dark-table/10 dark:text-white dark:hover:bg-origin/40 dark:hover:text-orange-300',
                      )}>
                      <span>{getColumnHeaderText(column)}</span>
                      <Icon name='plus' className='size-4' />
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {activeFiltersData.length > 0 ? (
              <div
                className={cn('space-y-3 p-2', {
                  'border-t border-dashed border-dark-gray/25 dark:border-zinc-800':
                    availableColumns.length > 0,
                })}>
                {activeFiltersData.map((filterData, columnIndex) => (
                  <div key={filterData.column.id}>
                    <div className='mb-2 flex items-center justify-between px-2 py-1'>
                      <div className='flex items-center space-x-2 text-sm font-medium'>
                        <Icon
                          name='minus-square-fill'
                          className='size-4 text-indigo-500 dark:text-indigo-400'
                        />
                        <span className='font-okxs font-medium capitalize'>
                          {getColumnHeaderText(filterData.column)}
                        </span>
                      </div>
                      <BaseButton
                        onClick={() => handleColumnRemove(filterData.column.id)}
                        className='h-6 w-6 p-0 text-muted-foreground hover:text-destructive'>
                        <Icon name='x' className='size-3' />
                      </BaseButton>
                    </div>

                    <div className='max-h-40 overflow-y-auto [scrollbar-gutter:stable]'>
                      {filterData.uniqueValues.map((option, index) => {
                        const id = `v-${baseId}-${columnIndex}-${index}`
                        const isChecked = filterData.selectedValues.some(
                          (selected) =>
                            getFilterValueToken(selected) === option.token,
                        )

                        return (
                          <div
                            key={id}
                            className={cn(
                              'ml-5 flex h-8 items-center rounded-sm px-1.5 font-brk hover:bg-dark-table/10 dark:hover:bg-origin/30',
                              {
                                'bg-indigo-500 text-white opacity-100 hover:bg-indigo-400 dark:bg-origin/80 dark:text-indigo-400 dark:hover:bg-origin/50':
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

                                const currentFilter =
                                  column.getFilterValue() as (
                                    | string
                                    | number
                                    | boolean
                                  )[]
                                const nextFilterValue = currentFilter
                                  ? [...currentFilter]
                                  : []

                                if (checked) {
                                  const exists = nextFilterValue.some(
                                    (value) =>
                                      getFilterValueToken(value) ===
                                      option.token,
                                  )
                                  if (!exists) {
                                    nextFilterValue.push(option.token)
                                  }
                                } else {
                                  const nextIndex = nextFilterValue.findIndex(
                                    (value) =>
                                      getFilterValueToken(value) ===
                                      option.token,
                                  )
                                  if (nextIndex > -1) {
                                    nextFilterValue.splice(nextIndex, 1)
                                  }
                                }

                                column.setFilterValue(
                                  nextFilterValue.length > 0
                                    ? nextFilterValue
                                    : undefined,
                                )
                              }}
                            />
                            <label
                              htmlFor={id}
                              className='flex grow justify-between gap-2 font-brk text-xs'>
                              <span className='truncate'>{option.label}</span>
                              <span className='shrink-0 text-xs'>
                                {option.count}
                              </span>
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={cn(
                  'px-2 py-3 text-center font-brk text-xs opacity-60',
                  {
                    'border-t border-dashed border-dark-gray/25 dark:border-zinc-800':
                      availableColumns.length > 0,
                  },
                )}>
                no active filters
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
