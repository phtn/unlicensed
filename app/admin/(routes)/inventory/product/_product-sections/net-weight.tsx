'use client'

import {
  commonInputClassNames,
  commonSelectClassNames,
} from '@/app/admin/_components/ui/fields'
import {Input, Select, SelectItem} from '@heroui/react'
import {ProductFormApi} from '../product-schema'
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

const PACKAGING_MODE_OPTIONS = [
  {key: 'bulk', label: 'Bulk'},
  {key: 'prepack', label: 'Prepack'},
]

export const NetWeight = ({form}: NetWeightProps) => {
  return (
    <FormSection>
      <Header label='Packaging Specs' />
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <form.Field name='packagingMode'>
          {(field) => {
            const value = (field.state.value as string | undefined) ?? ''
            return (
              <div className='space-y-2'>
                <Select
                  label='Packaging Mode'
                  selectedKeys={value ? [value] : []}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0]
                    field.handleChange(
                      typeof key === 'string'
                        ? (key as 'bulk' | 'prepack')
                        : undefined,
                    )
                  }}
                  onBlur={field.handleBlur}
                  placeholder='Select packaging mode'
                  variant='bordered'
                  disallowEmptySelection={false}
                  classNames={{
                    ...commonInputClassNames,
                    ...commonSelectClassNames,
                    mainWrapper: 'py-0',
                  }}>
                  {PACKAGING_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.key} textValue={option.label}>
                      {option.label}
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

        <form.Field name='stockUnit'>
          {(field) => {
            const unitValue = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <Select
                  label='Stock Unit'
                  selectedKeys={unitValue ? [unitValue] : []}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0]
                    field.handleChange(key != null ? String(key) : '')
                  }}
                  onBlur={field.handleBlur}
                  placeholder='Select stock unit'
                  variant='bordered'
                  disallowEmptySelection={false}
                  classNames={{
                    ...commonInputClassNames,
                    ...commonSelectClassNames,
                    mainWrapper: 'py-0',
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

        <form.Field name='startingWeight'>
          {(field) => {
            const value = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <Input
                  label='Starting Weight'
                  type='number'
                  step='0.01'
                  value={value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='e.g., 160'
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

        <form.Field name='remainingWeight'>
          {(field) => {
            const value = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <Input
                  label='Remaining Weight'
                  type='number'
                  step='0.01'
                  value={value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='e.g., 142.5'
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
                    ...commonSelectClassNames,
                    mainWrapper: 'py-0',
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
