'use client'

import {
  TextureCard,
  TextureCardContent,
  TextureCardHeader,
  TextureCardTitle,
} from '@/components/ui/texture-card'
import {Doc} from '@/convex/_generated/dataModel'
import {ensureSlug} from '@/lib/slug'
import {Input, Select, SelectItem} from '@heroui/react'
import {useMemo, useState} from 'react'
import {ProductFormApi} from '../product-schema'

interface BasicInfoProps {
  form: ProductFormApi
  categories: Doc<'categories'>[] | undefined
}

export const BasicInfo = ({form, categories}: BasicInfoProps) => {
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const availableCategories = useMemo(() => {
    return categories?.sort((a, b) => a.name.localeCompare(b.name))
  }, [categories])

  const selectCategories = useMemo(
    () => availableCategories?.map((c) => ({key: c.slug, label: c.name})),
    [availableCategories],
  )

  return (
    <TextureCard id='basic-info'>
      <TextureCardHeader>
        <TextureCardTitle>Basic Information</TextureCardTitle>
      </TextureCardHeader>
      <TextureCardContent className='grid gap-6'>
        <form.Field name='name'>
          {(field) => (
            <div className='space-y-2'>
              <label className='text-sm font-medium text-neutral-300'>
                Name
              </label>
              <Input
                value={field.state.value}
                onChange={(e) => {
                  const nextName = e.target.value
                  field.handleChange(nextName)
                  if (!slugManuallyEdited) {
                    form.setFieldValue('slug', ensureSlug('', nextName))
                  }
                }}
                onBlur={field.handleBlur}
                placeholder='Product Name'
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
          )}
        </form.Field>

        <form.Field name='slug'>
          {(field) => (
            <div className='space-y-2'>
              <label className='text-sm font-medium text-neutral-300'>
                Slug
              </label>
              <Input
                value={field.state.value}
                onChange={(e) => {
                  setSlugManuallyEdited(true)
                  field.handleChange(e.target.value)
                }}
                onBlur={field.handleBlur}
                placeholder='product-slug'
                variant='bordered'
                // classNames={{
                //   inputWrapper:
                //     'bg-neutral-900 border-neutral-800 data-[hover=true]:border-neutral-700 group-data-[focus=true]:border-emerald-500',
                // }}
              />
              <p className='text-xs text-neutral-500'>
                URL-friendly version of the name.
              </p>
            </div>
          )}
        </form.Field>

        <form.Field name='categorySlug'>
          {(field) => (
            <div className='space-y-2'>
              <label className='text-sm font-medium text-neutral-300'>
                Category
              </label>
              <Select
                selectedKeys={field.state.value ? [field.state.value] : []}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder='Select a category'>
                {(selectCategories || []).map((c) => (
                  <SelectItem key={c.key} textValue={c.label}>
                    {c.label}
                  </SelectItem>
                ))}
              </Select>
              {field.state.meta.isTouched &&
                field.state.meta.errors.length > 0 && (
                  <p className='text-xs text-rose-400'>
                    {field.state.meta.errors.join(', ')}
                  </p>
                )}
            </div>
          )}
        </form.Field>
      </TextureCardContent>
    </TextureCard>
  )
}
