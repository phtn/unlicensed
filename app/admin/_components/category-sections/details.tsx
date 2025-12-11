'use client'

import {Textarea, Input} from '@heroui/react'
import {CategoryFormApi} from '../category-schema'
import {FormSection, Header} from './components'

interface DetailsProps {
  form: CategoryFormApi
}

export const Details = ({form}: DetailsProps) => {
  return (
    <FormSection id='details' position='bottom'>
      <Header label='Additional Details' />
      <div className='grid gap-6'>
        <form.AppField name='description'>
          {(field) => {
            const descValue = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-neutral-300'>
                  Description
                </label>
                <Textarea
                  value={descValue}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='Describe the category experience...'
                  minRows={6}
                  variant='bordered'
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

        <form.AppField name='highlight'>
          {(field) => {
            const highlightValue = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-neutral-300'>
                  Highlight <span className='text-neutral-500'>(optional)</span>
                </label>
                <Input
                  value={highlightValue}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='Hand-trimmed buds with rich terpene expression.'
                  variant='bordered'
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

        <form.AppField name='benefitsRaw'>
          {(field) => {
            const benefitsValue = (field.state.value as string) ?? ''
            return (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-neutral-300'>
                  Benefits <span className='text-neutral-500'>(optional)</span>
                </label>
                <Textarea
                  value={benefitsValue}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='Enter one benefit per line\ne.g.\nFull-spectrum cannabinoids'
                  minRows={4}
                  variant='bordered'
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
