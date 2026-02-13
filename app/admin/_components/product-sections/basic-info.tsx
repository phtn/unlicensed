'use client'

import {Doc} from '@/convex/_generated/dataModel'
import {ensureSlug} from '@/lib/slug'
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useEffect, useMemo, useState} from 'react'
import {ProductFormValues} from '../product-schema'
import {commonInputClassNames, FormInput, renderFields} from '../ui/fields'
import {useAppForm} from '../ui/form-context'
import {FormSection, Header} from './components'

interface BasicInfoProps {
  categories: Doc<'categories'>[] | undefined
  form: ReturnType<typeof useAppForm>
  fields: Array<FormInput<ProductFormValues>>
  onArchiveProduct?: () => void | Promise<void>
  isArchiving?: boolean
}

export const BasicInfo = ({
  categories,
  form,
  fields,
  onArchiveProduct,
  isArchiving = false,
}: BasicInfoProps) => {
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const {isOpen, onOpen, onClose, onOpenChange} = useDisclosure()
  const categorySlug = useStore(form.store, (state) => {
    const values = state.values as {categorySlug?: string}
    return values.categorySlug ?? ''
  })

  const availableCategories = useMemo(() => {
    return categories?.sort((a, b) => a.name.localeCompare(b.name))
  }, [categories])

  const selectCategories = useMemo(
    () =>
      availableCategories
        ?.filter((c) => c.slug)
        .map((c) => ({value: c.slug!, label: c.name})),
    [availableCategories],
  )

  // Separate name and slug fields from other fields
  const nameField = fields.find((field) => field.name === 'name')
  const slugField = fields.find((field) => field.name === 'slug')
  const basicFields = fields.filter(
    (field) => field.name === 'categorySlug' || field.name === 'brand',
  )
  const selectedCategory = useMemo(() => {
    if (!availableCategories || !categorySlug) return null
    return availableCategories.find(
      (category) => category.slug === categorySlug,
    )
  }, [availableCategories, categorySlug])

  const subcategoryOptions = useMemo(() => {
    if (!selectedCategory?.subcategories) return []
    return [...new Set(selectedCategory.subcategories.map((s) => s.trim()))]
      .filter((s) => s.length > 0)
      .map((s) => ({key: s, label: s}))
  }, [selectedCategory])

  const productTypeOptions = useMemo(() => {
    if (!selectedCategory?.productTypes) return []
    return [...new Set(selectedCategory.productTypes.map((s) => s.trim()))]
      .filter((s) => s.length > 0)
      .map((s) => ({key: s, label: s}))
  }, [selectedCategory])

  useEffect(() => {
    const currentProductType =
      (form.getFieldValue('productType') as string) ?? ''
    const currentSubcategory =
      (form.getFieldValue('subcategory') as string) ?? ''

    if (
      currentProductType &&
      productTypeOptions.length > 0 &&
      !productTypeOptions.some((option) => option.key === currentProductType)
    ) {
      form.setFieldValue('productType', '')
    }

    if (
      currentSubcategory &&
      subcategoryOptions.length > 0 &&
      !subcategoryOptions.some((option) => option.key === currentSubcategory)
    ) {
      form.setFieldValue('subcategory', '')
    }
  }, [form, productTypeOptions, subcategoryOptions])

  return (
    <FormSection id='basic-info' position='top'>
      <div className='flex items-center'>
        <Header label='Basic Information'>
          <Button
            size='sm'
            radius='none'
            color='danger'
            onPress={onOpen}
            isDisabled={!onArchiveProduct}
            isLoading={isArchiving}
            className='rounded-sm flex-1'>
            Delete
          </Button>
        </Header>
      </div>
      <div className='grid gap-6 w-full'>
        <div className='md:flex items-center w-full space-x-2'>
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

        <div className='items-center grid grid-cols-1 md:grid-cols-2 gap-x-2'>
          {basicFields.length > 0 &&
            renderFields(form, basicFields, selectCategories)}
        </div>

        <div className='items-center grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-6'>
          <form.Field name='subcategory'>
            {(field) => {
              const currentValue = (field.state.value as string) ?? ''
              const options =
                currentValue &&
                !subcategoryOptions.some((o) => o.key === currentValue)
                  ? [
                      {key: currentValue, label: currentValue},
                      ...subcategoryOptions,
                    ]
                  : subcategoryOptions
              const hasOptions = options.length > 0
              return (
                <div className='space-y-2 w-full'>
                  <Select
                    label='Subcategory'
                    selectedKeys={currentValue ? [currentValue] : []}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0]
                      field.handleChange(key != null ? String(key) : '')
                    }}
                    onBlur={field.handleBlur}
                    placeholder={
                      hasOptions
                        ? 'Select subcategory'
                        : 'No subcategories configured for this category'
                    }
                    variant='bordered'
                    isDisabled={!hasOptions}
                    disallowEmptySelection={false}
                    classNames={{
                      ...commonInputClassNames,
                      trigger:
                        'border h-16 border-light-gray/50 dark:border-black/20 bg-light-gray/10 shadow-none dark:bg-black/60 rounded-lg p-2 outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500',
                      label:
                        'mb-2 pl-0.5 opacity-80 font-medium tracking-widest uppercase text-sm',
                    }}>
                    {options.map((option) => (
                      <SelectItem key={option.key} textValue={option.label}>
                        {option.label}
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
              )
            }}
          </form.Field>

          <form.Field name='productType'>
            {(field) => {
              const currentValue = (field.state.value as string) ?? ''
              const options =
                currentValue &&
                !productTypeOptions.some((o) => o.key === currentValue)
                  ? [
                      {key: currentValue, label: currentValue},
                      ...productTypeOptions,
                    ]
                  : productTypeOptions
              const hasOptions = options.length > 0
              return (
                <div className='space-y-2 w-full'>
                  <Select
                    label='Product Type'
                    selectedKeys={currentValue ? [currentValue] : []}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0]
                      field.handleChange(key != null ? String(key) : '')
                    }}
                    onBlur={field.handleBlur}
                    placeholder={
                      hasOptions
                        ? 'Select product type'
                        : 'No product types configured for this category'
                    }
                    variant='bordered'
                    isDisabled={!hasOptions}
                    disallowEmptySelection={false}
                    classNames={{
                      ...commonInputClassNames,
                      trigger:
                        'border h-16 border-light-gray/50 dark:border-black/20 bg-light-gray/10 shadow-none dark:bg-black/60 rounded-lg p-2 outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500',
                      label:
                        'mb-2 pl-0.5 opacity-80 font-medium tracking-widest uppercase text-sm',
                    }}>
                    {options.map((option) => (
                      <SelectItem key={option.key} textValue={option.label}>
                        {option.label}
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
              )
            }}
          </form.Field>
        </div>
      </div>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement='center'
        backdrop='blur'>
        <ModalContent>
          <ModalHeader>Archive Product</ModalHeader>
          <ModalBody>
            <p className='text-sm text-foreground-600'>
              This will archive the product and remove it from product lists.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant='light' onPress={onClose} isDisabled={isArchiving}>
              Cancel
            </Button>
            <Button
              color='danger'
              isLoading={isArchiving}
              onPress={async () => {
                await onArchiveProduct?.()
                onClose()
              }}>
              Archive
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FormSection>
  )
}
