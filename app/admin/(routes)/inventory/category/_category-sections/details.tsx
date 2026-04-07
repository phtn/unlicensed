'use client'

import {Input, Label, TextArea} from '@heroui/react'
import {CategoryFormApi} from '../category-schema'
import {FormSection, Header} from './components'

interface DetailsProps {
  form: CategoryFormApi
}

export const Details = ({form}: DetailsProps) => {
  return (
    <FormSection id='details' position='bottom'>
      <Header label='Additional Details' />
      <div className='grid gap-4'>
        <div className='grid w-full gap-4 lg:grid-cols-2'>
          <form.AppField name='description'>
            {(field) => {
              const descValue = (field.state.value as string) ?? ''
              return (
                <div className='flex flex-col space-y-2 w-full'>
                  <Label htmlFor='description'>Description</Label>
                  <TextArea
                    id='description'
                    value={descValue}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder='Describe the category experience...'
                    rows={4}
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
          </form.AppField>
          <form.AppField name='benefitsRaw'>
            {(field) => {
              const benefitsValue = (field.state.value as string) ?? ''
              return (
                <div className='flex flex-col space-y-2 w-full'>
                  <Label htmlFor='benefits'>Benefits</Label>
                  <TextArea
                    id='benefits'
                    value={benefitsValue}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder='Enter one benefit per line e.g. Full-spectrum cannabinoids'
                    rows={4}
                    variant='secondary'
                    // classNames={commonInputClassNames}
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
              <div className='flex flex-col space-y-2 w-full'>
                <Label htmlFor='highlight'>Highlight</Label>
                <Input
                  id='Highlight'
                  value={highlightValue}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  variant='secondary'
                  placeholder='Hand-trimmed buds with rich terpene expression.'
                  // classNames={commonInputClassNames}
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
