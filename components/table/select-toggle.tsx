import {Badge} from '@heroui/react'
import {Button} from '@heroui/react'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Row} from '@tanstack/react-table'
import {useCallback} from 'react'

interface SelectToggleProps<T> {
  on: boolean
  toggleFn: VoidFunction
  rows: Row<T>[]
}

export const SelectToggle = <T,>({
  on,
  toggleFn,
  rows,
}: SelectToggleProps<T>) => {
  const CountBadge = useCallback(() => {
    const selectedCount = rows.filter((row) => row.getIsSelected()).length
    if (on && selectedCount > 0) {
      return (
        <Badge className='absolute z-50 pointer-events-none select-none rounded-full -top-1.5 md:-top-0.5 left-full -translate-x-3.5 md:-translate-1/2 size-5 aspect-square px-1 text-white font-space'>
          {selectedCount > 99 ? '99+' : selectedCount}
        </Badge>
      )
    }
    return null
  }, [rows, on])
  return (
    <Button
      variant='flat'
      className='relative aspect-square select-none'
      onClick={toggleFn}>
      <CountBadge />
      <Icon
        name={'check-ring-light'}
        className={cn(' md:size-5 size-4', on ? 'text-primary' : 'opacity-40')}
      />
      <span className='hidden md:flex'>Select</span>
    </Button>
  )
}
