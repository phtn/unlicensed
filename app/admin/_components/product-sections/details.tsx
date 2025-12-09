'use client'

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
                <label className='text-sm font-medium text-neutral-300'>
                  Short Description
                </label>
                <Textarea
                  value={shortDescValue}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='Brief summary for cards and listings...'
                  minRows={2}
                  variant='bordered'
                  // classNames={{
                  //   inputWrapper: 'bg-neutral-900 border-neutral-800 data-[hover=true]:border-neutral-700 group-data-[focus=true]:border-emerald-500',
                  // }}
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
                <label className='text-sm font-medium text-neutral-300'>
                  Full Description (Markdown)
                </label>
                <Textarea
                  value={descValue}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='Detailed product story, lineage, and effects...'
                  minRows={6}
                  variant='bordered'
                  // classNames={{
                  //   inputWrapper: 'bg-neutral-900 border-neutral-800 data-[hover=true]:border-neutral-700 group-data-[focus=true]:border-emerald-500',
                  // }}
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
                <label className='text-sm font-medium text-neutral-300'>
                  Consumption Guidance
                </label>
                <Textarea
                  value={consumptionValue}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='Tips for consumption...'
                  minRows={3}
                  variant='bordered'
                  // classNames={{
                  //   inputWrapper: 'bg-neutral-900 border-neutral-800 data-[hover=true]:border-neutral-700 group-data-[focus=true]:border-emerald-500',
                  // }}
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
