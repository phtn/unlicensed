import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Input} from '@heroui/react'
import {Column} from '@tanstack/react-table'
import {
  ChangeEvent,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react'

interface Props<T> {
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  value: string
  col?: Column<T, unknown>
}

const inputClassNames = {
  // label: 'mb-4 pl-0.5 opacity-80 font-medium tracking-widest uppercase text-sm',
  input:
    'text-blue-500 dark:text-white text-base font-semibold placeholder:text-slate-500/60 placeholder:font-normal dark:placeholder:text-slate-500 selection:bg-blue-400 selection:text-white outline-none ring-0',
  inputWrapper:
    'hover:border shadow-none border-light-gray/50 dark:border-black/20 bg-light-gray/10 dark:bg-black/60 data-focus:border-blue-500 dark:data-hover:border-blue-500 rounded-lg p-2 outline-none min-h-10 w-full',
  innerWrapper: 'px-0.5',
}

export const Search = forwardRef<HTMLInputElement, Props<string | number>>(
  ({col, value, onChange}, ref) => {
    const getFilterValue = col?.getFilterValue
    const handlerRef = useRef<((event: KeyboardEvent) => void) | null>(null)
    const id = useId()

    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        // Don't trigger if user is typing in an input or textarea
        const target = event.target as HTMLElement
        const isTyping =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable

        if (
          event.key === '/' &&
          !isTyping &&
          ref &&
          'current' in ref &&
          ref.current &&
          document.activeElement !== ref.current
        ) {
          event.preventDefault()
          ref.current.focus()
        }
      },
      [ref],
    )

    useEffect(() => {
      handlerRef.current = handleKeyDown
    }, [handleKeyDown])

    useEffect(() => {
      const handler = (event: KeyboardEvent) => {
        handlerRef.current?.(event)
      }

      document.addEventListener('keydown', handler, true)
      return () => document.removeEventListener('keydown', handler, true)
    }, [])

    return (
      <div className='relative'>
        <Input
          id={`input-${id}`}
          ref={ref}
          type='text'
          className={cn(
            'peer md:h-7.5 dark:bg-background/40 w-48 md:min-w-60 bg-dark-origin ps-3 rounded-sm border-none',
            '',
            Boolean(getFilterValue) && 'pe-10',
          )}
          classNames={inputClassNames}
          value={value}
          onChange={onChange}
          placeholder='Search'
          aria-label='Search'
          spellCheck='false'
          autoComplete='off'
        />
        <div className='text-foreground/80 pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 peer-disabled:opacity-50'>
          <Icon
            name='search'
            aria-hidden='true'
            className='size-6 md:opacity-20 opacity-0'
          />
        </div>
        {Boolean(col?.getFilterValue()) && (
          <button
            className='hidden text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 _flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
            aria-label='Clear filter'
            onClick={() => {
              col?.setFilterValue('')
              if (ref && 'current' in ref && ref.current) {
                ref.current.focus()
              }
            }}>
            <Icon name='alert-rhombus' className='size-4' aria-hidden='true' />
          </button>
        )}
      </div>
    )
  },
)

Search.displayName = 'Search'
