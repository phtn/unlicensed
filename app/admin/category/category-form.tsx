'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {ensureSlug} from '@/lib/slug'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useMutation} from 'convex/react'
import {useEffect, useState} from 'react'
import {
  categoryFields,
  CategoryFormApi,
  CategoryFormValues,
  categorySchema,
  defaultValues,
  parseList,
  parseNumbers,
} from '../_components/category-schema'
import {BasicInfo} from '../_components/category-sections/basic-info'
import {Details} from '../_components/category-sections/details'
import {Media} from '../_components/category-sections/media'
import {Packaging} from '../_components/category-sections/packaging'
import {useAppForm} from '../_components/ui/form-context'

type CategoryFormProps = {
  categoryId?: Id<'categories'>
  initialValues?: CategoryFormValues
  onCreated?: VoidFunction
  onUpdated?: VoidFunction
}

const SECTIONS = [
  {id: 'basic-info', label: 'Basic Info', icon: 'file'},
  {id: 'media', label: 'Media', icon: 'image'},
  {id: 'packaging', label: 'Packaging', icon: 'box'},
  {id: 'details', label: 'Details', icon: 'align-left'},
] as const

export const CategoryForm = ({
  categoryId,
  initialValues,
  onCreated,
  onUpdated,
}: CategoryFormProps) => {
  const isEditMode = !!categoryId
  const createCategory = useMutation(api.categories.m.create)
  const updateCategory = useMutation(api.categories.m.update)
  const [activeSection, setActiveSection] = useState<string>('basic-info')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const formValues = initialValues ?? defaultValues

  const form = useAppForm({
    defaultValues: formValues,
    onSubmit: async ({value, formApi}) => {
      setStatus('idle')
      setErrorMessage(null)
      try {
        const parsed = categorySchema.safeParse(value)
        if (!parsed.success) {
          const message =
            parsed.error.issues[0]?.message ??
            'Please review the category form for validation errors.'
          setErrorMessage(message)
          setStatus('error')
          return
        }

        const data = parsed.data
        const payload = {
          name: data.name.trim(),
          slug: ensureSlug(data.slug ?? '', data.name),
          description: data.description.trim(),
          heroImage: data.heroImage,
          highlight: data.highlight?.trim() || undefined,
          benefits: parseList(data.benefitsRaw),
          units: data.unitsRaw
            ? data.unitsRaw
                .split(',')
                .map((u) => u.trim())
                .filter((u) => u.length > 0)
            : undefined,
          denominations: parseNumbers(data.denominationsRaw),
        }

        if (isEditMode && categoryId) {
          await updateCategory({
            categoryId,
            ...payload,
          })
          setStatus('success')
          onUpdated?.()
        } else {
          await createCategory(payload)
          formApi.reset()
          setStatus('success')
          // Reset scroll
          document
            .getElementById('basic-info')
            ?.scrollIntoView({behavior: 'smooth'})
          onCreated?.()
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : isEditMode
              ? 'Failed to update category.'
              : 'Failed to create category.'
        setErrorMessage(message)
        setStatus('error')
      }
    },
  })

  // Populate form when initialValues change
  useEffect(() => {
    if (initialValues) {
      form.setFieldValue('name', initialValues.name)
      form.setFieldValue('slug', initialValues.slug ?? '')
      form.setFieldValue('description', initialValues.description)
      form.setFieldValue('heroImage', initialValues.heroImage)
      form.setFieldValue('highlight', initialValues.highlight ?? '')
      form.setFieldValue('benefitsRaw', initialValues.benefitsRaw ?? '')
      form.setFieldValue('unitsRaw', initialValues.unitsRaw ?? '')
      form.setFieldValue('denominationsRaw', initialValues.denominationsRaw ?? '')
    }
  }, [initialValues, form])

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({behavior: 'smooth', block: 'start'})
    }
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 lg:p-0 items-start h-[calc(100vh-6rem)]'>
      {/* Left Sidebar Navigation */}
      <aside className='hidden lg:block col-span-2 h-full overflow-y-auto pr-2 space-y-6'>
        <nav className='flex flex-col gap-1'>
          <h1 className='text-lg flex items-center space-x-2 tracking-tighter font-semibold py-4 text-dark-gray dark:text-foreground'>
            <div
              aria-hidden
              className='size-4 select-none aspect-square rounded-full bg-emerald-500'
            />
            <span>{isEditMode ? 'Edit Category' : 'Create New Category'}</span>
          </h1>
          {SECTIONS.map((section) => (
            <Button
              size='md'
              disableRipple
              disableAnimation
              variant='light'
              key={section.id}
              onPress={() => scrollToSection(section.id)}
              className={cn(
                'flex justify-start items-center gap-3 px-4 text-base font-medium tracking-tight rounded-xl transition-all text-left',
                activeSection === section.id
                  ? 'dark:bg-zinc-700 dark:text-emerald-300 bg-dark-gray/5 text-emerald-500'
                  : 'text-dark-gray/60 dark:text-light-gray/80 dark:hover:text-emerald-100  hover:bg-dark-gray/5 hover:text-dark-gray/90',
              )}>
              <Icon name={section.icon} className='size-4' />
              <span>{section.label}</span>
            </Button>
          ))}
        </nav>

        <div className='px-4'>
          <Button
            size='lg'
            type='submit'
            className='w-full rounded-xl font-medium tracking-tight bg-emerald-500 text-white'
            isLoading={isSubmitting}
            onPress={form.handleSubmit}>
            {isSubmitting
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
                ? 'Update Category'
                : 'Create Category'}
          </Button>
          {status === 'success' && (
            <p className='mt-2 text-sm text-center text-emerald-500'>
              {isEditMode
                ? 'Category updated successfully!'
                : 'Category created successfully!'}
            </p>
          )}
          {status === 'error' && errorMessage && (
            <p className='mt-2 text-sm text-center text-rose-500'>
              {errorMessage}
            </p>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className='col-span-1 lg:col-span-10 h-full overflow-y-auto space-y-0 pb-24 scroll-smooth px-1'>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className='space-y-0 pt-2'>
          <div id='basic-info' className='scroll-mt-4'>
            <BasicInfo
              form={form as CategoryFormApi}
              fields={categoryFields.slice(0, 2)}
            />
          </div>
          <div id='media' className='scroll-mt-4'>
            <Media form={form as CategoryFormApi} />
          </div>

          <div id='packaging' className='scroll-mt-4'>
            <Packaging form={form as CategoryFormApi} />
          </div>

          <div id='details' className='scroll-mt-4'>
            <Details form={form as CategoryFormApi} />
          </div>

          {/* Mobile Actions */}
          <div className='lg:hidden sticky bottom-4 z-20 p-4 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl'>
            <Button
              type='submit'
              color='success'
              className='w-full font-semibold'
              isLoading={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Update Category'
                  : 'Create Category'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
