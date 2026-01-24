import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@base-ui/react/button'
import {Row} from '@tanstack/react-table'
import {useCallback, useState} from 'react'

interface DeleteButtonProps<T> {
  rows: Row<T>[]
  onDelete: (ids: string[]) => void | Promise<void>
  idAccessor: keyof T
  disabled?: boolean
}

export const DeleteButton = <T,>({
  rows,
  onDelete,
  idAccessor,
  disabled = false,
}: DeleteButtonProps<T>) => {
  const [loading, setLoading] = useState(false)
  const selectedCount = rows.filter((row) => row.getIsSelected()).length
  const hasSelection = selectedCount > 0

  const handleDelete = useCallback(() => {
    if (!hasSelection) return
    setLoading(true)

    const selectedIds = rows
      .filter((row) => row.getIsSelected())
      .map((row) => {
        const value = row.original[idAccessor]
        return typeof value === 'string' ? value : String(value)
      })

    if (selectedIds.length > 0) {
      onDelete(selectedIds)
    }
  }, [rows, onDelete, idAccessor, hasSelection])

  if (!hasSelection) {
    return null
  }

  return (
    <Button
      className='flex items-center space-x-1 relative shadow-inner bg-dark-table/10 dark:bg-dark-table/50 rounded-sm select-none h-7.5 ps-1 md:ps-2 aspect-square'
      onClick={handleDelete}
      disabled={disabled || !hasSelection}>
      <Icon
        name={loading ? 'spinners-ring' : 'disconnect'}
        className={cn('size-4 text-mac-red dark:text-red-400', {
          'opacity-50': disabled || !hasSelection,
        })}
      />
      <span className='hidden md:flex text-xs md:pr-3 font-brk uppercase'>
        Delete
      </span>
      {selectedCount > 0 && (
        <div className='absolute font-oksx font-semibol flex items-center justify-center border border-background _dark:border-background text-background -right-2.5 -top-1.25 z-50 pointer-events-none select-none rounded-sm size-5 aspect-square bg-foreground font-brk'>
          <span>{selectedCount > 99 ? '99+' : selectedCount}</span>
        </div>
      )}
    </Button>
  )
}
