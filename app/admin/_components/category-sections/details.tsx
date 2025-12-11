'use client'

import {Input, Textarea} from '@heroui/react'
import {CategoryFormApi} from '../category-schema'
import {commonInputClassNames} from '../ui/fields'
import {FormSection, Header} from './components'

interface DetailsProps {
  form: CategoryFormApi
}

export const Details = ({form}: DetailsProps) => {
  return (
    <FormSection id='details' position='bottom'>
      <Header label='Additional Details' />
      <div className='grid gap-6'>
        <div className='flex items-center space-x-6 w-full'>
          <form.AppField name='description'>
            {(field) => {
              const descValue = (field.state.value as string) ?? ''
              return (
                <div className='space-y-2 w-full'>
                  <Textarea
                    value={descValue}
                    label='Description'
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder='Describe the category experience...'
                    classNames={commonInputClassNames}
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
          <form.AppField name='benefitsRaw'>
            {(field) => {
              const benefitsValue = (field.state.value as string) ?? ''
              return (
                <div className='space-y-2 w-full'>
                  <Textarea
                    label='Benefits'
                    value={benefitsValue}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder='Enter one benefit per line e.g. Full-spectrum cannabinoids'
                    minRows={4}
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
          </form.AppField>
        </div>
        <form.AppField name='highlight'>
          {(field) => {
            const highlightValue = (field.state.value as string) ?? ''
            return (
              <div className=''>
                <Input
                  size='lg'
                  label='Highlight'
                  value={highlightValue}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  variant='bordered'
                  placeholder='Hand-trimmed buds with rich terpene expression.'
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
        </form.AppField>
      </div>
    </FormSection>
  )
}
