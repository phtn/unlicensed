import {SelectOption} from '@/app/admin/_components/ui/fields'
import {Label, ListBox, Select as S} from '@heroui/react'
import {ComponentPropsWithoutRef} from 'react'

interface SelectProps extends ComponentPropsWithoutRef<typeof S> {
  label?: string
  type?: 'select' | 'text'
  mode?: 'single' | 'multiple'
  options?: SelectOption[]
  placeholder?: string
}

export const selectClass = {
  label:
    'uppercase font-ios text-[8px] tracking-[0.35em] pl-2.5 pt-2 pb-1 opacity-80',
  value:
    'p-0 ps-3 rounded-sm text-mac-blue data-[placeholder=true]:text-slate-400/80 bg-linear-to-r from-sidebar/60 via-sidebar/40 to-transparent shadow-none font-medium h-9 w-full flex items-center',
  trigger:
    'bg-transparent h-7 rounded-b-md shadow-none p-0 ring-mac-blue data-focus:ring-mac-blue data-focus-visible:ring-mac-blue',
  mainWrapper:
    'border h-18 px-0.5 w-full border-light-gray/80 dark:border-dark-table/80 bg-background shadow-none dark:bg-black/60 rounded-md outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500 overflow-hidden',
  popover:
    'rounded-md -mt-1 bg-background/50 dark:bg-dark-table/50 backdrop-blur-md max-h-96',
  listbox: 'p-1.5 rounded-xs',
  listboxItem: 'rounded-sm hover:bg-foreground/10',
  selectIndicator: 'size-2.5 text-foreground',
}

export const Select = ({
  value,
  onChange,
  label,
  mode,
  options,
  placeholder,
  type: _type,
  ...rest
}: SelectProps) => {
  return (
    <S
      value={value}
      onChange={onChange}
      selectionMode={mode}
      placeholder={placeholder}
      className={selectClass.mainWrapper}
      {...rest}>
      {label && <Label className={selectClass.label}>{label}</Label>}
      <S.Trigger className={selectClass.trigger}>
        <S.Value className={selectClass.value} />
        <S.Indicator className={selectClass.selectIndicator} />
      </S.Trigger>
      <S.Popover className={selectClass.popover}>
        <ListBox className={selectClass.listbox}>
          {options?.map((item) => (
            <ListBox.Item
              key={item.value}
              id={item.value}
              textValue={item.label}
              className={selectClass.listboxItem}>
              {item.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </S.Popover>
    </S>
  )
}
