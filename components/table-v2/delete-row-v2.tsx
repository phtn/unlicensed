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
      className='relative data-[state=open]:bg-origin/60 rounded-sm border -space-x-px select-none h-7.5 ps-1 aspect-square'
      onClick={handleDelete}
      disabled={disabled || !hasSelection}>
      <Icon
        name={loading ? 'spinners-ring' : 'disconnect'}
        className={cn('md:size-5 size-4 text-mac-red dark:text-red-500', {
          'opacity-50': disabled || !hasSelection,
        })}
      />
      <span className='hidden md:flex'>Delete</span>
      {selectedCount > 0 && (
        <span className='absolute z-50 pointer-events-none select-none rounded-full -top-1.5 md:-top-0.5 left-full -translate-x-3.5 md:-translate-1/2 size-5 aspect-square px-1 text-white font-space bg-mac-red flex items-center justify-center text-xs'>
          {selectedCount > 99 ? '99+' : selectedCount}
        </span>
      )}
    </Button>
  )
}
