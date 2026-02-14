import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import type {CoreHeader, Renderable, SortingState} from '@tanstack/react-table'
import {useQueryState} from 'nuqs'
import type {JSX, ReactNode} from 'react'
import {useMemo} from 'react'
import {createSortingParser} from './parsers-v2'

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
  const sortingParser = useMemo(() => createSortingParser(), [])
  const [sortingParam, setSortingParam] = useQueryState('sort', sortingParser)
  const currentSort = sortingParam?.[0]
  const isActiveSortColumn = currentSort?.id === header.column.id
  const sorted = isActiveSortColumn
    ? currentSort?.desc
      ? 'desc'
      : 'asc'
    : false

  const handleSort = () => {
    if (!header.column.getCanSort()) return

    const nextSorting: SortingState = !isActiveSortColumn
      ? [{id: header.column.id, desc: false}]
      : [{id: header.column.id, desc: !(currentSort?.desc ?? false)}]

    setSortingParam(nextSorting)
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
      {sorted === 'asc' ? (
        <Icon
          aria-hidden='true'
          name='arrow-down'
          className='absolute size-4 shrink-0 text-teal-500 rotate-90 dark:opacity-90'
        />
      ) : sorted === 'desc' ? (
        <Icon
          aria-hidden='true'
          name='arrow-down'
          className='absolute left-2 size-4 shrink-0 text-amber-500 dark:opacity-90'
        />
      ) : null}
    </div>
  ) : (
    flexRender(header.column.columnDef.header, header.getContext())
  )
}
