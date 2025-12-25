'use client'

import {Badge, Button, Dropdown, DropdownItem, DropdownMenu as HeroUIDropdownMenu, DropdownTrigger} from '@heroui/react'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Column} from '@tanstack/react-table'
import {useMemo, Fragment} from 'react'

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

  // Create all menu items in useMemo to avoid array type issues
  const menuItems = useMemo(() => {
    const items: React.ReactElement[] = [
      <DropdownItem
        key='label'
        isReadOnly
        className='flex items-center space-x-1.5 italic capitalize h-auto py-2'>
        <Icon
          name='arrow-swap'
          className='size-4 rounded-full bg-zinc-400/80 dark:bg-background -rotate-55 text-white dark:opacity-60'
        />
        <span className='opacity-60'>Toggle columns</span>
      </DropdownItem>,
      <DropdownItem
        key='separator'
        isReadOnly
        className='h-0.5 bg-origin/50 my-2 p-0 min-h-0'
      />,
      ...hideableColumns.map((column) => {
        const headerText = getColumnHeaderText(column)
        return (
          <DropdownItem
            key={column.id}
            className={cn(
              'text-xs h-10 md:h-12 opacity-60 italic',
              column.getIsVisible() && 'opacity-100 not-italic',
            )}
            isSelected={column.getIsVisible()}
            onPress={() => column.toggleVisibility(!column.getIsVisible())}>
            {headerText}
          </DropdownItem>
        )
      }),
      <DropdownItem
        key='reset'
        onPress={() =>
          hideableColumns.forEach((col) => col.toggleVisibility(true))
        }
        className='w-full tracking-tight font-medium font-figtree rounded-2xl hover:bg-origin dark:hover:bg-origin/20 hover:border-origin dark:hover:border-origin/80 h-12'>
        Reset
      </DropdownItem>,
    ]
    return items
  }, [hideableColumns])

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant='flat'
          className='relative select-none font-sans md:aspect-auto aspect-square data-[state=open]:bg-origin/50'>
          {invisibleColumns.length > 0 && (
            <Badge className='absolute bg-orange-400 dark:bg-orange-500 rounded-full -top-1.5 md:-top-0.5 left-full -translate-x-3.5 md:-translate-1/2 size-5 aspect-square px-1 text-white font-space'>
              {invisibleColumns.length > 99 ? '99+' : invisibleColumns.length}
            </Badge>
          )}
          <Icon
            name='eye'
            className={cn('size-4 md:size-5 opacity-60', {
              'text-orange-500 opacity-100': invisibleColumns.length > 0,
            })}
          />
          <span className='hidden md:flex'>View</span>
        </Button>
      </DropdownTrigger>
      <HeroUIDropdownMenu
        aria-label='Toggle columns'
        className='bg-dark-origin dark:bg-dark-origin p-3 rounded-3xl min-w-44'>
        <Fragment>{menuItems}</Fragment>
      </HeroUIDropdownMenu>
    </Dropdown>
  )
}
