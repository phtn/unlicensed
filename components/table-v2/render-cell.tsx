import {cn} from '@/lib/utils'
import {Cell, flexRender} from '@tanstack/react-table'
import {TableCell} from '../ui/table'

interface RenderCellProps<TData, TValue> {
  cell: Cell<TData, TValue>
  isEditing: boolean
}

export const RenderCell = <TData, TValue>({
  cell,
  isEditing,
}: RenderCellProps<TData, TValue>) => {
  const cellSize = cell.column.getSize()

  return (
    <TableCell
      key={cell.id}
      style={{
        width: `${cellSize}px`,
        minWidth: `${cellSize}px`,
        maxWidth: `${cellSize}px`,
      }}
      className={cn(
        'last:py-0 overflow-hidden',
        'transition-colors duration-300',
        {
          // Apply editing cell styles - same as hover but persistent
          'dark:bg-background/10': isEditing,
        },
      )}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  )
}
