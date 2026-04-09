import {useMobile} from '@/hooks/use-mobile'
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
import {
  filterFn,
  globalFilterFn,
  groupFilter,
  multiSelectFilterFn,
} from './filter-fns'
import {createRowSelectionParser} from './parsers-v2'
import {RowActions} from './row-actions'
export {filterFn, globalFilterFn, groupFilter, multiSelectFilterFn}

// Column factory configuration interface
export interface BulkEditorOption {
  value: string
  label: string
}

export interface BulkEditorConfig<T> {
  enabled?: boolean
  type?: 'text' | 'number' | 'select'
  options?: BulkEditorOption[] | ((rows: T[]) => BulkEditorOption[])
  placeholder?: string
}

export interface ColumnMeta<T> extends Record<string, unknown> {
  filterOptions?: Array<string | number | boolean>
  bulkEditor?: boolean | BulkEditorConfig<T>
}

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
  enableFiltering?: boolean
  enableHiding?: boolean
  enableSorting?: boolean
  meta?: ColumnMeta<T>
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
      enableColumnFilter: config.enableFiltering ?? true,
      enableHiding: config.enableHiding ?? true,
      enableSorting: config.enableSorting ?? true,
      ...(config.meta && Object.keys(config.meta).length > 0
        ? {meta: config.meta}
        : {}),
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
              className='size-4 dark:text-cyan-200/80 text-blue-50'
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

  const isMobile = useMobile()

  return (
    <AnimatePresence mode='wait'>
      {isVisible && (
        <motion.div
          initial={{opacity: 0.2, x: isMobile ? -8 : 0}}
          animate={{opacity: 1, x: isMobile ? -4 : 2}}
          className={cn('w-9 md:w-10 flex justify-center items-center')}>
          <Checkbox.Root
            checked={isAll}
            indeterminate={isSome}
            onCheckedChange={(checked) => {
              const handler = table.getToggleAllPageRowsSelectedHandler()
              handler(fakeChangeEvent(!!checked))
            }}
            className='w-4 md:w-8 h-4 rounded-[2.75px] bg-sidebar flex justify-center items-center md:mr-4.5 md:ml-2'>
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

  const isMobile = useMobile()

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
          animate={{scale: 1, x: isMobile ? 3 : 9}}
          className={cn(
            'w-4 md:w-5 md:-ml-1 flex items-center justify-center',
          )}>
          <Checkbox.Root
            checked={isChecked}
            disabled={!row.getCanSelect()}
            onCheckedChange={handleCheckedChange}
            className={cn('w-6 flex justify-center items-center')}>
            <Icon
              name={isChecked ? 'check' : 'checkbox-unchecked'}
              className={cn('h-5 w-5 aspect-square rounded-sm', {
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
