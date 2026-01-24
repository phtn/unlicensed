import {cn} from '@/lib/utils'
import {Row, type RowSelectionState} from '@tanstack/react-table'
import {useQueryState} from 'nuqs'
import type {MouseEvent} from 'react'
import {useCallback, useMemo} from 'react'
import {TableRow} from '../ui/table'
import {createRowSelectionParser} from './parsers-v2'
import {RenderCell} from './render-cell'

interface RenderRowProps<T> {
  row: Row<T>
  editingRowId: string | null
  selectedItemId?: string | null
  showSelectColumn: boolean
}

export const RenderRow = <T,>({
  row,
  editingRowId,
  selectedItemId,
  showSelectColumn,
}: RenderRowProps<T>) => {
  // const rowSelectionParser = useMemo(() => createRowSelectionParser(), [createRowSelectionParser])
  const [rowSelectionParam, setRowSelectionParam] = useQueryState(
    'select',
    createRowSelectionParser(),
  )

  const isEditing = editingRowId === row.id

  const isSelected = useMemo(
    () => (rowSelectionParam ?? {})[row.id] === true,
    [row.id, rowSelectionParam],
  )

  const handleRowClick = useCallback(
    (e: MouseEvent<HTMLTableRowElement>) => {
      // Don't toggle selection if clicking on interactive elements
      if (
        e.target instanceof HTMLElement &&
        (e.target.closest('button') ||
          e.target.closest('input') ||
          e.target.closest('a') ||
          e.target.closest('[role="button"]'))
      ) {
        return
      }

      // Only toggle if select mode is on and row can be selected
      if (showSelectColumn && row.getCanSelect()) {
        const currentSelection = rowSelectionParam ?? {}
        const isCurrentlySelected = currentSelection[row.id] === true

        const nextSelection: RowSelectionState = {...currentSelection}

        if (isCurrentlySelected) {
          delete nextSelection[row.id]
        } else {
          nextSelection[row.id] = true
        }

        setRowSelectionParam(nextSelection)
      }
    },
    [row, rowSelectionParam, showSelectColumn, setRowSelectionParam],
  )

  return (
    <TableRow
      key={row.id}
      data-state={row.getIsSelected() && 'selected'}
      className={cn(
        'h-14 md:h-16 text-foreground text-xs md:text-base overflow-hidden dark:border-greyed group/row dark:hover:bg-background/40 border-b-origin/40',
        'peer-hover:border-transparent bg-transparent hover:last:rounded-tr-2xl hover:bg-light-gray/10 transition-colors duration-75',
        {
          // Apply editing styles - same as hover but persistent
          ' dark:bg-sky-600/40 last:rounded-tr-2xl': isEditing,
          // Apply selected styles when viewer is open - same as hover but persistent
          'dark:bg-background/40 bg-sidebar hover:bg-sidebar/80 last:rounded-tr-2xl':
            isSelected && !isEditing,
          // Add cursor pointer when select mode is on
          'cursor-pointer': showSelectColumn && row.getCanSelect(),
        },
      )}
      onClick={handleRowClick}>
      {row.getVisibleCells().map((cell) => (
        <RenderCell
          key={cell.id}
          cell={cell}
          isEditing={isSelected || showSelectColumn}
        />
      ))}
    </TableRow>
  )
}
