'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {Textarea} from '@heroui/react'
import {ProductFormApi} from '../product-schema'
import {FormSection, Header} from './components'

interface DetailsProps {
  form: ProductFormApi
}

export const Details = ({form}: DetailsProps) => {
  return (
    <FormSection id='details' position='bottom'>
      <Header label='Description & Details' />
      <div className='grid gap-6'>
        <form.Field name='shortDescription'>
          {(field) => {
            const shortDescValue = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <Textarea
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

        <form.Field name='description'>
          {(field) => {
            const descValue = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <Textarea
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

        <form.Field name='consumption'>
          {(field) => {
            const consumptionValue = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <Textarea
                  label='Consumption Guide'
                  value={consumptionValue}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='Tips for consumption...'
                  minRows={3}
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
      </div>
    </FormSection>
  )
}
