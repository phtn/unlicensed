'use client'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Toolbar} from '@base-ui/react'
import {Menu} from '@base-ui/react/menu'
import {Badge} from '@heroui/react'
import {Column} from '@tanstack/react-table'
import {ComponentProps, useMemo} from 'react'

interface Props<T> {
  cols: Column<T, unknown>[]
  isMobile: boolean
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
export const ColumnView = <T,>({cols, isMobile}: Props<T>) => {
  // Filter columns where enableHiding is true (default is true, so filter out false)
  const hideableColumns = useMemo(() => {
    return cols.filter((col) => col.getCanHide())
  }, [cols])

  const invisibleColumns = hideableColumns.filter((col) => !col.getIsVisible())
  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <Toolbar.Button className='flex h-8 items-center justify-center rounded-sm space-x-2 px-4 select-none focus-visible:bg-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 dark:hover:bg-gray-100/5'>
            {invisibleColumns.length > 0 && (
              <Badge className='absolute bg-orange-400 dark:bg-orange-500 font-okxs rounded-full -top-1.5 md:-top-0.5 left-full -translate-x-3.5 md:-translate-1/2 size-5 aspect-square px-1'>
                {invisibleColumns.length > 99 ? '99+' : invisibleColumns.length}
              </Badge>
            )}
            <Icon
              name='tweak'
              className={cn('size-4 opacity-70', {
                'text-orange-500 opacity-100': invisibleColumns.length > 0,
              })}
            />
            <span className='hidden md:flex tracking-wider opacity-80 text-sm font-brk'>
              View
            </span>
          </Toolbar.Button>
        }>
        Workspace <ChevronDownIcon className='-mr-1' />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className='outline-none' sideOffset={8}>
          <Menu.Popup className='origin-(--transform-origin) rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300'>
            <Menu.Arrow className='data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180'>
              <ArrowSvg />
            </Menu.Arrow>
            <div className='flex items-center space-x-1.5 italic capitalize'>
              <Icon
                name='arrow-swap'
                className='size-4 rounded-full bg-zinc-400/80 dark:bg-background -rotate-55 text-white dark:opacity-60'
              />
              <span className='opacity-60'>Toggle columns</span>
            </div>
            {hideableColumns.map((column) => {
              const headerText = getColumnHeaderText(column)
              return (
                <Menu.CheckboxItem
                  key={column.id}
                  className={cn(
                    'text-xs h-10 md:h-12 opacity-60 italic',
                    column.getIsVisible() && 'opacity-100 not-italic',
                  )}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  onSelect={(event) => event.preventDefault()}>
                  {headerText}
                </Menu.CheckboxItem>
              )
            })}

            <Button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                hideableColumns.forEach((col) => col.toggleVisibility(true))
              }}
              className='w-full tracking-tight font-medium font-figtree rounded-2xl hover:bg-origin dark:hover:bg-origin/20 hover:border-origin dark:hover:border-origin/80 h-12'>
              Reset
            </Button>
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
        className='fill-[canvas]'
      />
      <path
        d='M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z'
        className='fill-gray-200 dark:fill-none'
      />
      <path
        d='M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z'
        className='dark:fill-gray-300'
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
