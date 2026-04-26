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
  showSelectColumn,
}: RenderRowProps<T>) => {
  // const rowSelectionParser = useMemo(() => createRowSelectionParser(), [createRowSelectionParser])
  const [rowSelectionParam, setRowSelectionParam] = useQueryState(
    'selected',
    createRowSelectionParser(),
  )

  const isEditing = editingRowId === row.id
  const isPinned = row.getIsPinned() === 'top'

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
      // data-state={row.getIsSelected() && 'selected'}
      className={cn(
        'group/row h-10 text-foreground border-y border-y-dotted dark:border-greyed dark:hover:bg-background/80 active:bg-background/20',
        'bg-sidebar/5 hover:bg-sidebar border-y-dark-table/10 dark:border-y-dark-table/40 hover:border-y-dark-table/30 transition-colors duration-75',
        {
          // Apply editing styles - same as hover but persistent
          'dark:bg-blue-200/50 last:rounded-tr-2xl': isEditing,
          // Apply selected styles when viewer is open - same as hover but persistent
          ' border-y-dark-table/30 bg-sidebar hover:bg-sidebar dark:bg-mac-blue/20 last:rounded-tr-2xl':
            isSelected && !isEditing,
          'border-y-light-gray bg-sky-300/20 hover:bg-brand/10 dark:border-y-sky-300/15 dark:bg-background/20 dark:hover:bg-background/30':
            isPinned && !isEditing && !isSelected,
          // Add cursor pointer when select mode is on
          'cursor-pointer': showSelectColumn && row.getCanSelect(),
        },
      )}
      onClick={handleRowClick}>
      {row
        .getAllCells()
        .filter((cell) => cell.column.getIsVisible())
        .map((cell) => (
          <RenderCell
            key={cell.id}
            cell={cell}
            isEditing={isSelected || showSelectColumn}
          />
        ))}
    </TableRow>
  )
}
