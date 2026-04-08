import {Input as I, Label} from '@heroui/react'
import {InputHTMLAttributes} from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  readonly value?: string
}
export const inputClass = {
  label:
    'uppercase font-ios text-[8px] tracking-widest lg:tracking-[0.30em] pl-2 pt-2 pb-2 opacity-80 whitespace-nowrap overflow-scroll',
  input:
    'p-0 border-transparent h-9 ps-2 placeholder:text-slate-400/80 bg-linear-to-r from-sidebar/40! dark:from-dark-table/40 dark:via-dark-table/0 via-sidebar/20 to-transparent! dark:to-transparent! shadow-none font-medium h-9 w-full flex items-center rounded-sm outline-none ring-blue-500 data-focus-visible:ring-blue-500 dark:data-hover:ring-blue-500 overflow-hidden text-mac-blue font-clash font-medium tracking-wider',
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
}: InputProps) => {
  return (
    <div className={inputClass.mainWrapper}>
      <Label htmlFor={name} className={inputClass.label}>
        {label}
      </Label>
      <I
        name={name}
        onBlur={onBlur}
        onChange={onChange}
        defaultValue={value}
        placeholder={placeholder}
        className={inputClass.input}
      />
    </div>
  )
}
