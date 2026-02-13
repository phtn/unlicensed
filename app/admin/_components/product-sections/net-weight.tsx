'use client'

import {Input, Select, SelectItem} from '@heroui/react'
import {ProductFormApi} from '../product-schema'
import {commonInputClassNames} from '../ui/fields'
import {FormSection, Header} from './components'

interface NetWeightProps {
  form: ProductFormApi
}

const NET_WEIGHT_UNIT_OPTIONS = [
  {key: 'mg', label: 'mg (milligrams)'},
  {key: 'g', label: 'g (grams)'},
  {key: 'kg', label: 'kg (kilograms)'},
  {key: 'oz', label: 'oz (ounces)'},
  {key: 'lb', label: 'lb (pounds)'},
  {key: 'ml', label: 'ml (milliliters)'},
  {key: 'l', label: 'l (liters)'},
  {key: 'each', label: 'each'},
]

export const NetWeight = ({form}: NetWeightProps) => {
  return (
    <FormSection id='net-weight'>
      <Header label='Packaging Specs' />
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <form.Field name='netWeight'>
          {(field) => {
            const value = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <Input
                  label='Net Weight'
                  type='number'
                  step='0.01'
                  value={value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='e.g., 3.5'
                  variant='bordered'
                  classNames={commonInputClassNames}
                />
                {field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0 && (
                    <p className='text-xs text-rose-400'>
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
              </div>
            )
          }}
        </form.Field>

        <form.Field name='netWeightUnit'>
          {(field) => {
            const unitValue = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <Select
                  label='Net Weight Unit'
                  selectedKeys={unitValue ? [unitValue] : []}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0]
                    field.handleChange(key != null ? String(key) : '')
                  }}
                  onBlur={field.handleBlur}
                  placeholder='Select unit'
                  variant='bordered'
                  disallowEmptySelection={false}
                  classNames={{
                    ...commonInputClassNames,
                    trigger:
                      'border h-16 border-light-gray/50 dark:border-black/20 bg-light-gray/10 shadow-none dark:bg-black/60 rounded-lg p-2 outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500',
                    label:
                      'mb-2 pl-0.5 opacity-80 font-medium tracking-widest uppercase text-sm',
                  }}>
                  {NET_WEIGHT_UNIT_OPTIONS.map((unit) => (
                    <SelectItem key={unit.key} textValue={unit.label}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </Select>
                {field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0 && (
                    <p className='text-xs text-rose-400'>
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
              </div>
            )
          }}
        </form.Field>
      </div>
    </FormSection>
  )
}
