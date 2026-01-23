import {Icon} from '@/lib/icons'
import {Toggle} from '@base-ui/react/toggle'
import {ToggleGroup} from '@base-ui/react/toggle-group'

export const ViewStyleGroup = () => {
  return (
    <ToggleGroup
      defaultValue={['left']}
      className='flex gap-1.5 rounded-xs p-0.5'>
      <Toggle
        aria-label='Align left'
        value='left'
        className='flex h-5 w-6 items-center justify-center rounded-xs select-none focus-visible:bg-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 text-foreground/40 data-pressed:text-zinc-100'>
        <Icon name='view-list' className='size-4' />
      </Toggle>
      <Toggle
        aria-label='Align center'
        value='center'
        className='flex h-5 w-6 items-center justify-center rounded-xs select-none focus-visible:bg-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800  text-foreground/40 data-pressed:text-zinc-100'>
        <Icon name='grid-nine' className='size-4' />
      </Toggle>
      <Toggle
        aria-label='Align right'
        value='right'
        className='flex h-5 w-6 items-center justify-center rounded-xs select-none focus-visible:bg-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 text-foreground/40 data-pressed:text-zinc-100'>
        <Icon name='grid-four' className='size-4' />
      </Toggle>
    </ToggleGroup>
  )
}

function AlignLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      stroke='currentcolor'
      strokeLinecap='round'
      {...props}>
      <path d='M2.5 3.5H13.5' />
      <path d='M2.5 9.5H13.5' />
      <path d='M2.5 6.5H10.5' />
      <path d='M2.5 12.5H10.5' />
    </svg>
  )
}

function AlignCenterIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      stroke='currentcolor'
      strokeLinecap='round'
      {...props}>
      <path d='M3 3.5H14' />
      <path d='M3 9.5H14' />
      <path d='M4.5 6.5H12.5' />
      <path d='M4.5 12.5H12.5' />
    </svg>
  )
}

function AlignRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      stroke='currentcolor'
      strokeLinecap='round'
      {...props}>
      <path d='M2.5 3.5H13.5' />
      <path d='M2.5 9.5H13.5' />
      <path d='M5.5 6.5H13.5' />
      <path d='M5.5 12.5H13.5' />
    </svg>
  )
}
