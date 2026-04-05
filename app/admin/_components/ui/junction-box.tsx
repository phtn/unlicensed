import {ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {Card, Switch} from '@heroui/react'
import {useCallback} from 'react'

interface JunctionBoxProps {
  title: string
  onUpdate: (value: boolean) => void
  checked: boolean
  description?: string
  className?: ClassName
}
export const JunctionBox = ({
  title,
  checked,
  onUpdate,
  description,
  className,
}: JunctionBoxProps) => {
  const handleCardToggle = useCallback(
    () => onUpdate(!checked),
    [checked, onUpdate],
  )
  return (
    <Card
      className={cn(
        'relative rounded-lg bg-alum/20 shadow-none dark:bg-background/30',
        className,
      )}>
      <button
        type='button'
        onClick={handleCardToggle}
        className='flex w-full cursor-pointer flex-col gap-2 rounded-lg px-4 pt-3 pb-4 pr-14 text-left'>
        <div className='flex w-full items-center justify-between font-okxs'>
          <h2 className='text-lg font-polysans font-medium'>{title}</h2>
        </div>
        <p className='text-left text-xs'>{description}</p>
      </button>

      <div className='absolute top-2.5 right-3'>
        <Switch
          aria-label={`Toggle ${title}`}
          size='sm'
          isSelected={checked}
          onChange={onUpdate}
          className='scale-80'>
          {({isSelected}) => (
            <Switch.Control
              className={cn('dark:bg-slate-200/20', {
                'dark:bg-emerald-400': isSelected,
              })}>
              <Switch.Thumb className='dark:bg-slate-100' />
            </Switch.Control>
          )}
        </Switch>
      </div>
    </Card>
  )
}
