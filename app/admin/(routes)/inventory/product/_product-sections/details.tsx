'use client'

import {ProductFormApi} from '../product-schema'
import {FormSection, Header} from './components'

interface DetailsProps {
  form: ProductFormApi
}

export const Details = ({form}: DetailsProps) => {
  return (
    <FormSection position='bottom'>
      <Header label='Description & Details' />
      <div className='grid gap-4'>
        <form.AppField name='shortDescription'>
          {(field) => {
            const shortDescValue = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <field.TextAreaField
                  type='text'
                  name='shortDescription'
                  label='Short Description'
                  value={shortDescValue}
                  onChange={(e) => {
                    e.preventDefault()
                    field.handleChange(e.target.value)
                  }}
                  onBlur={field.handleBlur}
                  placeholder='Brief summary for cards and listings...'
                  minRows={2}
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

        <form.AppField name='description'>
          {(field) => {
            const descValue = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <field.TextAreaField
                  type='text'
                  label='Full Description (Markdown)'
                  name='fullDescription'
                  defaultValue={descValue}
                  onChange={(e) => {
                    e.preventDefault()
                    field.handleChange(e.target.value)
                  }}
                  onBlur={field.handleBlur}
                  placeholder='Detailed product story, lineage, and effects...'
                  minRows={6}
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

        <form.AppField name='consumption'>
          {(field) => {
            const consumptionValue = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <field.TextAreaField
                  type='text'
                  label='Smoke / Consumption Guide'
                  value={consumptionValue}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='Tips for consumption...'
                  minRows={3}
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
