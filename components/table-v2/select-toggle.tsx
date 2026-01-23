import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Toolbar} from '@base-ui/react'
import {Badge} from '@heroui/react'
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
    <Toolbar.Button
      className={cn(
        'flex h-8 items-center justify-center rounded-sm space-x-2 px-3.25 text-sm select-none bg-gray-100/5 data-pressed:bg-gray-100 focus-visible:bg-none focus-visible:outline-2 focus-visible:-outline-offset-1 active:bg-light-gray/30',
        {'bg-light-gray/20 dark:bg-dark-table': on},
      )}
      onClick={toggleFn}>
      {selectedCount > 0 && (
        <Badge className='absolute z-50 pointer-events-none select-none rounded-full -top-1.5 md:-top-0.5 left-full -translate-x-3.5 md:-translate-1/2 size-5 aspect-square px-1 text-white font-space'>
          {selectedCount > 99 ? '99+' : selectedCount}
        </Badge>
      )}
      <Icon
        name={'checkbox-indeterminate-2'}
        className={cn(
          'size-4',
          on ? 'text-mac-blue opacity-100' : ' opacity-70',
        )}
      />
      {/*<span className='hidden md:flex text-sm opacity-80 font-brk'>Select</span>*/}
    </Toolbar.Button>
  )
}
