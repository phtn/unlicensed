import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatDate} from '@/utils/date'
import {formatPrice} from '@/utils/formatPrice'
import {Button} from '@heroui/react'

export const textCell = (value: string) => {
  return (
    <div className='flex flex-col'>
      <p className='text-bold text-sm'>{value}</p>
    </div>
  )
}

export const dateCell = (value: number) => {
  return (
    <div className='flex flex-col'>
      <p className='text-bold text-sm'>{formatDate(value)}</p>
    </div>
  )
}

export const moneyCell = (value: number) => {
  return (
    <div className='w-fit flex flex-col items-end'>
      <p className='font-semibold text-sm font-space'>{formatPrice(value)}</p>
    </div>
  )
}

export const actionsCell = (selected: boolean, fn: VoidFunction) => {
  return (
    <div className='relative w-fit flex items-center justify-center'>
      <Button
        size='sm'
        isIconOnly
        variant='light'
        className={cn('text-xs text-foreground/60 font-space', {
          'text-primary': selected,
        })}
        onPress={fn}>
        <Icon name='details' className='size-5' />
      </Button>
    </div>
  )
}
