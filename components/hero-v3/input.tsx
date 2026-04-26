import {cn, Input as I, Label, TextArea as T} from '@heroui/react'
import {InputHTMLAttributes, ReactNode} from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  readonly value?: string
  withAction?: boolean
  children?: ReactNode
}
interface TextAreaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  rows?: number
  readonly value?: string
}
export const inputClass = {
  label:
    'uppercase font-ios text-[8px] tracking-widest lg:tracking-[0.30em] pl-2 pt-2 pb-2 opacity-80 whitespace-nowrap overflow-scroll',
  input:
    'p-0 border-t-[0.5px] border-light-gray/55 dark:border-dark-table/50 h-9 ps-2 placeholder:text-slate-400/80 bg-linear-to-r from-sidebar/60! dark:from-dark-table/40 dark:via-dark-table/0 via-sidebar/40 to-sidebar/30! dark:to-transparent! shadow-none font-medium h-9 w-full flex items-center rounded-xs outline-none ring-blue-500 data-focus-visible:ring-blue-500 dark:data-hover:ring-blue-500 overflow-hidden text-mac-blue font-clash font-medium tracking-wider',
  mainWrapper:
    'border h-18 flex flex-col px-0.5 w-full border-light-gray/80 dark:border-dark-table/80 bg-background dark:bg-background/60 shadow-none rounded-md',
}
export const Input = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  name,
  withAction = false,
  children,
}: InputProps) => {
  const valueProps = onChange ? {value: value ?? ''} : {defaultValue: value}

  return (
    <div className={cn(inputClass.mainWrapper, {relative: withAction})}>
      <Label htmlFor={name} className={inputClass.label}>
        {label}
      </Label>
      <I
        name={name}
        onBlur={onBlur}
        onChange={onChange}
        {...valueProps}
        placeholder={placeholder}
        className={inputClass.input}
      />

      {withAction && children && (
        <div className='absolute top-1.5 right-1.5 h-7 opacity-70 hover:opacity-100 cursor-pointer'>
          {children}
        </div>
      )}
    </div>
  )
}

export const TextArea = ({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  name,
  rows,
}: TextAreaProps) => {
  const valueProps = onChange ? {value: value ?? ''} : {defaultValue: value}

  return (
    <div className={cn(inputClass.mainWrapper, 'min-h-24 h-auto')}>
      <Label htmlFor={name} className={cn(inputClass.label, 'overflow-hidden')}>
        {label}
      </Label>
      <T
        rows={rows}
        id={name}
        onBlur={onBlur}
        onChange={onChange}
        {...valueProps}
        placeholder={placeholder}
        className={cn(
          inputClass.input,
          'overflow-hidden placeholder:font-normal!',
          '',
        )}
      />
    </div>
  )
}
