import type {ClassName} from '@/app/types'
import {cn} from '@/lib/utils'
import {Input, Textarea as TextArea} from '@heroui/input'
import {Chip, Label} from '@heroui/react'
import {Select} from '@heroui/select'
import {Switch} from '@heroui/switch'
import type {SharedSelection} from '@heroui/system'
import React, {
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react'
import {
  CategorySelectItem,
  categoryColors,
  getCategoryChipProps,
  getCategoryColor,
} from './category-select-item'
import {useAppForm, useFieldContext} from './form-context'

export const commonInputClassNames = {
  label: 'mb-5 pl-1 opacity-80 tracking-widest uppercase text-xs font-ios',
  input:
    'text-blue-500 dark:text-white text-base font-medium font-okxs placeholder:text-slate-500/60 placeholder:font-normal dark:placeholder:text-slate-500 selection:bg-blue-400 selection:text-white',
  inputWrapper:
    'border shadow-none border-light-gray/50 dark:border-black/20 bg-light-gray/10 dark:bg-black/60 data-focus:border-blue-500 dark:data-hover:border-blue-500 dark:data-hover:bg-background data-hover:bg-blue-200/20! dark:data-focus:bg-background/40 rounded-lg p-2 outline-none min-h-18 w-full',
  innerWrapper: 'px-1',
  description: 'px-1 text-xs tracking-wide text-slate-500',
}

export const darkInputClassNames = {
  label: 'mb-5 pl-1 opacity-80 tracking-widest uppercase text-xs font-ios',
  input:
    'text-blue-500 dark:text-white text-base font-medium font-okxs placeholder:text-slate-500/60 placeholder:font-normal dark:placeholder:text-slate-500 selection:bg-blue-400 selection:text-white',
  inputWrapper:
    'border shadow-none border-dark-gray dark:border-black/60 bg-orange-200 dark:bg-cyan-300/20 data-hover:border-orange-700 dark:data-hover:border-blue-500 data-hover:bg-orange-200/60! data-focus:bg-orange-100/60 data-focus:border-orange-700 rounded-lg p-2 outline-none min-h-18 w-full',
  innerWrapper: 'px-1',
  description: 'text-slate-500 tracking-wide',
}

export const secondaryInputClassNames = {
  label:
    'mb-4 pl-1 opacity-100 dark:opacity-80 tracking-widest uppercase text-xs font-ios',
  input:
    'text-blue-500 dark:text-white text-base md:text-lg font-medium font-okxs placeholder:text-slate-500/60 placeholder:font-normal dark:placeholder:text-slate-500 selection:bg-blue-400 selection:text-white',
  inputWrapper:
    'border shadow-none border-dark-gray/40 dark:border-black/20 bg-light-gray/60 dark:bg-black/60 data-focus:border-blue-500 dark:data-hover:border-blue-500 rounded-md px-2 pt-1 pb-0.5 outline-none min-h-14 w-full',
  innerWrapper: 'px-1',
  description: 'text-slate-500 tracking-wide',
}

export const narrowInputClassNames = {
  label:
    'mb-3 pl-1 opacity-100 dark:opacity-80 tracking-widest uppercase text-xs font-ios',
  input:
    'text-blue-500 dark:text-white text-base font-medium font-okxs placeholder:text-slate-500/60 placeholder:font-normal dark:placeholder:text-slate-500 selection:bg-blue-400 selection:text-white',
  inputWrapper:
    'border shadow-none border-light-gray/50 dark:border-black/20 bg-light-gray/10 dark:bg-black/60 data-focus:border-blue-500 dark:data-hover:border-blue-500 rounded-md px-2 pb-1 pt-1 outline-none min-h-10 w-full',
  innerWrapper: 'px-1',
  description: 'text-slate-500 tracking-wide',
}

export const commonSelectClassNames = {
  label: 'ps-1 mb-4 uppercase font-ios text-xs tracking-widest opacity-80',
  value: 'ps-1 placeholder:text-slate-400/80 py-4 mt-2',
  trigger:
    'border p-2 h-18 border-light-gray/50 dark:border-black/20 bg-light-gray/10 shadow-none dark:bg-black/60 rounded-lg outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500',
  listbox: 'p-1.5',
}

export const narrowSelectClassNames = {
  label: 'uppercase font-ios text-[8px] tracking-widest pl-2 pt-1.5',
  value:
    'p-0 ps-3 placeholder:text-slate-400/80 bg-linear-to-r from-sidebar/60 via-sidebar/40 to-transparent shadow-none font-medium h-9 w-full flex items-center',
  trigger: 'bg-transparent rounded-none shadow-none p-0',
  mainWrapper:
    'border h-16 p-0 w-full border-light-gray/80 dark:border-dark-table/80 bg-background shadow-none dark:bg-black/60 rounded-md outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500 overflow-hidden',
  popover:
    'rounded-md -mt-1 bg-background/50 dark:bg-dark-table/50 backdrop-blur-md max-h-96',
  listbox: 'p-1.5 rounded-xs',
  listboxItem: 'rounded-sm hover:bg-foreground/10',
  selectIndicator: 'size-2.5 text-foreground',
}

export const multiSelectClassNames = {
  value: 'placeholder:text-slate-400/80 py-2',
  trigger:
    'border h-18 border-light-gray/50 dark:border-black/20 bg-light-gray/10 shadow-none dark:bg-black/60 rounded-lg p-2 outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500',
  mainWrapper: '',
  listbox: 'p-1.5',
}

export const simpleSelectClassNames = {
  value: 'px-2',
  listbox: 'py-1.5',
  label: 'font-semibold font-clash tracking-wide text-sm',
  trigger: 'bg-background/40 hover:bg-background/50! rounded-md',
}

export const getSingleSelectedKey = (keys: SharedSelection) => {
  if (keys === 'all') {
    return null
  }

  return Array.from(keys)[0] ?? null
}

export const getSelectedKeySet = (keys: SharedSelection) => {
  if (keys === 'all') {
    return new Set<React.Key>()
  }

  return new Set(keys)
}

type BaseFieldProps<T> = {
  name: keyof T // Required for FormInput type, but can be omitted when used inside AppField
  label: string
  id?: string | number
  ref?: Ref<T>
  required?: boolean
  className?: ClassName
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  autoComplete?: 'off' | 'on'
  autoFill?: 'off' | 'on'
  placeholder?: string
  description?: string
  defaultValue?:
    | string
    | number
    | boolean
    | undefined
    | Array<string | number | boolean | undefined>
  step?: string
  min?: string | number
  max?: string | number
  minRows?: number
  spellCheck?: boolean
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
  error?: string
  helperText?: string
  disabled?: boolean
  value?:
    | string
    | number
    | boolean
    | undefined
    | Array<string | number | boolean | undefined>
}

// Partial type for when name comes from AppField context
export type PartialFormInput<T> = Omit<FormInput<T>, 'name'> & {
  name?: keyof T
}

type TextFieldProps<T> = BaseFieldProps<T> & {
  type: 'text' | 'textarea' | 'number' | 'email' | 'password' | 'url' | 'tel'
}

export const SELECT_CUSTOM_OPTION_KEY = '__custom__'

export type SelectOption = {
  key?: string
  value: string
  label: string
}

type SelectClassNames = Partial<
  Record<
    | 'base'
    | 'label'
    | 'value'
    | 'trigger'
    | 'mainWrapper'
    | 'listbox'
    | 'popoverContent'
    | 'listboxWrapper'
    | 'innerWrapper'
    | 'selectorIcon',
    string
  >
>

type SelectUiProps = {
  classNames?: SelectClassNames
}

type ChipColor = 'accent' | 'danger' | 'default' | 'success' | 'warning'

const normalizeChipColor = (color: string): ChipColor =>
  color === 'primary' ? 'accent' : (color as ChipColor)

type SelectFieldProps<T> = BaseFieldProps<T> & {
  type: 'select'
  mode?: 'single' | 'multiple'
  options: Array<SelectOption>
  isCategory?: boolean
}

export type SelectWithCustomFieldProps<T> = Omit<
  SelectFieldProps<T>,
  'mode' | 'isCategory'
> & {
  type: 'select'
  allowCustom?: boolean
  customOptionLabel?: string
  customPlaceholder?: string
}

type CheckboxFieldProps<T> = BaseFieldProps<T> & {
  type: 'checkbox'
  description?: string
}

export type FormInput<T> =
  | TextFieldProps<T>
  | SelectFieldProps<T>
  | CheckboxFieldProps<T>

export function TextField<T>(props?: PartialFormInput<T> | FormInput<T>) {
  const field = useFieldContext<string>()
  const inputType =
    props?.type === 'number' ||
    props?.type === 'textarea' ||
    props?.type === 'select' ||
    props?.type === 'checkbox'
      ? 'text'
      : (props?.type ?? 'text')
  return (
    <div className={cn('flex flex-col gap-2 w-full', props?.className)}>
      <Input
        id={field.name}
        name={String(field.name)}
        type={inputType}
        label={props?.label}
        description={props?.description}
        autoComplete={props?.autoComplete}
        inputMode={props?.inputMode}
        isRequired={props?.required}
        isDisabled={props?.disabled}
        size='lg'
        value={String(field.state.value ?? props?.value ?? '')}
        onValueChange={(value) => field.handleChange(value)}
        onBlur={field.handleBlur}
        placeholder={props?.placeholder}
        classNames={commonInputClassNames}
        variant='faded'
        suppressHydrationWarning
        spellCheck={
          props?.spellCheck === undefined
            ? undefined
            : props.spellCheck
              ? 'true'
              : 'false'
        }
      />
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className='text-xs text-rose-400'>
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

export function NumberField<T>(props?: PartialFormInput<T> | FormInput<T>) {
  const field = useFieldContext<number>()
  const numValue = field.state.value ?? 0
  return (
    <div className={cn('flex flex-col gap-2 w-full', props?.className)}>
      <Input
        id={field.name}
        name={String(field.name)}
        label={props?.label}
        description={props?.description}
        type='number'
        autoComplete={props?.autoComplete}
        isRequired={props?.required}
        isDisabled={props?.disabled}
        size='lg'
        step={props?.step}
        min={props?.min}
        max={props?.max}
        value={String(numValue)}
        onValueChange={(value) => {
          const numValue = Number(value)
          field.handleChange(isNaN(numValue) ? 0 : numValue)
        }}
        onBlur={field.handleBlur}
        placeholder={props?.placeholder}
        classNames={commonInputClassNames}
        variant='faded'
      />
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className='text-xs text-rose-400'>
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

export function TextAreaField<T>(props?: PartialFormInput<T> | FormInput<T>) {
  const field = useFieldContext<string>()
  return (
    <div className={cn('flex flex-col gap-2 w-full', props?.className)}>
      <TextArea
        id={field.name}
        name={String(field.name)}
        label={props?.label}
        description={props?.description}
        autoComplete={props?.autoComplete}
        isRequired={props?.required}
        isDisabled={props?.disabled}
        value={field.state.value ?? ''}
        onValueChange={(value) => field.handleChange(value)}
        onBlur={field.handleBlur}
        placeholder={props?.placeholder}
        minRows={props?.minRows ?? 3}
        className='placeholder:text-red-400'
        classNames={commonInputClassNames}
        spellCheck={
          props?.spellCheck === undefined
            ? undefined
            : props.spellCheck
              ? 'true'
              : 'false'
        }
      />
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className='text-xs text-rose-400'>
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

export function SelectField<T>(props?: SelectFieldProps<T> & SelectUiProps) {
  const mode = props?.mode ?? 'single'
  const isMultiple = mode === 'multiple'

  // Use conditional typing based on mode
  const field = useFieldContext<string | string[]>()
  const options = props?.options ?? []

  // Determine if this is a category select field
  const isCategoryField = props?.isCategory ?? false
  const labelId = `${String(field.name)}-label`

  const multiValue = Array.isArray(field.state.value)
    ? field.state.value
    : field.state.value
      ? [field.state.value]
      : []

  const singleValue = Array.isArray(field.state.value)
    ? (field.state.value[0] ?? '')
    : (field.state.value ?? '')

  const selectedKeys = isMultiple
    ? new Set(multiValue)
    : singleValue
      ? new Set([singleValue])
      : new Set<string>()

  const selectClassNames = {
    ...(isMultiple
      ? {...commonSelectClassNames, ...multiSelectClassNames}
      : commonSelectClassNames),
    ...props?.classNames,
  }

  const handleSelectionChange = (keys: SharedSelection) => {
    if (keys === 'all') {
      field.handleChange(
        isMultiple ? options.map((option) => option.value) : '',
      )
      return
    }

    const selectedArray = Array.from(keys).map(String)
    field.handleChange(isMultiple ? selectedArray : (selectedArray[0] ?? ''))
  }

  const renderSelectItems = () =>
    options.map((option) => {
      if (isCategoryField) {
        const categoryColor = getCategoryColor(option.value)
        return (
          <CategorySelectItem
            key={option.value}
            className={categoryColors[categoryColor].textColor}
            textValue={option.label}>
            {option.label}
          </CategorySelectItem>
        )
      }

      return (
        <CategorySelectItem key={option.value} textValue={option.label}>
          {option.label}
        </CategorySelectItem>
      )
    })

  return (
    <div className={cn('flex flex-col w-full', props?.className)}>
      {props?.label && (
        <Label
          id={labelId}
          htmlFor={String(field.name)}
          isRequired={props?.required}
          isDisabled={props?.disabled}
          className={commonSelectClassNames.label}>
          {props.label}
        </Label>
      )}
      {isMultiple ? (
        <Select
          id={field.name}
          name={String(field.name)}
          aria-label={props?.label ?? props?.placeholder ?? String(field.name)}
          aria-labelledby={props?.label ? labelId : undefined}
          selectionMode='multiple'
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
          onBlur={field.handleBlur}
          placeholder={props?.placeholder}
          autoComplete={props?.autoComplete}
          isRequired={props?.required}
          isDisabled={props?.disabled}
          variant='faded'
          classNames={selectClassNames}
          renderValue={(items) => {
            const getOptionValue = (itemKey: React.Key) => {
              const option = options.find((opt) => opt.value === itemKey)
              return option?.value ?? ''
            }

            return (
              <div className='flex items-center space-x-2 overflow-x-auto whitespace-nowrap pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'>
                {items.map((item) => {
                  const optionValue = item.key ? getOptionValue(item.key) : ''
                  const chipProps =
                    isCategoryField && optionValue
                      ? getCategoryChipProps(optionValue)
                      : {color: 'accent' as const, className: 'dark:text-white'}
                  const chipColor = normalizeChipColor(chipProps.color)

                  return (
                    <Chip
                      variant='soft'
                      color={chipColor}
                      key={item.key}
                      size='md'
                      className={cn(chipProps.className, 'shrink-0 border')}>
                      <span className='text-foreground'>{item.textValue}</span>
                    </Chip>
                  )
                })}
              </div>
            )
          }}>
          {renderSelectItems()}
        </Select>
      ) : (
        <Select
          id={field.name}
          name={String(field.name)}
          aria-label={props?.label ?? props?.placeholder ?? String(field.name)}
          aria-labelledby={props?.label ? labelId : undefined}
          selectionMode='single'
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
          onBlur={field.handleBlur}
          placeholder={props?.placeholder}
          autoComplete={props?.autoComplete}
          isRequired={props?.required}
          isDisabled={props?.disabled}
          variant='faded'
          classNames={selectClassNames}
          renderValue={(items) => {
            const selectedItem = items[0]
            if (!selectedItem) return null

            const selectedKey = selectedItem.key ?? ''
            const selectedValue =
              typeof selectedKey === 'string'
                ? selectedKey
                : String(selectedKey)
            const chipProps = isCategoryField
              ? getCategoryChipProps(selectedValue)
              : {color: 'accent' as const, className: 'dark:text-white'}
            const chipColor = normalizeChipColor(chipProps.color)

            return (
              <div className='flex flex-wrap gap-x-2'>
                <Chip
                  variant='soft'
                  color={chipColor}
                  key={selectedItem.textValue}
                  size='md'>
                  {selectedItem.textValue}
                </Chip>
              </div>
            )
          }}>
          {renderSelectItems()}
        </Select>
      )}
      {props?.description && (
        <p className='px-1 text-xs tracking-wide text-slate-500'>
          {props.description}
        </p>
      )}
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className='text-xs text-rose-400'>
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

export function SelectWithCustomField<T>(
  props?: SelectWithCustomFieldProps<T> & SelectUiProps,
) {
  const field = useFieldContext<string>()
  const options = props?.options ?? []
  const allowCustom = props?.allowCustom ?? true
  const customLabel = props?.customOptionLabel ?? 'Other'
  const customPlaceholder = props?.customPlaceholder ?? 'Enter custom value'

  const optionValues = new Set(options.map((option) => option.value))
  const isCustomValue =
    field.state.value != null &&
    field.state.value !== '' &&
    !optionValues.has(field.state.value)

  const displayOptions: Array<SelectOption> = allowCustom
    ? [...options, {value: SELECT_CUSTOM_OPTION_KEY, label: customLabel}]
    : options

  const selectedValue =
    !allowCustom && isCustomValue
      ? ''
      : isCustomValue || field.state.value === SELECT_CUSTOM_OPTION_KEY
        ? SELECT_CUSTOM_OPTION_KEY
        : (field.state.value ?? '')

  const showCustomInput =
    allowCustom && (selectedValue === SELECT_CUSTOM_OPTION_KEY || isCustomValue)

  const selectClassNames = {
    ...commonSelectClassNames,
    ...props?.classNames,
  }
  const labelId = `${String(field.name)}-label`

  return (
    <div className={cn('flex flex-col w-full', props?.className)}>
      {props?.label && (
        <Label
          id={labelId}
          htmlFor={field.name}
          isRequired={props?.required}
          isDisabled={props?.disabled}
          className={commonSelectClassNames.label}>
          {props.label}
        </Label>
      )}
      {props?.description && (
        <p className='px-1 text-xs tracking-wide text-slate-500'>
          {props.description}
        </p>
      )}
      {showCustomInput ? (
        <Input
          id={field.name}
          name={String(field.name)}
          aria-label={customLabel}
          aria-labelledby={props?.label ? labelId : undefined}
          autoComplete={props?.autoComplete}
          isRequired={props?.required}
          isDisabled={props?.disabled}
          size='lg'
          value={
            isCustomValue
              ? field.state.value
              : field.state.value === SELECT_CUSTOM_OPTION_KEY
                ? ''
                : (field.state.value ?? '')
          }
          onValueChange={(value) => field.handleChange(value)}
          onBlur={field.handleBlur}
          placeholder={customPlaceholder}
          classNames={commonInputClassNames}
          variant='faded'
        />
      ) : (
        <Select
          id={field.name}
          name={String(field.name)}
          aria-label={props?.label ?? props?.placeholder ?? customLabel}
          aria-labelledby={props?.label ? labelId : undefined}
          selectionMode='single'
          isDisabled={props?.disabled}
          selectedKeys={
            selectedValue ? new Set<string>([selectedValue]) : new Set<string>()
          }
          onSelectionChange={(keys: SharedSelection) => {
            if (keys === 'all') {
              field.handleChange('')
              return
            }

            const key = Array.from(keys).map(String)[0] ?? ''

            if (key === '') {
              field.handleChange('')
              return
            }

            if (key === SELECT_CUSTOM_OPTION_KEY) {
              field.handleChange(
                isCustomValue
                  ? (field.state.value ?? '')
                  : SELECT_CUSTOM_OPTION_KEY,
              )
              return
            }

            field.handleChange(key)
          }}
          onBlur={field.handleBlur}
          placeholder={props?.placeholder}
          autoComplete={props?.autoComplete}
          isRequired={props?.required}
          variant='faded'
          classNames={selectClassNames}>
          {displayOptions.map((option) => (
            <CategorySelectItem key={option.value} textValue={option.label}>
              {option.label}
            </CategorySelectItem>
          ))}
        </Select>
      )}
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className='text-xs text-rose-400'>
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

export function SwitchField<T>(
  props?: PartialFormInput<T> | CheckboxFieldProps<T>,
) {
  const field = useFieldContext<boolean>()
  const value = field.state.value ?? false
  return (
    <div className={cn('flex flex-col gap-2 w-full', props?.className)}>
      <Switch
        name={String(field.name)}
        isSelected={value}
        isDisabled={props?.disabled}
        onValueChange={(nextValue) => field.handleChange(nextValue)}
        onBlur={field.handleBlur}
        classNames={{
          wrapper: 'group-data-[selected=true]:bg-amber-500',
        }}>
        <div className='flex flex-col gap-px'>
          <span className='text-base font-medium'>{props?.label}</span>
          <span className='text-xs opacity-70'>{props?.description}</span>
        </div>
      </Switch>
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className='text-xs text-rose-400'>
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

export const renderFields = <T extends Record<string, unknown>>(
  form: ReturnType<typeof useAppForm>,
  fields: FormInput<T>[],
  options?: Array<SelectOption>,
  optionsByField?: Partial<Record<string, Array<SelectOption>>>,
) =>
  fields.map((field) => (
    <form.AppField key={String(field.name)} name={field.name as string}>
      {(input) => {
        switch (field.type) {
          case 'checkbox':
            return (
              <input.SwitchField
                {...input}
                type={field.type}
                name={field.name as keyof T}
                label={field.label}
                placeholder={field.placeholder}
                description={field.description}
                required={field.required}
                disabled={field.disabled}
              />
            )
          case 'select': {
            const fieldName = String(field.name)
            const selectOptions =
              optionsByField?.[fieldName] ??
              (fieldName === 'categorySlug'
                ? (options ?? field.options ?? [])
                : (field.options ?? []))

            return (
              <input.SelectField
                {...input}
                type={field.type}
                name={field.name as unknown as keyof T}
                mode={field.mode}
                label={field.label}
                placeholder={field.placeholder}
                description={field.description}
                required={field.required}
                disabled={field.disabled}
                autoComplete={field.autoComplete}
                isCategory={field.name === 'categorySlug'}
                className='w-full flex'
                classNames={{...commonSelectClassNames}}
                options={selectOptions}
              />
            )
          }
          case 'number':
            return (
              <input.NumberField
                {...input}
                type={field.type}
                name={field.name as keyof T}
                label={field.label}
                placeholder={field.placeholder}
                description={field.description}
                required={field.required}
                disabled={field.disabled}
                autoComplete={field.autoComplete}
                step={field.step}
                min={field.min}
                max={field.max}
              />
            )
          case 'textarea':
            return (
              <input.TextAreaField
                {...input}
                type={field.type}
                name={field.name as keyof T}
                label={field.label}
                placeholder={field.placeholder}
                description={field.description}
                required={field.required}
                disabled={field.disabled}
                autoComplete={field.autoComplete}
                minRows={field.minRows}
              />
            )
          default:
            return (
              <input.TextField
                {...input}
                type={field.type}
                name={field.name as keyof T as string}
                label={field.label}
                defaultValue={field.defaultValue}
                placeholder={field.placeholder}
                description={field.description}
                required={field.required}
                disabled={field.disabled}
                autoComplete={field.autoComplete}
                inputMode={field.inputMode}
                spellCheck={field.spellCheck}
              />
            )
        }
      }}
    </form.AppField>
  ))

interface FieldGroupProps<T extends Record<string, unknown>> {
  form: ReturnType<typeof useAppForm>
  fields: Array<FormInput<T>>
  options?: Array<SelectOption>
  optionsByField?: Partial<Record<string, Array<SelectOption>>>
  children?: ReactNode
}

export const FieldGroup = <T extends Record<string, unknown>>({
  form,
  fields,
  options,
  optionsByField,
}: FieldGroupProps<T>) =>
  fields.map((field) => (
    <form.AppField key={String(field.name)} name={field.name as string}>
      {(input) => {
        switch (field.type) {
          case 'checkbox':
            return (
              <input.SwitchField
                {...input}
                type={field.type}
                name={field.name as keyof T}
                label={field.label}
                placeholder={field.placeholder}
                description={field.description}
                required={field.required}
                disabled={field.disabled}
              />
            )
          case 'select': {
            const fieldName = String(field.name)
            const selectOptions =
              optionsByField?.[fieldName] ??
              (fieldName === 'categorySlug'
                ? (options ?? field.options ?? [])
                : (field.options ?? []))

            return (
              <input.SelectField
                {...input}
                type={field.type}
                name={field.name as keyof T}
                mode={field.mode}
                label={field.label}
                placeholder={field.placeholder}
                description={field.description}
                required={field.required}
                disabled={field.disabled}
                autoComplete={field.autoComplete}
                isCategory={field.name === 'categorySlug'}
                options={selectOptions}
              />
            )
          }
          case 'number':
            return (
              <input.NumberField
                {...input}
                type={field.type}
                name={field.name as keyof T}
                label={field.label}
                placeholder={field.placeholder}
                description={field.description}
                required={field.required}
                disabled={field.disabled}
                autoComplete={field.autoComplete}
                step={field.step}
                min={field.min}
                max={field.max}
              />
            )
          case 'textarea':
            return (
              <input.TextAreaField
                {...input}
                type={field.type}
                name={field.name as keyof T}
                label={field.label}
                placeholder={field.placeholder}
                description={field.description}
                required={field.required}
                disabled={field.disabled}
                autoComplete={field.autoComplete}
                minRows={field.minRows}
              />
            )
          default:
            return (
              <input.TextField
                {...input}
                type={field.type}
                name={field.name as keyof T}
                label={field.label}
                placeholder={field.placeholder}
                defaultValue={field.defaultValue}
                description={field.description}
                required={field.required}
                disabled={field.disabled}
                autoComplete={field.autoComplete}
                inputMode={field.inputMode}
                spellCheck={field.spellCheck}
              />
            )
        }
      }}
    </form.AppField>
  ))
