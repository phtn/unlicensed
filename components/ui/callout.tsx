import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {ViewTransition} from 'react'
interface CalloutProps {
  title: string
  description?: string
  icon?: IconName
  type?: 'success' | 'error' | 'warning' | 'info' | 'debug'
}

export const Callout = ({title, description, icon, type}: CalloutProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-3xl bg-default-100/50 border border-default-200/50 transition-all hover:bg-default-100 dark:bg-dark-table/40 w-full',
        {
          'border border-indigo-400 bg-indigo-400/10': type === 'debug',
        },
      )}>
      <ViewTransition>
        {icon && (
          <div
            className={cn('p-2.5 rounded-xl bg-primary text-white', {
              'bg-indigo-400': type === 'debug',
            })}>
            <Icon name={icon} size={18} />
          </div>
        )}
      </ViewTransition>
      <div className='flex-1'>
        <p className='text-sm font-semibold font-nito'>{title}</p>
        <p className='text-xs text-default-500 mt-0.5'>{description}</p>
      </div>
    </div>
  )
}
