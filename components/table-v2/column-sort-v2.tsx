import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import type {CoreHeader, Renderable} from '@tanstack/react-table'
import type {JSX, ReactNode} from 'react'

interface Props<TData, TValue> {
  header: CoreHeader<TData, TValue>
  flexRender: <T extends object>(
    Comp: Renderable<T>,
    props: T,
  ) => ReactNode | JSX.Element
}
export const ColumnSort = <TData, TValue>({
  header,
  flexRender,
}: Props<TData, TValue>) => {
  const handleSort = () => {
    return header.column.toggleSorting()
  }

  return header.isPlaceholder ? null : header.column.getCanSort() ? (
    <div
      className={cn(
        header.column.getCanSort() &&
          'flex h-full cursor-pointer items-center gap-1.5 select-none',
      )}
      onClick={handleSort}
      onKeyDown={(e) => {
        // Enhanced keyboard handling for sorting
        if (
          header.column.getCanSort() &&
          (e.key === 'Enter' || e.key === ' ')
        ) {
          e.preventDefault()
          handleSort()
        }
      }}
      tabIndex={header.column.getCanSort() ? 0 : undefined}>
      {flexRender(header.column.columnDef.header, header.getContext())}
      {{
        asc: (
          <Icon
            solid
            aria-hidden='true'
            name='arrow-up-long'
            className='size-3 shrink-0 dark:text-teal-500 text-teal-600 dark:opacity-90'
          />
        ),
        desc: (
          <Icon
            solid
            aria-hidden='true'
            name='arrow-down-long'
            className='size-3 translate-y-0 drop-shadow-xs shrink-0 text-amber-500 dark:text-amber-300/80 dark:opacity-90'
          />
        ),
      }[header.column.getIsSorted() as string] ?? null}
    </div>
  ) : (
    flexRender(header.column.columnDef.header, header.getContext())
  )
}
