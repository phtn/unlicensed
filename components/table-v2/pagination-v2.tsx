import {Icon} from '@/lib/icons'
import {Button} from '@heroui/react'
import {PaginationState} from '@tanstack/react-table'
import {useId, useMemo} from 'react'

const DEFAULT_PAGE_SIZES = [10, 15, 25, 50, 100] as const

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
  const pageSizeOptions = useMemo(() => {
    const current = state.pageSize
    const inDefaults = DEFAULT_PAGE_SIZES.some((s) => s === current)
    return inDefaults
      ? [...DEFAULT_PAGE_SIZES]
      : [...DEFAULT_PAGE_SIZES, current].sort((a, b) => a - b)
  }, [state.pageSize])

  return (
    <div className='z-10 flex-1 grow-0 flex bg-linear-to-r from-transparent via-sidebar to-transparent items-center justify-between md:py-2 border-0 border-gray-800'>
      {/* Results per page */}
      <div className='flex items-center md:justify-between md:w-fit md:space-x-8 space-x-2 px-6 md:px-6'>
        <label
          htmlFor={id}
          className='font-clash tracking-tight text-sm md:text-base'>
          <span className='font-medium'>{rowCount}</span>
          <span className='opacity-80 ml-1 font-ios tracking-tighter'>
            items
          </span>
        </label>
        <div className='flex items-center dark:hover:bg-background/10 dark:focus-visible:bg-background/15 md:px-3 py-1.5 rounded-lg md:space-x-1 w-fit'>
          <label
            htmlFor='showing-rows'
            className='font-okxs tracking-tight md:mx-auto flex items-center'>
            <select
              id='showing-rows'
              value={state.pageSize.toString()}
              onChange={(event) => {
                setPageSize(event.target.value)
              }}
              aria-label='Rows per page'
              className='min-h-0 bg-transparent md:h-auto py-1 md:px-2 border-none shadow-none min-w-20 whitespace-nowrap font-clash font-medium outline-none'>
              {pageSizeOptions.map((size) => (
                <option key={size.toString()} value={size.toString()}>
                  {size}
                </option>
              ))}
            </select>
            <span className='opacity-80 font-ios text-sm md:text-base mr-2'>
              rows
            </span>
          </label>
        </div>
      </div>
      {/* Page number information */}
      <div className='hidden _flex px-2 md:px-4 text-muted-foreground grow justify-end text-sm whitespace-nowrap'>
        <p
          className='text-muted-foreground text-sm whitespace-nowrap'
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
          variant='tertiary'
          isIconOnly
          onPress={pageControl.gotoPrev}
          isDisabled={pageControl.disabledPrev}
          className='aspect-square size-8 aria-disabled:pointer-events-none aria-disabled:opacity-30'
          aria-label='Go to previous page'>
          <Icon name='chevron-left' className='size-4' />
        </Button>
        <Button
          variant='tertiary'
          isIconOnly
          onPress={pageControl.gotoNext}
          isDisabled={pageControl.disabledNext}
          className='aspect-square size-8 aria-disabled:pointer-events-none aria-disabled:opacity-30'
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
