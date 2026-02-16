'use client'

import {
  commonInputClassNames,
  FormInput,
  renderFields,
} from '@/app/admin/_components/ui/fields'
import {useAppForm} from '@/app/admin/_components/ui/form-context'
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
  useDisclosure,
} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useEffect, useMemo, useState} from 'react'
import {
  getProductBaseOptionsByCategory,
  getProductTierOptionsByCategory,
  ProductFormValues,
} from '../product-schema'
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
    if (!categories) return []
    return [...categories].sort((a, b) => a.name.localeCompare(b.name))
  }, [categories])

  const selectCategories = useMemo(
    () =>
      availableCategories
        .filter((c) => c.slug)
        .map((c) => ({value: c.slug!, label: c.name})),
    [availableCategories],
  )

  const defaultProductTypeOptions = useMemo(() => {
    const field = fields.find((entry) => entry.name === 'productType')
    return field?.type === 'select' ? field.options : []
  }, [fields])

  const defaultTierOptions = useMemo(() => {
    const field = fields.find((entry) => entry.name === 'tier')
    return field?.type === 'select' ? field.options : []
  }, [fields])

  const defaultBaseOptions = useMemo(() => {
    const field = fields.find((entry) => entry.name === 'base')
    return field?.type === 'select' ? field.options : []
  }, [fields])

  // Separate top-row fields from other basic info fields
  const nameField = fields.find((field) => field.name === 'name')
  const slugField = fields.find((field) => field.name === 'slug')
  const baseField = fields.find((field) => field.name === 'base')
  const basicFieldNames = useMemo(
    () =>
      new Set([
        'categorySlug',
        'subcategory',
        'productType',
        'brand',
        'tier',
        'batchId',
      ]),
    [],
  )
  const basicFields = useMemo(
    () =>
      fields.filter((field) =>
        basicFieldNames.has(field.name as string),
      ),
    [basicFieldNames, fields],
  )
  const selectedCategory = useMemo(() => {
    if (!categorySlug) return null
    return availableCategories.find(
      (category) => category.slug === categorySlug,
    )
  }, [availableCategories, categorySlug])

  const subcategoryOptions = useMemo(() => {
    if (!selectedCategory?.subcategories) return []
    return [...new Set(selectedCategory.subcategories.map((s) => s.trim()))]
      .filter((s) => s.length > 0)
      .map((s) => ({value: s, label: s}))
  }, [selectedCategory])

  const productTypeOptions = useMemo(() => {
    if (!selectedCategory?.productTypes) return defaultProductTypeOptions
    return [...new Set(selectedCategory.productTypes.map((s) => s.trim()))]
      .filter((s) => s.length > 0)
      .map((s) => ({value: s, label: s}))
  }, [defaultProductTypeOptions, selectedCategory])

  const tierOptions = useMemo(() => {
    if (!categorySlug) return defaultTierOptions
    return getProductTierOptionsByCategory(categorySlug)
  }, [categorySlug, defaultTierOptions])

  const baseOptions = useMemo(() => {
    if (!categorySlug) return defaultBaseOptions
    return getProductBaseOptionsByCategory(categorySlug)
  }, [categorySlug, defaultBaseOptions])

  useEffect(() => {
    const currentProductType =
      (form.getFieldValue('productType') as string) ?? ''
    const currentSubcategory =
      (form.getFieldValue('subcategory') as string) ?? ''
    const currentTier = (form.getFieldValue('tier') as string) ?? ''
    const currentBase = (form.getFieldValue('base') as string) ?? ''

    if (
      currentProductType &&
      selectedCategory &&
      !productTypeOptions.some((option) => option.value === currentProductType)
    ) {
      form.setFieldValue('productType', '')
    }

    if (
      currentSubcategory &&
      selectedCategory &&
      !subcategoryOptions.some((option) => option.value === currentSubcategory)
    ) {
      form.setFieldValue('subcategory', '')
    }

    if (
      currentTier &&
      !tierOptions.some((option) => option.value === currentTier)
    ) {
      form.setFieldValue('tier', undefined)
    }

    if (
      currentBase &&
      !baseOptions.some((option) => option.value === currentBase)
    ) {
      form.setFieldValue('base', '')
    }
  }, [
    baseOptions,
    form,
    productTypeOptions,
    selectedCategory,
    subcategoryOptions,
    tierOptions,
  ])

  return (
    <FormSection id='basic-info' position='top'>
      <div className='flex items-center'>
        <Header label='Basic Information'>
          <Button
            size='sm'
            radius='none'
            color='danger'
            variant='faded'
            onPress={onOpen}
            isDisabled={!onArchiveProduct}
            isLoading={isArchiving}
            className='rounded-sm flex-1'>
            Delete
          </Button>
        </Header>
      </div>
      <div className='grid gap-6 w-full'>
        <div className='grid gap-4 md:grid-cols-3 md:gap-2 items-start w-full'>
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
          {baseField?.type === 'select' && (
            <form.AppField name='base'>
              {(input) => (
                <input.SelectField
                  {...input}
                  type='select'
                  name='base'
                  mode='single'
                  label={baseField.label}
                  placeholder={baseField.placeholder}
                  options={baseOptions}
                  classNames={{mainWrapper: 'py-0'}}
                />
              )}
            </form.AppField>
          )}
        </div>

        <div className='items-center grid md:grid-cols-3 gap-4 md:gap-2'>
          {basicFields.length > 0 &&
            renderFields(form, basicFields, selectCategories, {
              productType: productTypeOptions,
              tier: tierOptions,
            })}
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
