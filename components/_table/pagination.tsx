import {Button, Select, SelectItem} from '@heroui/react'
import {Icon} from '@/lib/icons'
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
    <div className='flex items-center justify-between'>
      {/* Results per page */}
      <div className='flex items-center space-x-8 px-6'>
        <label htmlFor={id} className='font-space tracking-tight'>
          <span className='font-semibold text-base'>{rowCount}</span>
          <span className='opacity-80'>items</span>
        </label>
        <div className='flex items-center dark:hover:bg-background/10 dark:focus-visible:bg-background/15 pl-3 py-1 rounded-lg space-x-1 dark:bg-dysto/20'>
          <label
            htmlFor={'showing-rows'}
            className='max-sm:sr-only font-space tracking-tight'>
            {/*<span className='font-semibold text-base'>{rowCount}</span>*/}
            <span className='opacity-80'>showing</span>
          </label>
          <Select
            selectedKeys={[state.pageSize.toString()]}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string
              if (selectedKey) {
                setPageSize(selectedKey)
              }
            }}
            placeholder='Select number of results'
            className='w-fit whitespace-nowrap font-space'>
            {[5, 10, 25, 50].map((pageSize) => (
              <SelectItem key={pageSize.toString()}>
                {pageSize ?? 10}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
      {/* Page number information */}
      <div className='px-4 text-muted-foreground flex grow justify-end text-sm whitespace-nowrap'>
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
      <div className='px-6 flex gap-3'>
        <Button
          variant='bordered'
          onPress={pageControl.gotoPrev}
          isDisabled={pageControl.disabledPrev}
          className='dark:bg-background/10 aspect-square size-8 p-0 aria-disabled:pointer-events-none aria-disabled:text-muted-foreground/50 border-[0.33px] dark:border-dark-origin/30 hover:bg-muted/50 dark:hover:bg-background/40 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.04),0_1px_1px_rgba(0,0,0,0.05),0_2px_2px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.05)] dark:inset-shadow-[0_1px_rgb(255_255_255/0.15)]'
          aria-label='Go to previous page'>
          <Icon name='chevron-left' className='size-4' />
        </Button>
        <Button
          variant='bordered'
          onPress={pageControl.gotoNext}
          isDisabled={pageControl.disabledNext}
          className='dark:bg-background/10 aspect-square size-8 p-0 aria-disabled:pointer-events-none aria-disabled:text-muted-foreground/50 border-[0.33px] dark:border-dark-origin/30 hover:bg-muted/50 dark:hover:bg-background/40 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.04),0_1px_1px_rgba(0,0,0,0.05),0_2px_2px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.05)] dark:inset-shadow-[0_1px_rgb(255_255_255/0.15)]'
          aria-label='Go to next page'>
          <Icon name='chevron-right' className='size-4' />
        </Button>
      </div>
    </div>
  )
}
