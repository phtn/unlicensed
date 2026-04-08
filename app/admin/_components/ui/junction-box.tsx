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
        'relative rounded-md bg-sidebar/60 shadow-none dark:bg-background/40 w-full p-0 border border-light-gray dark:border-dark-table',
        className,
      )}>
      <button
        type='button'
        onClick={handleCardToggle}
        className='flex w-full cursor-pointer flex-col gap-2 rounded-lg px-4 pt-3 pb-4 pr-14 text-left'>
        <div className='flex w-full items-center justify-between'>
          <h2 className='text-lg font-clash font-medium'>{title}</h2>
        </div>
        <p className='font-okxs text-left text-xs dark:opacity-60'>
          {description}
        </p>
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
              className={cn('dark:bg-slate-300/50 bg-slate-400 shadow-inner', {
                'dark:bg-emerald-400 bg-emerald-500': isSelected,
              })}>
              <Switch.Thumb
                className={cn(
                  'dark:bg-dark-table bg-slate-300 drop-shadow-2xs',
                  {
                    'dark:bg-dark-table bg-slate-200': isSelected,
                  },
                )}
              />
            </Switch.Control>
          )}
        </Switch>
      </div>
    </Card>
  )
}
