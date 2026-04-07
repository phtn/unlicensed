import type {ClassName} from '@/app/types'
import {Input, inputClass} from '@/components/hero-v3/input'
import {selectClass} from '@/components/hero-v3/select'
import {cn} from '@/lib/utils'
import {Textarea as TextArea} from '@heroui/input'
import {Label, ListBox, Select as S, Switch} from '@heroui/react'
import React, {
  FocusEvent,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react'
import {categoryColors, getCategoryColor} from './category-select-item'
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
  value: 'ps-1 py-4 mt-2 data-[placeholder=true]:text-slate-400/80',
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
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void
}

type TextFieldProps<T> = BaseFieldProps<T> & {
  type: 'text' | 'textarea' | 'number' | 'email' | 'password' | 'url' | 'tel'
}

export const SELECT_CUSTOM_OPTION_KEY = '__custom__'

type SharedSelectionCompat =
  | 'all'
  | Set<React.Key>
  | Iterable<React.Key>
  | string
  | null

export const getSingleSelectedKey = (
  keys: SharedSelectionCompat,
): React.Key | null => {
  if (keys === 'all') return null
  if (keys === null) return null
  if (typeof keys === 'string') return keys
  return Array.from(keys as Iterable<React.Key>)[0] ?? null
}

export const getSelectedKeySet = (
  keys: SharedSelectionCompat,
): Set<React.Key> => {
  if (keys === 'all') return new Set<React.Key>()
  if (keys === null) return new Set<React.Key>()
  if (typeof keys === 'string') return new Set<React.Key>([keys])
  return new Set(keys as Iterable<React.Key>)
}

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

// type ChipColor = 'accent' | 'danger' | 'default' | 'success' | 'warning'

// const normalizeChipColor = (color: string): ChipColor =>
//   color === 'primary' ? 'accent' : (color as ChipColor)

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
    <div>
      <Input
        id={field.name}
        label={props?.label}
        name={String(field.name)}
        type={inputType}
        autoComplete={props?.autoComplete}
        inputMode={props?.inputMode}
        disabled={props?.disabled}
        value={String(field.state.value ?? props?.value ?? '')}
        onChange={props?.onChange}
        onBlur={field.handleBlur}
        placeholder={props?.placeholder}
        className={inputClass.input}
        suppressHydrationWarning
        spellCheck={
          props?.spellCheck === undefined
            ? undefined
            : props.spellCheck
              ? 'true'
              : 'false'
        }
      />
      {props?.description && (
        <p className='px-2 text-xs tracking-wide text-slate-500'>
          {props.description}
        </p>
      )}
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className='px-2 text-xs text-rose-400'>
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

export function NumberField<T>(props?: PartialFormInput<T> | FormInput<T>) {
  const field = useFieldContext<number>()
  // When caller passes an explicit value (e.g. a sub-key of a Record field),
  // use it directly rather than the whole field context value.
  const controlled = props?.value !== undefined
  const raw = controlled ? props!.value : field.state.value
  const numValue = isNaN(Number(raw)) ? 0 : Number(raw ?? 0)
  return (
    <div>
      <Input
        label={props?.label}
        id={field.name}
        name={String(field.name)}
        type='number'
        autoComplete={props?.autoComplete}
        disabled={props?.disabled}
        step={props?.step}
        min={props?.min}
        max={props?.max}
        value={String(numValue)}
        onChange={controlled ? props?.onChange : undefined}
        onBlur={field.handleBlur}
        placeholder={props?.placeholder}
      />
      {props?.description && (
        <p className='px-2 text-xs tracking-wide text-slate-500'>
          {props.description}
        </p>
      )}
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className='px-2 text-xs text-rose-400'>
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

export function TextAreaField<T>(props?: PartialFormInput<T> | FormInput<T>) {
  const field = useFieldContext<string>()
  return (
    <div className={cn('flex flex-col gap-1 w-full', props?.className)}>
      <div className={cn(inputClass.mainWrapper, 'h-auto min-h-18 py-1')}>
        {props?.label && (
          <Label htmlFor={field.name} className={inputClass.label}>
            {props.label}
          </Label>
        )}
        <TextArea
          id={field.name}
          name={String(field.name)}
          autoComplete={props?.autoComplete}
          isDisabled={props?.disabled}
          value={field.state.value ?? ''}
          onValueChange={(value) => field.handleChange(value)}
          onBlur={field.handleBlur}
          placeholder={props?.placeholder}
          minRows={props?.minRows ?? 3}
          className={cn(inputClass.input, 'h-auto')}
          spellCheck={
            props?.spellCheck === undefined
              ? undefined
              : props.spellCheck
                ? 'true'
                : 'false'
          }
        />
      </div>
      {props?.description && (
        <p className='px-2 text-xs tracking-wide text-slate-500'>
          {props.description}
        </p>
      )}
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className='px-2 text-xs text-rose-400'>
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

export function SelectField<T>(props?: SelectFieldProps<T> & SelectUiProps) {
  const mode = props?.mode ?? 'single'
  const isMultiple = mode === 'multiple'
  const field = useFieldContext<string | string[]>()
  const options = props?.options ?? []
  const isCategoryField = props?.isCategory ?? false

  const multiValue = Array.isArray(field.state.value)
    ? field.state.value
    : field.state.value
      ? [field.state.value]
      : []

  const singleValue = Array.isArray(field.state.value)
    ? (field.state.value[0] ?? '')
    : (field.state.value ?? '')

  const listboxItems = options.map((option) => {
    const extraClass = isCategoryField
      ? categoryColors[getCategoryColor(option.value)]?.textColor
      : undefined
    return (
      <ListBox.Item
        key={option.value}
        id={option.value}
        textValue={option.label}
        className={cn(selectClass.listboxItem, extraClass)}>
        {option.label}
        <ListBox.ItemIndicator />
      </ListBox.Item>
    )
  })

  // const renderMultiValue = isMultiple
  //   ? (items: {key: React.Key; textValue: string}[]) => (
  //       <div className='flex items-center space-x-2 overflow-x-auto whitespace-nowrap pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'>
  //         {items.map((item) => {
  //           const optionValue = item.key ? String(item.key) : ''
  //           const chipProps =
  //             isCategoryField && optionValue
  //               ? getCategoryChipProps(optionValue)
  //               : {color: 'accent' as const, className: 'dark:text-white'}
  //           const chipColor =
  //             chipProps.color === 'primary'
  //               ? ('accent' as const)
  //               : (chipProps.color as
  //                   | 'accent'
  //                   | 'danger'
  //                   | 'default'
  //                   | 'success'
  //                   | 'warning')
  //           return (
  //             <Chip
  //               variant='soft'
  //               color={chipColor}
  //               key={String(item.key)}
  //               size='md'
  //               className={cn(chipProps.className, 'shrink-0 border')}>
  //               <span className='text-foreground'>{item.textValue}</span>
  //             </Chip>
  //           )
  //         })}
  //       </div>
  //     )
  //   : undefined

  return (
    <div className={cn('flex flex-col w-full', props?.className)}>
      <S
        name={String(field.name)}
        value={isMultiple ? multiValue : singleValue || null}
        onChange={(keys) => {
          if (isMultiple) {
            field.handleChange(
              Array.isArray(keys) ? keys.map(String) : [String(keys)],
            )
          } else {
            field.handleChange(keys ? String(keys) : '')
          }
        }}
        selectionMode={isMultiple ? 'multiple' : 'single'}
        onBlur={field.handleBlur}
        isDisabled={props?.disabled}
        isRequired={props?.required}
        // renderValue={renderMultiValue}
        className={selectClass.mainWrapper}>
        {props?.label && (
          <Label className={selectClass.label}>{props.label}</Label>
        )}
        <S.Trigger className={selectClass.trigger}>
          <S.Value className={selectClass.value} />
          <S.Indicator className={selectClass.selectIndicator} />
        </S.Trigger>
        <S.Popover className={selectClass.popover}>
          <ListBox className={selectClass.listbox}>{listboxItems}</ListBox>
        </S.Popover>
      </S>
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

  return (
    <div className={cn('flex flex-col w-full', props?.className)}>
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
          aria-labelledby={props?.label ?? undefined}
          autoComplete={props?.autoComplete}
          required={props?.required}
          disabled={props?.disabled}
          value={
            isCustomValue
              ? field.state.value
              : field.state.value === SELECT_CUSTOM_OPTION_KEY
                ? ''
                : (field.state.value ?? '')
          }
          onBlur={field.handleBlur}
          placeholder={customPlaceholder}
        />
      ) : (
        <S
          name={String(field.name)}
          value={selectedValue || null}
          onChange={(key) => {
            const k = key ? String(key) : ''
            if (k === '') {
              field.handleChange('')
              return
            }
            if (k === SELECT_CUSTOM_OPTION_KEY) {
              field.handleChange(
                isCustomValue
                  ? (field.state.value ?? '')
                  : SELECT_CUSTOM_OPTION_KEY,
              )
              return
            }
            field.handleChange(k)
          }}
          selectionMode='single'
          onBlur={field.handleBlur}
          isDisabled={props?.disabled}
          isRequired={props?.required}
          className={selectClass.mainWrapper}>
          {props?.label && (
            <Label className={selectClass.label}>{props.label}</Label>
          )}
          <S.Trigger className={selectClass.trigger}>
            <S.Value className={selectClass.value} />
            <S.Indicator className={selectClass.selectIndicator} />
          </S.Trigger>
          <S.Popover className={selectClass.popover}>
            <ListBox className={selectClass.listbox}>
              {displayOptions.map((option) => (
                <ListBox.Item
                  key={option.value}
                  id={option.value}
                  textValue={option.label}
                  className={selectClass.listboxItem}>
                  {option.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </S.Popover>
        </S>
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
        onChange={(nextValue) => field.handleChange(nextValue)}
        onBlur={field.handleBlur}>
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
