import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Badge, Button} from '@heroui/react'
import {Row} from '@tanstack/react-table'

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
  const selectedCount = rows.filter((row) => row.getIsSelected()).length

  return (
    <Button
      variant='flat'
      className='relative data-[state=open]:bg-origin/60 rounded-sm border -space-x-px select-none h-7.5 ps-1 aspect-square'
      onPress={toggleFn}>
      {selectedCount > 0 && (
        <Badge className='absolute z-50 pointer-events-none select-none rounded-full -top-1.5 md:-top-0.5 left-full -translate-x-3.5 md:-translate-1/2 size-5 aspect-square px-1 text-white font-space'>
          {selectedCount > 99 ? '99+' : selectedCount}
        </Badge>
      )}
      <Icon
        name={'check-ring-light'}
        className={cn(' md:size-5 size-4', on ? 'text-primary' : 'opacity-40')}
      />
      <span className='hidden md:flex'>Select</span>
    </Button>
  )
}
