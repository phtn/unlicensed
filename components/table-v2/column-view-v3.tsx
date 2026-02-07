'use client'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@base-ui/react'
import {Menu} from '@base-ui/react/menu'
import {Column, VisibilityState} from '@tanstack/react-table'
import {ComponentProps, useCallback, useMemo} from 'react'

interface Props<T> {
  cols: Column<T, unknown>[]
  isMobile: boolean
  onColumnVisibilityChange?: (
    updater: VisibilityState | ((old: VisibilityState) => VisibilityState),
  ) => void
}

// Helper function to extract header text from column definition
const getColumnHeaderText = <T,>(column: Column<T, unknown>): string => {
  const header = column.columnDef.header

  // If header is a string, use it directly
  if (typeof header === 'string') {
    return header
  }

  // If header is a function, try to extract meaningful text
  if (typeof header === 'function') {
    // For function headers, use the column ID as fallback
    // Convert camelCase or kebab-case to readable format
    return formatColumnId(column.id)
  }

  // For ReactNode headers, use formatted column ID
  return formatColumnId(column.id)
}

// Format column ID to readable text (e.g., "createdAt" -> "Created At")
const formatColumnId = (id: string): string => {
  return id
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
export const ColumnView = <T,>({
  cols,
  onColumnVisibilityChange,
}: Props<T>) => {
  // Filter columns where enableHiding is true (default is true, so filter out false)
  const hideableColumns = useMemo(() => {
    return cols.filter((col) => col.getCanHide())
  }, [cols])

  const invisibleColumns = hideableColumns.filter((col) => !col.getIsVisible())

  const handleToggle = useCallback(
    (columnId: string, nextVisible: boolean) => {
      if (onColumnVisibilityChange) {
        onColumnVisibilityChange((old) => ({...old, [columnId]: nextVisible}))
      } else {
        const col = hideableColumns.find((c) => c.id === columnId)
        col?.toggleVisibility(nextVisible)
      }
    },
    [onColumnVisibilityChange, hideableColumns],
  )

  return (
    <Menu.Root>
      <Menu.Trigger
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
            {invisibleColumns.length > 0 ? (
              <span className=' bg-orange-500 dark:bg-orange-400 text-white w-5 -ml-1 rounded-sm font-okxs font-semibold min-w-3.5'>
                {invisibleColumns.length > 99 ? '99+' : invisibleColumns.length}
              </span>
            ) : (
              <Icon name='switches' className={cn('size-4 dark:opacity-80')} />
            )}

            <span className='hidden md:flex tracking-wider opacity-80 text-sm font-brk'>
              Columns
            </span>
          </Button>
        }>
        <ChevronDownIcon className='-mr-1' />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align='start' className='outline-none' sideOffset={2}>
          <Menu.Popup className='origin-(--transform-origin) w-64 rounded-xl py-1 bg-sidebar dark:bg-dark-table dark:text-zinc-200  outline-gray-200 border border-dark-gray/30 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none'>
            <div className='flex items-center border-b border-dashed border-dark-gray/25 dark:border-zinc-800 px-4 py-1 capitalize'>
              <span className='text-sm font-okxs font-medium'>
                Toggle columns
              </span>
            </div>
            <div className='p-2'>
              {hideableColumns.map((column) => {
                const headerText = getColumnHeaderText(column)
                return (
                  <Menu.CheckboxItem
                    key={column.id}
                    className={cn(
                      'flex items-center justify-between px-3 text-xs rounded-sm h-8 ',
                      'hover:bg-dark-table/10 dark:hover:bg-origin/40 dark:hover:text-orange-300 text-origin',
                      'bg-orange-300',
                      column.getIsVisible() &&
                        'opacity-100 not-italic bg-transparent dark:text-white dark:bg-transparent',
                    )}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      handleToggle(column.id, value === true)
                    }
                    onSelect={(event) => event.preventDefault()}>
                    <span>{headerText}</span>
                    <Icon
                      name={column.getIsVisible() ? 'check' : 'eye-close'}
                      className={cn('size-4')}
                    />
                  </Menu.CheckboxItem>
                )
              })}
            </div>
            {/*<Button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                hideableColumns.forEach((col) => col.toggleVisibility(true))
              }}
              className='hidden w-full tracking-tight font-medium font-figtree hover:bg-mac-blue/50 dark:hover:bg-origin/20 hover:border-origin dark:hover:border-origin/80 h-10'>
              Reset
            </Button>*/}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

function ArrowSvg(props: ComponentProps<'svg'>) {
  return (
    <svg width='20' height='10' viewBox='0 0 20 10' fill='none' {...props}>
      <path
        d='M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z'
        className='fill-sidebar dark:fill-dark-table'
      />
      <path
        d='M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z'
        className='fill-dark-gray/40 dark:fill-dark-table'
      />
      <path
        d='M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z'
        className='dark:fill-dark-table'
      />
    </svg>
  )
}

function ChevronDownIcon(props: ComponentProps<'svg'>) {
  return (
    <svg width='10' height='10' viewBox='0 0 10 10' fill='none' {...props}>
      <path d='M1 3.5L5 7.5L9 3.5' stroke='currentcolor' strokeWidth='1.5' />
    </svg>
  )
}

function CheckIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      fill='currentcolor'
      width='10'
      height='10'
      viewBox='0 0 10 10'
      {...props}>
      <path d='M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z' />
    </svg>
  )
}
