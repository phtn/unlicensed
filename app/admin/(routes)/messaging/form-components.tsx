import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {ComponentProps} from 'react'

interface ContentHeaderProps {
  title: string
  description?: string
}
export const ContentHeader = ({title, description}: ContentHeaderProps) => {
  return (
    <div className='flex items-center gap-4'>
      <div>
        <h1 className='text-xl font-semibold tracking-tight'>{title}</h1>
        {description ? (
          <p className='text-sm opacity-70 mt-0.5'>{description}</p>
        ) : null}
      </div>
    </div>
  )
}

interface InputProps extends ComponentProps<'input'> {
  label?: string
  icon?: IconName
  hint?: string
  error?: string
}
export function StyledInput({
  label,
  icon,
  hint,
  error,
  className,
  type = 'text',
  'aria-invalid': ariaInvalid,
  ...props
}: InputProps) {
  const inputId = props.id
  const isInvalid =
    (error?.length ?? 0) > 0 || ariaInvalid === true || ariaInvalid === 'true'

  return (
    <div className={cn('group space-y-2', className)}>
      {label ? (
        <div className='space-y-1'>
          <label
            htmlFor={inputId}
            className='block text-sm font-medium text-zinc-200'>
            {label}
          </label>
          {hint ? <p className='text-xs leading-relaxed'>{hint}</p> : null}
        </div>
      ) : null}
      <div className='relative'>
        {icon && (
          <div className='absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-300 transition-colors'>
            <Icon name={icon} className='size-4' />
          </div>
        )}
        <input
          {...props}
          type={type}
          aria-invalid={ariaInvalid}
          className={cn(
            'w-full h-11 rounded-xl border-0 backdrop-blur-sm',
            'text-zinc-50 placeholder:text-sm',
            icon ? 'pl-10 pr-4' : 'px-4',
            'ring-1',
            'focus-visible:ring-2 focus-visible:ring-cyan-500/35 focus-visible:outline-none',
            'transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isInvalid &&
              'ring-red-500/40 hover:ring-red-500/40 focus-visible:ring-red-500/40',
          )}
        />
        <div className='absolute inset-0 rounded-xl bg-linear-to-r from-cyan-500/0 via-cyan-500/0 to-purple-500/0 opacity-0 group-focus-within:opacity-10 pointer-events-none transition-opacity' />
      </div>
      {error ? (
        <p className='text-xs text-red-400 leading-relaxed'>{error}</p>
      ) : null}
    </div>
  )
}
interface TextAreaProps extends ComponentProps<'textarea'> {
  label?: string
  icon?: IconName
  mono?: boolean
  hint?: string
  error?: string
}
// Custom styled textarea component
export function StyledTextarea({
  label,
  hint,
  error,
  className,
  rows = 3,
  mono = false,
  'aria-invalid': ariaInvalid,
  ...props
}: TextAreaProps) {
  const textareaId = props.id
  const isInvalid =
    (error?.length ?? 0) > 0 || ariaInvalid === true || ariaInvalid === 'true'

  return (
    <div className={cn('group space-y-2', className)}>
      {label ? (
        <div className='space-y-1'>
          <label
            htmlFor={textareaId}
            className='block text-sm font-medium text-zinc-200'>
            {label}
          </label>
          {hint ? <p className='text-xs leading-relaxed'>{hint}</p> : null}
        </div>
      ) : null}
      <div className='relative'>
        <textarea
          {...props}
          rows={rows}
          aria-invalid={ariaInvalid}
          className={cn(
            'w-full rounded-xl border-0 backdrop-blur-sm resize-none',
            'text-zinc-50 placeholder:text-sm',
            'px-4 py-3',
            'ring-1 ring-zinc-800/60',
            'focus-visible:ring-2 focus-visible:ring-cyan-500/35 focus-visible:outline-none',
            'transition-colors duration-200',
            'hover:ring-zinc-700/70 hover:bg-zinc-900/55',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isInvalid &&
              'ring-red-500/40 hover:ring-red-500/40 focus-visible:ring-red-500/40',
            mono && 'font-mono text-xs leading-relaxed',
          )}
        />
        <div className='absolute inset-0 rounded-xl bg-linear-to-r from-cyan-500/0 via-cyan-500/0 to-purple-500/0 opacity-0 group-focus-within:opacity-10 pointer-events-none transition-opacity' />
      </div>
      {error ? (
        <p className='text-xs text-red-400 leading-relaxed'>{error}</p>
      ) : null}
    </div>
  )
}

// Section header component
export function SectionHeader({
  title,
  icon,
  gradient,
}: {
  title: string
  icon: IconName
  gradient: string
}) {
  return (
    <div className='flex items-center gap-3 mb-5'>
      <div
        className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ring-1 ring-white/5',
          gradient,
        )}>
        <Icon name={icon} className='size-4 text-white' />
      </div>
      <h3 className='text-sm font-semibold tracking-tight'>{title}</h3>
      <div className='flex-1 h-px bg-linear-to-r from-foreground/30 to-transparent' />
    </div>
  )
}
