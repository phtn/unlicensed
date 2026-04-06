'use client'

import {ensureSlug} from '@/lib/slug'
import {useState} from 'react'
import {FormInput} from '../../../../_components/ui/fields'
import {useAppForm} from '../../../../_components/ui/form-context'
import {CategoryFormValues} from '../category-schema'
import {FormSection, Header} from './components'

interface BasicInfoProps {
  form: ReturnType<typeof useAppForm>
  fields: Array<FormInput<CategoryFormValues>>
}

export const BasicInfo = ({form, fields}: BasicInfoProps) => {
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  // Separate name and slug fields
  const nameField = fields.find((field) => field.name === 'name')
  const slugField = fields.find((field) => field.name === 'slug')

  return (
    <FormSection id='basic-info' position='top'>
      <Header label='Basic Information' />
      <div className='grid gap-6 w-full'>
        <div className='grid w-full gap-4 md:grid-cols-2'>
          {nameField && (
            <form.AppField name='name'>
              {(input) => (
                <div className='space-y-2 w-full'>
                  <input.TextField
                    type='text'
                    label={'name'}
                    id={input.name}
                    value={String(input.state.value ?? '')}
                    onChange={(e) => {
                      const nextName = e.target.value
                      input.handleChange(nextName)
                      if (!slugManuallyEdited) {
                        form.setFieldValue('slug', ensureSlug('', nextName))
                      }
                    }}
                    onBlur={input.handleBlur}
                    placeholder={nameField.placeholder}
                    // classNames={commonInputClassNames}
                  />
                  {input.state.meta.isTouched &&
                    input.state.meta.errors.length > 0 && (
                      <p className='text-xs text-rose-400'>
                        {input.state.meta.errors.join(', ')}
                      </p>
                    )}
                </div>
              )}
            </form.AppField>
          )}
          {slugField && (
            <form.AppField name='slug'>
              {(input) => (
                <div className='space-y-2 w-full'>
                  <input.TextField
                    type='text'
                    label={'Slug'}
                    id='slug'
                    value={String(input.state.value ?? '')}
                    onChange={(e) => {
                      input.handleChange(e.target.value)
                      setSlugManuallyEdited(true)
                    }}
                    onBlur={input.handleBlur}
                    placeholder={slugField.placeholder}
                    // classNames={commonInputClassNames}
                  />
                  {input.state.meta.isTouched &&
                    input.state.meta.errors.length > 0 && (
                      <p className='text-xs text-rose-400'>
                        {input.state.meta.errors.join(', ')}
                      </p>
                    )}
                </div>
              )}
            </form.AppField>
          )}
        </div>
      </div>
    </FormSection>
  )
}
