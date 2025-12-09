'use client'

import {Doc} from '@/convex/_generated/dataModel'
import {ensureSlug} from '@/lib/slug'
import {Input} from '@heroui/react'
import {useMemo, useState} from 'react'
import {ProductFormValues} from '../product-schema'
import {commonInputClassNames, FormInput, renderFields} from '../ui/fields'
import {useAppForm} from '../ui/form-context'
import {FormSection, Header} from './components'

interface BasicInfoProps {
  categories: Doc<'categories'>[] | undefined
  form: ReturnType<typeof useAppForm>
  fields: Array<FormInput<ProductFormValues>>
}

export const BasicInfo = ({categories, form, fields}: BasicInfoProps) => {
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const availableCategories = useMemo(() => {
    return categories?.sort((a, b) => a.name.localeCompare(b.name))
  }, [categories])

  const selectCategories = useMemo(
    () => availableCategories?.map((c) => ({value: c.slug, label: c.name})),
    [availableCategories],
  )

  // Separate name and slug fields from other fields
  const nameField = fields.find((field) => field.name === 'name')
  const slugField = fields.find((field) => field.name === 'slug')
  const otherFields = fields.filter(
    (field) => field.name !== 'name' && field.name !== 'slug',
  )

  return (
    <FormSection id='basic-info' position='top'>
      <Header label='Basic Information' />
      <div className='grid gap-6 w-full'>
        <div className='flex w-full space-x-2'>
          {nameField && (
            <form.AppField name='name'>
              {(input) => (
                <div className='space-y-2 w-full'>
                  <Input
                    size='lg'
                    label={nameField.label}
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
                    variant='bordered'
                    classNames={commonInputClassNames}
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
                  <Input
                    size='lg'
                    label={slugField.label}
                    value={String(input.state.value ?? '')}
                    onChange={(e) => {
                      input.handleChange(e.target.value)
                      setSlugManuallyEdited(true)
                    }}
                    onBlur={input.handleBlur}
                    placeholder={slugField.placeholder}
                    classNames={commonInputClassNames}
                    variant='bordered'
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
        {otherFields.length > 0 &&
          renderFields(form, otherFields, selectCategories)}
      </div>
    </FormSection>
  )
}
