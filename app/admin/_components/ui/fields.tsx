import {Chip, Input, Select, Switch, Textarea} from '@heroui/react'
import React, {ReactNode} from 'react'
import {
  CategorySelectItem,
  getCategoryChipProps,
  getCategoryColor,
} from './category-select-item'
import {useAppForm, useFieldContext} from './form-context'

export const commonInputClassNames = {
  label: 'mb-4 pl-0.5 opacity-80 font-medium tracking-widest uppercase text-sm',
  input:
    'text-blue-500 dark:text-white text-base font-semibold placeholder:text-slate-500/60 placeholder:font-normal dark:placeholder:text-slate-500 selection:bg-blue-400 selection:text-white',
  inputWrapper:
    'border shadow-none border-light-gray/10 dark:border-black/20 bg-light-gray/10 dark:bg-black/60 data-focus:border-blue-500 dark:data-hover:border-blue-500 rounded-lg p-2 outline-none min-h-16',
  innerWrapper: 'px-0.5',
}

type BaseFieldProps<T> = {
  name: keyof T
  label: string
  required?: boolean
  placeholder?: string
  defaultValue?:
    | string
    | number
    | boolean
    | undefined
    | Array<string | number | boolean | undefined>
  step?: string
  minRows?: number
}

type TextFieldProps<T> = BaseFieldProps<T> & {
  type: 'text' | 'textarea' | 'number'
}

export type SelectOption = {
  key?: string
  value: string
  label: string
}

type SelectFieldProps<T> = BaseFieldProps<T> & {
  type: 'select'
  mode?: 'single' | 'multiple'
  options: Array<SelectOption>
  isCategory?: boolean
}

type CheckboxFieldProps<T> = BaseFieldProps<T> & {
  type: 'checkbox'
  description?: string
}

export type FormInput<T> =
  | TextFieldProps<T>
  | SelectFieldProps<T>
  | CheckboxFieldProps<T>

export function TextField<T>(props?: FormInput<T>) {
  const field = useFieldContext<string>()
  return (
    <div className='space-y-2'>
      <Input
        size='lg'
        label={props?.label}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={props?.placeholder}
        classNames={commonInputClassNames}
        variant='bordered'
      />
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className='text-xs text-rose-400'>
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

export function NumberField<T>(props?: FormInput<T>) {
  const field = useFieldContext<number>()
  const numValue = field.state.value ?? 0
  return (
    <div className='space-y-2'>
      <Input
        label={props?.label}
        type='number'
        step={props?.step}
        value={String(numValue)}
        onChange={(e) => {
          const numValue = Number(e.target.value)
          field.handleChange(isNaN(numValue) ? 0 : numValue)
        }}
        onBlur={field.handleBlur}
        placeholder={props?.placeholder}
        size='lg'
        variant='bordered'
        classNames={commonInputClassNames}
      />
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className='text-xs text-rose-400'>
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

export function TextAreaField<T>(props?: FormInput<T>) {
  const field = useFieldContext<string>()
  return (
    <div className='space-y-2'>
      <Textarea
        label={props?.label}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={props?.placeholder}
        minRows={props?.minRows ?? 3}
        variant='bordered'
        className=' placeholder:text-red-400'
        classNames={commonInputClassNames}
      />
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className='text-xs text-rose-400'>
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

export function SelectField<T>(props?: SelectFieldProps<T>) {
  const mode = props?.mode ?? 'single'
  const isMultiple = mode === 'multiple'

  // Use conditional typing based on mode
  const field = useFieldContext<string | string[]>()
  const options = props?.options ?? []

  // Determine if this is a category select field
  const isCategoryField = props?.isCategory ?? false

  // Convert field value to Set<string> for selectedKeys
  const getSelectedKeys = (): Set<string> => {
    if (!field.state.value) return new Set()

    if (isMultiple) {
      // For multiple: value should be string[]
      const values = Array.isArray(field.state.value)
        ? field.state.value
        : field.state.value
          ? [field.state.value]
          : []
      return new Set(values)
    } else {
      // For single: value should be string
      const value = Array.isArray(field.state.value)
        ? (field.state.value[0] ?? '')
        : (field.state.value ?? '')
      return value ? new Set([value]) : new Set()
    }
  }

  // Handle selection change
  const handleSelectionChange = (keys: Set<React.Key> | 'all') => {
    if (keys === 'all') {
      // Select all options
      const allValues = options.map((opt) => opt.value)
      field.handleChange(isMultiple ? allValues : (allValues[0] ?? ''))
    } else {
      const selectedArray = Array.from(keys) as string[]
      if (isMultiple) {
        field.handleChange(selectedArray)
      } else {
        field.handleChange(selectedArray[0] ?? '')
      }
    }
  }

  return (
    <div className='space-y-2'>
      <Select
        label={props?.label}
        selectionMode={mode}
        selectedKeys={getSelectedKeys()}
        onSelectionChange={handleSelectionChange}
        onBlur={field.handleBlur}
        placeholder={props?.placeholder}
        variant='bordered'
        isMultiline={isMultiple}
        classNames={{
          ...commonInputClassNames,
          value: 'placeholder:text-slate-400/80 py-4 mt-2',
          trigger:
            'border h-18 border-light-gray/10 dark:border-black/20 bg-light-gray/10 shadow-none dark:bg-black/60 rounded-lg p-2 outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500',
          mainWrapper: 'py-4',
        }}
        renderValue={
          isMultiple
            ? (items) => {
                // Find the option for each item to get its value for color mapping
                const getOptionValue = (itemKey: React.Key) => {
                  const option = options.find((opt) => opt.value === itemKey)
                  return option?.value ?? ''
                }

                return (
                  <div className='flex flex-wrap gap-x-2'>
                    {items.map((item) => {
                      const optionValue = item.key
                        ? getOptionValue(item.key)
                        : ''
                      const chipProps =
                        isCategoryField && optionValue
                          ? getCategoryChipProps(optionValue)
                          : {
                              color: 'primary' as const,
                              className: 'dark:text-white',
                            }

                      return (
                        <Chip
                          variant='faded'
                          {...chipProps}
                          key={item.key}
                          size='sm'>
                          {item.textValue}
                        </Chip>
                      )
                    })}
                  </div>
                )
              }
            : (item) => {
                // Find the option for the selected item to get its value for color mapping
                // item[0] contains the selected item, use its key to find the option value
                const selectedKey = item[0]?.key ?? ''
                const selectedValue =
                  typeof selectedKey === 'string'
                    ? selectedKey
                    : String(selectedKey)
                const chipProps = isCategoryField
                  ? getCategoryChipProps(selectedValue)
                  : {color: 'primary' as const, className: 'dark:text-white'}

                return (
                  <div className='flex flex-wrap gap-x-2'>
                    <Chip
                      variant='dot'
                      {...chipProps}
                      key={item[0].textValue}
                      size='md'>
                      {item[0].textValue}
                    </Chip>
                  </div>
                )
              }
        }>
        {options.map((option) => {
          // Use CategorySelectItem for category fields, otherwise use regular SelectItem
          if (isCategoryField) {
            const categoryColor = getCategoryColor(option.value)
            // Type assertion needed because extendVariants doesn't fully extend TypeScript types
            const props = {
              color: categoryColor,
              variant: 'faded' as const,
              textValue: option.label,
            } as React.ComponentProps<typeof CategorySelectItem>

            return (
              <CategorySelectItem key={option.value} {...props}>
                {option.label}
              </CategorySelectItem>
            )
          }

          return (
            <CategorySelectItem
              key={option.value}
              textValue={option.label}
              // className={cn({'text-indigo-400': option.value === 'extracts'})}
            >
              {option.label}
            </CategorySelectItem>
          )
        })}
      </Select>
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <p className='text-xs text-rose-400'>
          {field.state.meta.errors.join(', ')}
        </p>
      )}
    </div>
  )
}

export function SwitchField<T>(props?: CheckboxFieldProps<T>) {
  const field = useFieldContext<boolean>()
  const value = field.state.value ?? false
  return (
    <div className='space-y-2'>
      <Switch
        isSelected={value}
        onValueChange={(value) => field.handleChange(value)}
        onBlur={field.handleBlur}
        classNames={{
          wrapper: 'group-data-[selected=true]:bg-amber-500',
        }}>
        <div className='flex flex-col gap-px'>
          <span className='text-base font-semibold'>{props?.label}</span>
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
              />
            )
          case 'select':
            return (
              <input.SelectField
                {...input}
                type={field.type}
                name={field.name as keyof T}
                mode={field.mode}
                label={field.label}
                placeholder={field.placeholder}
                isCategory={field.name === 'categorySlug'}
                // options={
                //   field.name === 'categoryslug' ||
                //   field.name === 'availabledenominationsraw'
                //     ? (options ?? [])
                //     : field.options
                // }
                options={options ?? []}
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
  children?: ReactNode
}

export const FieldGroup = <T extends Record<string, unknown>>({
  form,
  fields,
  options,
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
              />
            )
          case 'select':
            return (
              <input.SelectField
                {...input}
                type={field.type}
                name={field.name as keyof T}
                mode={field.mode}
                label={field.label}
                placeholder={field.placeholder}
                isCategory={field.name === 'categorySlug'}
                options={options ?? []}
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
              />
            )
        }
      }}
    </form.AppField>
  ))
