import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@base-ui/react/button'
import {Select} from '@base-ui/react/select'
import {PaginationState} from '@tanstack/react-table'
import {useId} from 'react'

export interface PageControl {
  disabledNext: boolean
  disabledPrev: boolean
  gotoNext: VoidFunction
  gotoPrev: VoidFunction
  gotoFirst: VoidFunction
  gotoLast: VoidFunction
}

interface Props {
  state: PaginationState
  rowCount: number
  setPageSize: (v: string) => void
  pageControl: PageControl
}
export const Paginator = ({
  state,
  rowCount,
  setPageSize,
  pageControl,
}: Props) => {
  const id = useId()
  return (
    <div className='z-10 flex-1 grow-0 bg-background w-full border-t border-sidebar flex items-center justify-between py-1 md:py-2'>
      {/* Results per page */}
      <div className='flex items-center justify-between space-x-8 px-6'>
        <label htmlFor={id} className='font-space tracking-tight'>
          <span className='font-semibold text-base'>{rowCount}</span>
          <span className='opacity-80 ml-1'>Items</span>
        </label>
        <div className='flex items-center border border-greyed/40 dark:hover:bg-background/10 dark:focus-visible:bg-background/15 px-3 py-1 rounded-lg space-x-1 dark:bg-dysto/20'>
          <label
            htmlFor={'showing-rows'}
            className='max-sm:sr-only font-space tracking-tight mx-auto'>
            {/*<span className='font-semibold text-base'>{rowCount}</span>*/}

            <Select.Root
              value={state.pageSize.toString()}
              onValueChange={(value: string | null) => {
                if (value) setPageSize(value)
              }}>
              <Select.Trigger
                id='showing-rows'
                className='whitespace-nowrap font-space font-semibold'>
                <Select.Value placeholder='' />
              </Select.Trigger>
              <Select.Portal className='[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-4 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2'>
                {[10, 25, 50, 100].map((pageSize) => (
                  <Select.Item
                    className=''
                    key={pageSize}
                    value={pageSize.toString()}>
                    <span className='mr-2 font-semibold font-space'>
                      {pageSize ?? 10}
                    </span>
                  </Select.Item>
                ))}
              </Select.Portal>

              <span className='opacity-80 font-brk text-base[] ml-1'>Rows</span>
            </Select.Root>
          </label>
        </div>
      </div>
      {/* Page number information */}
      <div className='hidden _flex px-4 text-muted-foreground grow justify-end text-sm whitespace-nowrap'>
        <p
          className='hidden text-muted-foreground text-sm whitespace-nowrap'
          aria-live='polite'>
          <span className='text-foreground'>
            {state.pageIndex * state.pageSize + 1}-
            {Math.min(
              Math.max(state.pageIndex * state.pageSize + state.pageSize, 0),
              rowCount,
            )}
          </span>{' '}
          of <span className='text-foreground'>{rowCount}</span>
        </p>
      </div>

      {/* Pagination buttons */}
      <div className='px-4 flex items-center gap-3'>
        <Button
          onClick={pageControl.gotoPrev}
          disabled={pageControl.disabledPrev}
          className='aspect-square size-8 disabled:pointer-events-none disabled:opacity-30 disabled:shadow-none'
          aria-label='Go to previous page'>
          <Icon
            name='chevron-left'
            className={cn('size-4', {
              // 'opacity-50': pageControl.disabledPrev,
            })}
          />
        </Button>
        <Button
          onClick={pageControl.gotoNext}
          disabled={pageControl.disabledNext}
          className='aspect-square size-8 disabled:pointer-events-none disabled:opacity-30 disabled:shadow-none'
          aria-label='Go to next page'>
          <Icon name='chevron-right' className='size-4' />
        </Button>
      </div>
    </div>
  )
}

// const SelectRows = () => (
//   <Select
//           name={'rows'}
//           onValueChange={(value) => item.validators?.onChange(value)}>
//           <SelectTrigger
//             size='default'
//             className='min-h-14 h-fit py-4 md:py-4 cursor-pointer rounded-2xl dark:bg-background/25 bg-background border-[0.33px] border-gray-500/50 outline-none text-left w-full'>
//             <SelectValue
//               placeholder={item.placeholder ?? 'Select an option'}
//               className='text-neutral-200 h-full placeholder:text-base'
//             />
//           </SelectTrigger>
//           <SelectContent className='w-full rounded-2xl border-gray-400 [&_*[role=option]]:ps-3 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-4'>
//             <HyperList
//               data={item.options}
//               component={SelectFieldItem}
//               itemStyle='border-b border-origin/0 last:border-none'
//               keyId='value'
//             />
//           </SelectContent>
//         </Select>
// )
