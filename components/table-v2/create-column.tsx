import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Checkbox} from '@base-ui/react/checkbox'
import {
  type CellContext,
  type ColumnDef,
  type FilterFn,
  type Row,
  type RowSelectionState,
  type Table,
} from '@tanstack/react-table'
import {AnimatePresence, motion} from 'motion/react'
import {useQueryState} from 'nuqs'
import {type ChangeEvent, type ReactNode, useMemo} from 'react'
import {createRowSelectionParser} from './parsers-v2'
import {RowActions} from './row-actions'

/**
 * Normalizes text for better matching by:
 * - Converting to lowercase
 * - Trimming whitespace
 * - Normalizing unicode characters (e.g., é → e)
 * - Collapsing multiple spaces
 */
const normalizeText = (text: string): string => {
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

  // If no filter is applied, include the row
  if (
    !filterValue ||
    (typeof filterValue === 'string' && filterValue.trim() === '')
  ) {
    return true
  }

  // Handle null/undefined values: exclude only when actively filtering
  if (value === null || value === undefined) {
    return false
  }

  // Handle array filter values (from multi-select filter component)
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) return true
    const rowValueStr = String(value)
    const normalizedRowValue = normalizeText(rowValueStr)
    return filterValue.some((fv) => {
      const normalizedFilterValue = normalizeText(String(fv))
      return (
        normalizedFilterValue === normalizedRowValue ||
        rowValueStr.toLowerCase().includes(normalizedFilterValue) ||
        fv === value
      )
    })
  }

  // Handle string/text filter values with normalization
  const filterStr = String(filterValue).trim()
  if (filterStr === '') return true

  const valueStr = String(value)
  const normalizedValue = normalizeText(valueStr)
  const normalizedFilter = normalizeText(filterStr)

  return normalizedValue.includes(normalizedFilter)
}
// Generic filter function for multi-select columns (like status)
export const multiSelectFilterFn = <T,>(
  row: Row<T>,
  columnId: string,
  filterValue: (string | number | boolean)[],
): boolean => {
  if (!filterValue?.length) return true
  const rowValue = row.getValue(columnId)
  const rowValueStr = String(rowValue)

  // Check if filter includes the row value (as string or original type)
  return filterValue.some((fv) => String(fv) === rowValueStr || fv === rowValue)
}

// Generic filter function for exact match filtering (group/category filters)
// Handles both array filter values (from multi-select) and single value exact matches
export const groupFilter = <T,>(
  row: Row<T>,
  columnId: string,
  filterValue: unknown,
): boolean => {
  const value = row.getValue(columnId)

  // Handle array filter values (from multi-select filter component)
  if (Array.isArray(filterValue)) {
    if (filterValue.length === 0) return true
    // Compare both normalized strings and original values
    const valueStr = String(value)
    return filterValue.some((fv) => String(fv) === valueStr || fv === value)
  }

  // Handle single value exact match
  if (filterValue == null || filterValue === '') return true
  return value === filterValue || String(value) === String(filterValue)
}

/**
 * Custom global filter function for searching across all columns
 * Searches through all filterable columns and matches using normalized text
 */
export const globalFilterFn = <T,>(
  row: Row<T>,
  columnId: string,
  filterValue: string,
): boolean => {
  // If no filter is applied, include the row
  if (!filterValue || filterValue.trim() === '') {
    return true
  }

  const normalizedFilter = normalizeText(filterValue)

  // Search through all visible, filterable columns
  return row.getVisibleCells().some((cell) => {
    const column = cell.column
    // Skip select and actions columns
    if (
      column.id === 'select' ||
      column.id === 'actions' ||
      !column.getCanFilter()
    ) {
      return false
    }

    const value = cell.getValue()

    // Skip null/undefined values
    if (value === null || value === undefined) {
      return false
    }

    // Normalize and check if the value contains the filter text
    const valueStr = String(value)
    const normalizedValue = normalizeText(valueStr)

    return normalizedValue.includes(normalizedFilter)
  })
}

// Column factory configuration interface
export interface ColumnConfig<T> {
  id: string
  header: ReactNode
  accessorKey: keyof T
  /**
   * Cell renderer function that receives CellContext
   *
   * @example
   * ```tsx
   * // Using textCell from cells.tsx
   * cell: textCell('name', 'font-medium')
   *
   * // Using dateCell from cells.tsx
   * cell: dateCell('createdAt', (date) => format(date, 'MMM dd, yyyy'))
   *
   * // Using booleanCell from cells.tsx
   * cell: booleanCell('isActive', { trueLabel: 'Active', falseLabel: 'Inactive' })
   *
   * // Custom cell renderer
   * cell: ({ getValue }) => {
   *   const value = getValue()
   *   return <span className={value > 100 ? 'text-green-600' : 'text-red-600'}>
   *     {value}
   *   </span>
   * }
   * ```
   */
  cell?: (ctx: CellContext<T, unknown>) => ReactNode
  size?: number
  filterFn?: FilterFn<T>
  enableHiding?: boolean
  enableSorting?: boolean
  meta?: Record<string, unknown>
}

export type ActionRenderMode = 'dropdown' | 'buttons' | 'custom'
export type ActionAlign = 'start' | 'center' | 'end'

export interface ActionItem<T> {
  id?: string
  label: string
  icon?: IconName
  shortcut?: string
  section?: string
  variant?: 'default' | 'destructive'
  appearance?: 'button' | 'icon-button'
  className?: string
  hidden?: boolean | ((row: T) => boolean)
  disabled?: boolean | ((row: T) => boolean)
  onClick: (row: T) => void
}

export interface ActionTriggerConfig<T> {
  icon?: IconName
  label?: string
  className?: string
  render?: (ctx: {
    row: Row<T>
    loading: boolean
    defaultTrigger: ReactNode
  }) => ReactNode
}

export interface ActionConfig<T> {
  mode?: ActionRenderMode
  align?: ActionAlign
  header?: ReactNode
  columnSize?: number
  trigger?: ActionTriggerConfig<T>
  actions?: ActionItem<T>[]
  render?: (ctx: {
    row: Row<T>
    actions: ActionItem<T>[]
    defaultDropdown: ReactNode
    defaultButtons: ReactNode
  }) => ReactNode
  // Backward-compatible legacy config
  viewFn?: (row: T) => void
  deleteFn?: (row: T) => void
  customActions?: Array<{
    label: string
    icon?: IconName
    onClick: (row: T) => void
    variant?: 'default' | 'destructive'
    shortcut?: string
  }>
}

// Generic column factory function
export const createColumns = <T,>(
  columnConfigs: ColumnConfig<T>[],
  actionConfig?: ActionConfig<T>,
  showSelectColumn: boolean = false,
): ColumnDef<T>[] => {
  const columns: ColumnDef<T>[] = []

  // Always add select column but control visibility through animation
  columns.push({
    id: 'select',
    header: ({table}) => (
      <SelectAllCheckbox table={table} isVisible={showSelectColumn} />
    ),
    cell: ({row}) => (
      <SelectRowCheckbox row={row} isVisible={showSelectColumn} />
    ),
    size: 50,
    enableHiding: false,
    enableSorting: false,
    meta: {
      isVisible: showSelectColumn,
    },
  })

  // Add data columns based on configuration
  columnConfigs.forEach((config) => {
    const column: ColumnDef<T> = {
      id: config.id,
      header: config.header as string,
      accessorKey: config.accessorKey as string,
      size: config.size ?? 150,
      filterFn: config.filterFn ?? filterFn,
      enableHiding: config.enableHiding ?? true,
      enableSorting: config.enableSorting ?? true,
      ...config.meta,
    }

    // Apply cell renderer if provided
    if (config.cell) {
      column.cell = config.cell
    }

    columns.push(column)
  })

  const hasActions =
    !!actionConfig &&
    !!(
      actionConfig.render ||
      actionConfig.actions?.length ||
      actionConfig.viewFn ||
      actionConfig.deleteFn ||
      actionConfig.customActions?.length
    )

  // Add actions column if action config is provided
  if (hasActions) {
    columns.push({
      id: 'actions',
      header: () =>
        actionConfig?.header ?? (
          <div className='w-full flex justify-center'>
            <Icon
              name='chevron-down'
              className='size-4 dark:text-cyan-200/80 text-mac-blue/50'
            />
          </div>
        ),
      cell: ({row}) => <RowActions row={row} actionConfig={actionConfig} />,
      size: actionConfig?.columnSize ?? 0,
      enableHiding: false,
    })
  }

  return columns
}

// Fake change event for TanStack table toggle handlers (expect e.target.checked)
const fakeChangeEvent = (checked: boolean): ChangeEvent<HTMLInputElement> =>
  ({target: {checked}}) as ChangeEvent<HTMLInputElement>

// Select all checkbox component for table header.
// Subscribes to the selection search param so it re-renders when the URL
// changes; derives isSome/isAll from param + current page row IDs.
function SelectAllCheckbox<T>({
  table,
  isVisible,
}: {
  table: Table<T>
  isVisible: boolean
}) {
  const rowSelectionParser = useMemo(() => createRowSelectionParser(), [])
  const [rowSelectionParam] = useQueryState('selected', rowSelectionParser)
  const selection = (rowSelectionParam ?? {}) as RowSelectionState

  const pageRowIds = table.getRowModel().rows.map((r) => r.id)
  const selectedOnPage = pageRowIds.filter((id) => selection[id] === true)
  const isAll =
    pageRowIds.length > 0 && selectedOnPage.length === pageRowIds.length
  const isSome =
    selectedOnPage.length > 0 && selectedOnPage.length < pageRowIds.length

  return (
    <AnimatePresence mode='wait'>
      {isVisible && (
        <motion.div
          initial={{opacity: 0.2, x: -1}}
          animate={{opacity: 1, x: 3}}
          className={cn('w-10 md:w-11 flex justify-center items-center')}>
          <Checkbox.Root
            checked={isAll}
            indeterminate={isSome}
            onCheckedChange={(checked) => {
              const handler = table.getToggleAllPageRowsSelectedHandler()
              handler(fakeChangeEvent(!!checked))
            }}
            className='w-4 h-4 rounded-[2.75px] bg-sidebar flex justify-center items-center'>
            <Icon
              name={
                isSome
                  ? 'minus'
                  : isAll
                    ? 'checkbox-checked'
                    : 'checkbox-unchecked'
              }
              className={cn('size-7 shrink-0', {
                'dark:text-amber-400 text-amber-500': isSome,
                'text-foreground size-5': isAll,
                'rotate-0 size-5 text-foreground': !isAll && !isSome,
              })}
            />
          </Checkbox.Root>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Select row checkbox component for table cells
const SelectRowCheckbox = <T,>({
  row,
  isVisible,
}: {
  row: Row<T>
  isVisible: boolean
}) => {
  const [rowSelectionParam, setRowSelectionParam] = useQueryState(
    'selected',
    createRowSelectionParser(),
  )

  const isChecked = useMemo(
    () => (rowSelectionParam ?? {})[row.id] === true,
    [row.id, rowSelectionParam],
  )

  const handleCheckedChange = (checked: boolean) => {
    const currentSelection = rowSelectionParam ?? {}
    const nextSelection = {...currentSelection}

    if (checked) {
      nextSelection[row.id] = true
    } else {
      delete nextSelection[row.id]
    }

    setRowSelectionParam(nextSelection)
  }

  return (
    <AnimatePresence mode='wait'>
      {isVisible && (
        <motion.div
          initial={{scale: 1, x: 10}}
          animate={{scale: 1, x: 10}}
          className={cn('w-6 flex items-center justify-center')}>
          <Checkbox.Root
            checked={isChecked}
            disabled={!row.getCanSelect()}
            onCheckedChange={handleCheckedChange}
            className={cn('w-6 flex justify-center items-center')}>
            <Icon
              name={isChecked ? 'check' : 'checkbox-unchecked'}
              className={cn('h-5 rounded-sm', {
                'bg-dark-gray dark:bg-mac-blue/80 opacity-100 text-background dark:text-white':
                  isChecked,
              })}
            />
          </Checkbox.Root>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
