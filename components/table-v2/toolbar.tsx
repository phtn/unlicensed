import {Select} from '@base-ui/react/select'
import {ToggleGroup} from '@base-ui/react/toggle-group'
import {Toolbar} from '@base-ui/react/toolbar'
import {ReactNode} from 'react'

interface CenterTableToolbarProps {
  filter: ReactNode
  view: ReactNode
}

export const CenterTableToolbar = ({filter, view}: CenterTableToolbarProps) => {
  return (
    <Toolbar.Root className='flex h-9 items-start justify-center w-full gap-px px-px pb-1'>
      <ToggleGroup className='flex items-start gap-1' aria-label='Alignment'>
        {filter}
        <Toolbar.Separator className='m-1 h-5 w-px bg-linear-to-b from-transparent via-gray-200 dark:via-zinc-500 to-transparent' />
        {view}
      </ToggleGroup>
      <Toolbar.Group
        className='flex gap-1'
        aria-label='Numerical format'></Toolbar.Group>
    </Toolbar.Root>
  )
}

interface RightTableToolbarProps {
  search: ReactNode
}

export const RightTableToolbar = ({search}: RightTableToolbarProps) => {
  return (
    <Toolbar.Root className='flex justify-end h-9 w-150 items-start gap-px pb-1 overflow-visible'>
      <ToggleGroup className='flex items-start' aria-label='Alignment'>
        {search}
      </ToggleGroup>
    </Toolbar.Root>
  )
}

interface LeftTableToolbarProps {
  select: ReactNode
  deleteRow: ReactNode
  views?: ReactNode
}

export const LeftTableToolbar = ({
  select,
  deleteRow,
}: LeftTableToolbarProps) => {
  return (
    <Toolbar.Root className='relative flex h-9 bg-transparent w-150 items-start gap-px px-1 py-0.5 overflow-visible'>
      <ToggleGroup
        className='relative flex items-center bg-transparent gap-4'
        aria-label='Alignment'>
        {select}
        {deleteRow}
      </ToggleGroup>
    </Toolbar.Root>
  )
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width='8'
      height='12'
      viewBox='0 0 8 12'
      fill='none'
      stroke='currentcolor'
      strokeWidth='1.5'
      {...props}>
      <path d='M0.5 4.5L4 1.5L7.5 4.5' />
      <path d='M0.5 7.5L4 10.5L7.5 7.5' />
    </svg>
  )
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      fill='currentcolor'
      width='10'
      height='10'
      viewBox='0 0 10 10'
      {...props}>
      <path d='M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z' />
    </svg>
  )
}

const SelectTool = () => (
  <Select.Root defaultValue='Helvetica'>
    <Toolbar.Button
      render={<Select.Trigger />}
      className='flex min-w-32 h-8 text-sm font-medium items-center justify-between gap-3 rounded-md pr-3 pl-3.5 text-gray-600 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 data-[popup-open]:bg-gray-100 cursor-default'>
      <Select.Value />
      <Select.Icon className='flex'>
        <ChevronUpDownIcon />
      </Select.Icon>
    </Toolbar.Button>
    <Select.Portal>
      <Select.Positioner className='outline-none select-none' sideOffset={8}>
        <Select.Popup className='group max-h-(--available-height) origin-(--transform-origin) overflow-y-auto rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-ending-style:scale-90 data-ending-style:opacity-0 data-[side=none]:data-ending-style:transition-none data-starting-style:scale-90 data-starting-style:opacity-0 data-[side=none]:data-starting-style:scale-100 data-[side=none]:data-starting-style:opacity-100 data-[side=none]:data-starting-style:transition-none dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300'>
          <Select.Item
            value='Helvetica'
            className='grid min-w-(--anchor-width) cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-1.5 pr-4 pl-2.5 leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:leading-4 data-highlighted:relative data-highlighted:z-0 data-highlighted:text-gray-50 data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:rounded-sm data-highlighted:before:bg-gray-900 pointer-coarse:py-2.5'>
            <Select.ItemIndicator className='col-start-1'>
              <CheckIcon className='size-3' />
            </Select.ItemIndicator>
            <Select.ItemText className='col-start-2 text-sm'>
              Helvetica
            </Select.ItemText>
          </Select.Item>
          <Select.Item
            value='Arial'
            className='grid min-w-(--anchor-width) cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-1.5 pr-4 pl-2.5 leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:leading-4 data-highlighted:relative data-highlighted:z-0 data-highlighted:text-gray-50 data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:rounded-sm data-highlighted:before:bg-gray-900 pointer-coarse:py-2.5'>
            <Select.ItemIndicator className='col-start-1'>
              <CheckIcon className='size-3' />
            </Select.ItemIndicator>
            <Select.ItemText className='col-start-2 text-sm'>
              Arial
            </Select.ItemText>
          </Select.Item>
        </Select.Popup>
      </Select.Positioner>
    </Select.Portal>
  </Select.Root>
)
