import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Toolbar} from '@base-ui/react'
import {Badge} from '@heroui/react'
import {Column, VisibilityState} from '@tanstack/react-table'
import {useCallback, useMemo} from 'react'

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
  isMobile,
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

  const handleReset = useCallback(() => {
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(() => ({}))
    } else {
      hideableColumns.forEach((col) => col.toggleVisibility(true))
    }
  }, [onColumnVisibilityChange, hideableColumns])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Toolbar.Button className='flex h-9 font-okxs font-semibold items-center justify-center rounded-sm space-x-2 px-4 text-sm text-gray-600 select-none hover:bg-gray-100 focus-visible:bg-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-pressed:bg-gray-100 data-pressed:text-gray-900'>
          {invisibleColumns.length > 0 && (
            <Badge className='absolute bg-orange-400 dark:bg-orange-500 rounded-full -top-1.5 md:-top-0.5 left-full -translate-x-3.5 md:-translate-1/2 size-5 aspect-square px-1 text-white font-space'>
              {invisibleColumns.length > 99 ? '99+' : invisibleColumns.length}
            </Badge>
          )}
          <Icon
            name='eye'
            className={cn('size-4 md:size-4 opacity-60', {
              'text-orange-500 opacity-100': invisibleColumns.length > 0,
            })}
          />
          <span className='hidden md:flex text-xs font-brk'>View</span>
        </Toolbar.Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isMobile ? 'end' : 'start'}
        className='bg-dark-origin dark:bg-dark-origin p-3 rounded-3xl min-w-44'>
        <DropdownMenuLabel className='flex items-center space-x-1.5 italic capitalize'>
          <Icon
            name='arrow-swap'
            className='size-4 rounded-full bg-zinc-400/80 dark:bg-background -rotate-55 text-white dark:opacity-60'
          />
          <span className='opacity-60'>Toggle columns</span>
        </DropdownMenuLabel>
        <div className='h-0.5 bg-origin/50 my-2' />
        {hideableColumns.map((column) => {
          const headerText = getColumnHeaderText(column)
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className={cn(
                'text-xs h-10 md:h-12 opacity-60 italic',
                column.getIsVisible() && 'opacity-100 not-italic',
              )}
              checked={column.getIsVisible()}
              onCheckedChange={(value) =>
                handleToggle(column.id, value === true)
              }
              onSelect={(event) => event.preventDefault()}>
              {headerText}
            </DropdownMenuCheckboxItem>
          )
        })}
        {/*<DropdownMenuSeparator className='dark:bg-origin/30' />*/}
        <Button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleReset()
          }}
          className='w-full tracking-tight font-medium font-figtree rounded-2xl hover:bg-origin dark:hover:bg-origin/20 hover:border-origin dark:hover:border-origin/80 h-12'>
          Reset
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
