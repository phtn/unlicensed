'use client'

import {ProductFormApi} from '../product-schema'
import {FormSection, Header} from './components'

interface PackagingProps {
  form: ProductFormApi
}

const NET_WEIGHT_UNIT_OPTIONS = [
  {value: 'mg', label: 'mg (milligrams)'},
  {value: 'g', label: 'g (grams)'},
  {value: 'kg', label: 'kg (kilograms)'},
  {value: 'oz', label: 'oz (ounces)'},
  {value: 'lb', label: 'lb (pounds)'},
  {value: 'ml', label: 'ml (milliliters)'},
  {value: 'l', label: 'l (liters)'},
  {value: 'each', label: 'each'},
  {value: 'unit', label: 'unit'},
]

const PACKAGING_MODE_OPTIONS = [
  {value: 'bulk', label: 'Bulk'},
  {value: 'prepack', label: 'Prepack'},
]

export const Packaging = ({form}: PackagingProps) => {
  return (
    <FormSection>
      <Header label='Packaging' />
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <form.AppField name='packagingMode'>
          {(field) => {
            return (
              <div className='space-y-2 md:col-span-2'>
                <field.SelectField
                  name='packagingMode'
                  type='select'
                  mode='single'
                  value={String(field.state.value) ?? ''}
                  // onChange={(keys) => {
                  //   const key = getSingleSelectedKey(keys)
                  //   field.handleChange(key != null ? String(key) : '')
                  // }}
                  label='Packaging Mode'
                  placeholder='Select packaging mode'
                  options={PACKAGING_MODE_OPTIONS}
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
        </form.AppField>

        <form.AppField name='stockUnit'>
          {(field) => {
            const unitValue = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <field.SelectField
                  name='stockUnit'
                  type='select'
                  mode='single'
                  label='Stock Unit'
                  value={unitValue ? [unitValue] : []}
                  // onChange={(keys) => {
                  //   const key = getSingleSelectedKey(keys)
                  //   field.handleChange(key != null ? String(key) : '')
                  // }}
                  placeholder='Select stock unit'
                  options={NET_WEIGHT_UNIT_OPTIONS}
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
        </form.AppField>
        <form.AppField name='packSize'>
          {(field) => {
            const value = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <field.NumberField
                  label='Pack Size'
                  type='number'
                  step='1'
                  value={value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='10'
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
        </form.AppField>
        <form.AppField name='startingWeight'>
          {(field) => {
            const value = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <field.TextField
                  label='Starting Weight / Count'
                  type='number'
                  step='0.01'
                  value={value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='e.g., 160'
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
        </form.AppField>

        <form.AppField name='remainingWeight'>
          {(field) => {
            const value = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <field.NumberField
                  label='Remaining Weight / Count'
                  type='number'
                  step='0.01'
                  value={value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='e.g., 142.5'
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
        </form.AppField>

        <form.AppField name='netWeight'>
          {(field) => {
            const value = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <field.NumberField
                  label='Net Weight'
                  type='number'
                  step='0.01'
                  value={value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='e.g., 3.5'
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
        </form.AppField>

        <form.AppField name='netWeightUnit'>
          {(field) => {
            const unitValue = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <field.SelectField
                  name='netWeightUnit'
                  type='select'
                  mode='single'
                  label='Net Weight Unit'
                  value={unitValue ? [unitValue] : []}
                  // onChange={(keys) => {
                  //   const key = getSingleSelectedKey(keys)
                  //   field.handleChange(key != null ? String(key) : '')
                  // }}
                  placeholder='Select unit'
                  options={NET_WEIGHT_UNIT_OPTIONS}
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
        </form.AppField>
      </div>
    </FormSection>
  )
}
