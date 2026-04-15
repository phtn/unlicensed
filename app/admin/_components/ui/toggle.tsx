import {ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {Label, Switch} from '@heroui/react'

interface ToggleProps {
  title: string
  label?: string
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
  className?: ClassName
}
export const Toggle = ({
  title,
  checked,
  onChange,
  disabled,
  id,
  className,
  label,
}: ToggleProps) => {
  return (
    <div className='inline-flex items-center gap-x-2!'>
      {label && (
        <Label htmlFor={id} className='capitalize font-clash font-medium'>
          {label}
        </Label>
      )}
      <Switch
        id={id}
        aria-label={`Toggle ${title}`}
        size='sm'
        isSelected={checked}
        isDisabled={disabled}
        onChange={onChange ? onChange : (v) => !v}
        className={cn('scale-80', className)}>
        {({isSelected}) => (
          <Switch.Control
            className={cn('dark:bg-slate-300/50 bg-slate-400 shadow-inner', {
              'dark:bg-emerald-400 bg-emerald-500': isSelected,
            })}>
            <Switch.Thumb
              className={cn('dark:bg-dark-table bg-slate-200 drop-shadow-2xs', {
                'dark:bg-dark-table bg-slate-100': isSelected,
              })}
            />
          </Switch.Control>
        )}
      </Switch>
    </div>
  )
}
