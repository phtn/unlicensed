import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Input} from '@base-ui/react'
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

export const Search = forwardRef<HTMLInputElement, Props<unknown>>(
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
          className={cn(
            'peer md:h-8 dark:bg-background/40 w-48 md:min-w-60 bg-sidebar ps-3 rounded-sm outline-0 border-none placeholder:text-foreground/60 placeholder:font-brk font-brk text-sm',
            Boolean(getFilterValue) && 'pe-10',
          )}
          value={value}
          onChange={onChange}
          placeholder='Search ...'
          type='text'
          inputMode='text'
          aria-label='Search'
        />
        <div className='text-foreground/80 pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-2 peer-disabled:opacity-50'>
          <Icon name='slash' aria-hidden='true' className='size-5 opacity-80' />
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
            <Icon name='x' size={16} aria-hidden='true' />
          </button>
        )}
      </div>
    )
  },
)

Search.displayName = 'SearchFilter'
