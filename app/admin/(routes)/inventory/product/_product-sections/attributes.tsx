'use client'

import {TagSelector} from '@/app/admin/_components/tag-selector'
import {NumberField, SelectField} from '@/app/admin/_components/ui/fields'
import {Input, Label, Slider} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {ChangeEvent} from 'react'
import {ProductFormApi} from '../product-schema'
import {FormSection, Header} from './components'

interface AttributesProps {
  form: ProductFormApi
}

export const Attributes = ({form}: AttributesProps) => {
  const categorySlug = useStore(form.store, (state) => {
    const values = state.values as {categorySlug?: string}
    return values.categorySlug
  })
  const isVapeCategory = categorySlug === 'vapes'

  return (
    <FormSection>
      <Header label='Attributes & Profile' />
      <div className='grid'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 items-center'>
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
                label='THC (mg)'
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
                    type='number'
                    step='0.1'
                    value={cbdValue}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      field.handleChange(e.target.value)
                    }
                    onBlur={field.handleBlur}
                    placeholder='0.0'
                    variant='secondary'
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

        <div className='grid grid-cols-1 sm:grid-cols-3 w-full gap-4 mt-4'>
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

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
          <form.Field name='tags'>
            {(field) => {
              const value = (field.state.value as string) ?? ''
              return (
                <div className='space-y-2'>
                  <Label htmlFor='tags'>Tags · Keywords</Label>
                  <Input
                    type='text'
                    value={value}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      field.handleChange(e.target.value)
                    }
                    onBlur={field.handleBlur}
                    placeholder='limited, kush, afghan'
                    variant='secondary'
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
          <form.Field name='lineage'>
            {(field) => {
              const value = (field.state.value as string) ?? ''
              return (
                <div className='space-y-2'>
                  <Label htmlFor='lineage'>Lineage</Label>
                  <Input
                    id='lineage'
                    type='text'
                    value={value}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      field.handleChange(e.target.value)
                    }
                    onBlur={field.handleBlur}
                    placeholder='e.g., OG Kush x Sour Diesel'
                    variant='secondary'
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

          {!isVapeCategory && (
            <form.Field name='noseRating'>
              {(field) => {
                const value =
                  typeof field.state.value === 'number' ? field.state.value : 0
                return (
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between gap-3'>
                      <Label htmlFor='noseRating'>Nose Rating</Label>
                      <span className='text-sm text-foreground/60'>
                        {value}/10
                      </span>
                    </div>
                    <Slider
                      id='noseRating'
                      minValue={0}
                      maxValue={10}
                      step={1}
                      value={value}
                      onChange={(v) =>
                        field.handleChange(Array.isArray(v) ? (v[0] ?? 0) : v)
                      }
                      className='max-w-full'
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
          )}
        </div>
      </div>
    </FormSection>
  )
}
