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
import {ProductFormValues} from '../product-schema'
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
  const basicFields = fields.slice(2, 8)
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

        <div className='items-center grid md:grid-cols-3 gap-4 md:gap-2'>
          {basicFields.length > 0 &&
            renderFields(form, basicFields, selectCategories)}
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
