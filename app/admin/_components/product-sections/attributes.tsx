'use client'

import {Input, Slider} from '@heroui/react'
import {ChangeEvent} from 'react'
import {ProductFormApi} from '../product-schema'
import {TagSelector} from '../tag-selector'
import {commonInputClassNames, NumberField, SelectField} from '../ui/fields'
import {FormSection, Header} from './components'

interface AttributesProps {
  form: ProductFormApi
}

export const Attributes = ({form}: AttributesProps) => {
  return (
    <FormSection id='attributes'>
      <Header label='Attributes & Profile' />
      <div className='grid gap-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-center'>
          <form.AppField name='potencyLevel'>
            {(field) => (
              <SelectField
                {...field}
                type='select'
                name='potencyLevel'
                mode='single'
                label='Potency Level'
                options={[
                  {value: 'mild', label: 'Mild'},
                  {value: 'medium', label: 'Medium'},
                  {value: 'high', label: 'High'},
                ]}
              />
            )}
          </form.AppField>

          <form.AppField name='thcPercentage'>
            {(field) => (
              <NumberField
                {...field}
                type='number'
                name='thcPercentage'
                label='THC %'
                placeholder='0.0'
              />
            )}
          </form.AppField>

          <form.Field name='cbdPercentage'>
            {(field) => {
              const cbdValue = (field.state.value as string) ?? ''
              return (
                <div className='space-y-2'>
                  <Input
                    label='CBD %'
                    type='number'
                    step='0.1'
                    value={cbdValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      field.handleChange(e.target.value)
                    }
                    onBlur={field.handleBlur}
                    placeholder='0.0'
                    variant='bordered'
                    size='lg'
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
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 w-full gap-6'>
          <form.Field name='terpenes'>
            {(field) => (
              <div className='space-y-2 w-full'>
                <TagSelector
                  label='Terpenes'
                  type='terpenes'
                  placeholder='Select terpenes...'
                  selectedKeys={
                    Array.isArray(field.state.value) ? field.state.value : []
                  }
                  onSelectionChange={(keys) => field.handleChange(keys)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name='flavors'>
            {(field) => (
              <div className='space-y-2 w-full'>
                <TagSelector
                  label='Flavors'
                  type='flavors'
                  placeholder='Select flavors...'
                  selectedKeys={
                    Array.isArray(field.state.value) ? field.state.value : []
                  }
                  onSelectionChange={(keys) => field.handleChange(keys)}
                />
              </div>
            )}
          </form.Field>
          <form.Field name='effects'>
            {(field) => (
              <div className='space-y-2 w-full'>
                <TagSelector
                  label='Effects'
                  type='effects'
                  placeholder='Select Effects...'
                  selectedKeys={
                    Array.isArray(field.state.value) ? field.state.value : []
                  }
                  onSelectionChange={(keys) => field.handleChange(keys)}
                />
              </div>
            )}
          </form.Field>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <form.Field name='lineage'>
            {(field) => {
              const value = (field.state.value as string) ?? ''
              return (
                <div className='space-y-2'>
                  <Input
                    label='Lineage'
                    type='text'
                    value={value}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      field.handleChange(e.target.value)
                    }
                    onBlur={field.handleBlur}
                    placeholder='e.g., OG Kush x Sour Diesel'
                    variant='bordered'
                    size='lg'
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

          <form.Field name='noseRating'>
            {(field) => {
              const value =
                typeof field.state.value === 'number' ? field.state.value : 0
              return (
                <div className='space-y-2'>
                  <Slider
                    label='Nose Rating'
                    minValue={0}
                    maxValue={10}
                    step={1}
                    showSteps
                    value={value}
                    onChange={(v) =>
                      field.handleChange(Array.isArray(v) ? v[0] ?? 0 : v)
                    }
                    getValue={(v) =>
                      `${Array.isArray(v) ? v[0] ?? 0 : v}/10`
                    }
                    classNames={{
                      base: 'max-w-full',
                    }}
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
        </div>
      </div>
    </FormSection>
  )
}
