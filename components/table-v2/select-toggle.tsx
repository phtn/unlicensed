import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Toolbar} from '@base-ui/react'
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
        'relative flex h-7 items-center justify-center rounded-sm space-x-2 px-3.5 text-sm select-none bg-gray-100/5 data-pressed:bg-gray-100 focus-visible:bg-none focus-visible:outline-2 focus-visible:-outline-offset-1 active:bg-light-gray/30 dark:active:bg-dark-table/30 dark:hover:bg-dark-table/50 dark:bg-transparent',
        {'bg-dark-table/15 dark:bg-dark-table/50 shadow-inner': on},
      )}
      onClick={toggleFn}>
      {/* -top-1.5 md:-top-0.5 left-full -translate-x-3.5 md:-translate-1/2*/}
      {selectedCount > 0 && (
        <div className='absolute font-oksx font-semibol flex items-center justify-center border border-background _dark:border-background text-background -right-4.5 -top-1.25 z-50 pointer-events-none select-none rounded-sm size-5 aspect-square bg-foreground font-brk'>
          <span>{selectedCount > 99 ? '99+' : selectedCount}</span>
        </div>
      )}
      <Icon
        name={'checkbox-indeterminate-2'}
        className={cn('size-4', on ? 'text-mac-blue opacity-100' : ' ')}
      />
      {/*<span className='hidden md:flex text-sm opacity-80 font-brk'>Select</span>*/}
    </Toolbar.Button>
  )
}
