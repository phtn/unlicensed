import {cn} from '@/lib/utils'
import {Switch} from '@heroui/react'

interface ToggleProps {
  title: string
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
}
export const Toggle = ({
  title,
  checked,
  onChange,
  disabled,
  id,
}: ToggleProps) => {
  return (
    <Switch
      id={id}
      aria-label={`Toggle ${title}`}
      size='sm'
      isSelected={checked}
      isDisabled={disabled}
      onChange={onChange ? onChange : (v) => !v}
      className='scale-80'>
      {({isSelected}) => (
        <Switch.Control
          className={cn('dark:bg-slate-300/50 bg-slate-400 shadow-inner', {
            'dark:bg-emerald-400 bg-emerald-500': isSelected,
          })}>
          <Switch.Thumb
            className={cn('dark:bg-dark-table bg-slate-300 drop-shadow-2xs', {
              'dark:bg-dark-table bg-slate-200': isSelected,
            })}
          />
        </Switch.Control>
      )}
    </Switch>
  )
}
