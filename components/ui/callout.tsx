import {Icon, type IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {type ReactNode, useMemo, ViewTransition} from 'react'

type CalloutType = 'success' | 'error' | 'warning' | 'info' | 'debug'
interface CalloutProps {
  title: ReactNode
  description?: ReactNode
  icon?: IconName
  type?: CalloutType
  children?: ReactNode
}

export const Callout = ({
  title,
  description,
  icon,
  type,
  children,
}: CalloutProps) => {
  const defaultIcon: IconName = useMemo(() => {
    if (icon) return icon
    switch (type) {
      case 'success':
        return 'check-fill'
      case 'error':
        return 'alert-rhombus'
      case 'warning':
        return 'alert-rhombus'
      case 'info':
        return 'info'
      case 'debug':
        return 'code'
      default:
        return 'info'
    }
  }, [icon, type])

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-3xl bg-default-100/50 border border-default-200/50 transition-all hover:bg-default-100 dark:bg-dark-table/40 w-full',
        {
          'border-indigo-400 bg-indigo-400/10': type === 'debug',
          'border-red-400 bg-red-400/10': type === 'error',
          'border-flavors bg-flavors/10': type === 'warning',
        },
      )}>
      <ViewTransition>
        <div
          className={cn('p-2.5 rounded-xl bg-primary text-white', {
            'bg-indigo-400': type === 'debug',
            'bg-red-400': type === 'error',
            'bg-orange-400': type === 'warning',
          })}>
          <Icon name={defaultIcon} size={18} />
        </div>
      </ViewTransition>
      <div className='flex-1'>
        <div className='flex items-center justify-between w-full'>
          <div className='text-sm font-bold font-nito'>{title}</div>
          <span className='text-xs flex-1'>{children}</span>
        </div>
        <div className='text-xs opacity-80 mt-0.5'>{description}</div>
      </div>
    </div>
  )
}

export const DotDiv = () => (
  <span className='opacity-40 text-xl leading-0'>&middot;</span>
)
