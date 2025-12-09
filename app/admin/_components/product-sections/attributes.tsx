'use client'

import {Input, Select, SelectItem} from '@heroui/react'
import {ProductFormApi} from '../product-schema'
import {TagSelector} from '../tag-selector'
import {NumberField, SelectField} from '../ui/fields'
import {FormSection, Header} from './components'

interface AttributesProps {
  form: ProductFormApi
}

export const Attributes = ({form}: AttributesProps) => {
  return (
    <FormSection id='attributes'>
      <Header label='Attributes & Profile' />
      <div className='grid gap-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
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
                  <label className='text-sm font-medium text-neutral-300'>
                    CBD %
                  </label>
                  <Input
                    type='number'
                    step='0.1'
                    value={cbdValue}
                    onChange={(e) => field.handleChange(e.target.value)}
                    variant='bordered'
                    // classNames={{
                    //   inputWrapper: 'bg-neutral-900 border-neutral-800',
                    // }}
                  />
                </div>
              )
            }}
          </form.Field>
        </div>

        <form.Field name='terpenes'>
          {(field) => (
            <div className='space-y-2'>
              <TagSelector
                label='Terpenes'
                type='terpene'
                placeholder='Select terpenes...'
                selectedKeys={Array.isArray(field.state.value) ? field.state.value : []}
                onSelectionChange={(keys) => field.handleChange(keys)}
              />
            </div>
          )}
        </form.Field>

        <form.Field name='flavors'>
          {(field) => (
            <div className='space-y-2'>
              <TagSelector
                label='Flavors'
                type='flavor'
                placeholder='Select flavors...'
                selectedKeys={Array.isArray(field.state.value) ? field.state.value : []}
                onSelectionChange={(keys) => field.handleChange(keys)}
              />
            </div>
          )}
        </form.Field>
      </div>
    </FormSection>
  )
}
