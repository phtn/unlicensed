'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {ensureSlug} from '@/lib/slug'
import {cn} from '@/lib/utils'
import {Button, Switch} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useMutation} from 'convex/react'
import {useCallback, useEffect, useRef, useState} from 'react'
import {
  categoryFields,
  CategoryFormApi,
  CategoryFormValues,
  categorySchema,
  defaultValues,
  parseList,
  parseNumbers,
} from '../../../_components/category-schema'
import {BasicInfo} from '../../../_components/category-sections/basic-info'
import {Details} from '../../../_components/category-sections/details'
import {Media} from '../../../_components/category-sections/media'
import {Packaging} from '../../../_components/category-sections/packaging'
import {useAppForm} from '../../../_components/ui/form-context'

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
  const mainScrollRef = useRef<HTMLElement>(null)

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
          heroImage: data.heroImage
            ? (data.heroImage as Id<'_storage'>)
            : undefined,
          visible: data.visible ?? false,
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
            ...payload,
            categoryId,
          })
          setStatus('success')
          onUpdated?.()
        } else {
          await createCategory(payload)
          formApi.reset()
          setStatus('success')
          // Reset scroll within the container
          const scrollContainer = mainScrollRef.current
          const basicInfoElement = document.getElementById('basic-info')
          if (basicInfoElement && scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect()
            const elementRect = basicInfoElement.getBoundingClientRect()
            const scrollTop =
              scrollContainer.scrollTop + elementRect.top - containerRect.top

            scrollContainer.scrollTo({
              top: scrollTop + 16,
              behavior: 'smooth',
            })
          } else if (basicInfoElement) {
            basicInfoElement.scrollIntoView({behavior: 'smooth'})
          }
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
      form.setFieldValue('visible', initialValues.visible ?? false)
      form.setFieldValue('description', initialValues.description)
      form.setFieldValue('heroImage', initialValues.heroImage)
      form.setFieldValue('highlight', initialValues.highlight ?? '')
      form.setFieldValue('benefitsRaw', initialValues.benefitsRaw ?? '')
      form.setFieldValue('unitsRaw', initialValues.unitsRaw ?? '')
      form.setFieldValue(
        'denominationsRaw',
        initialValues.denominationsRaw ?? '',
      )
    }
  }, [initialValues, form])

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  const scrollToSection = useCallback(
    (sectionId: string) => () => {
      setActiveSection(sectionId)
      const element = document.getElementById(sectionId)
      const scrollContainer = mainScrollRef.current

      if (element && scrollContainer) {
        // Calculate the position relative to the scrollable container
        const containerRect = scrollContainer.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()
        const scrollTop =
          scrollContainer.scrollTop + elementRect.top - containerRect.top

        scrollContainer.scrollTo({
          top: scrollTop + 16, // Account for scroll-mt-4 (1rem = 16px)
          behavior: 'smooth',
        })
      } else if (element) {
        // Fallback to default behavior if ref is not available
        element.scrollIntoView({behavior: 'smooth', block: 'start'})
      }
    },
    [],
  )

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 md:p-4 lg:p-0 items-start md:h-[calc(100vh-6rem)] h-[calc(100lvh)]'>
      {/* Left Sidebar Navigation */}
      <aside className='hidden lg:block cols-span-3 2xl:col-span-2 col-span-3 h-full overflow-y-auto space-y-6'>
        <nav className='flex flex-col pl-2 gap-1'>
          <h1 className='text-lg flex pl-2 items-center space-x-2 tracking-tighter font-semibold py-4 text-dark-gray dark:text-foreground'>
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
              name={section.id}
              onPress={scrollToSection(section.id)}
              className={cn(
                'flex justify-start items-center gap-3 px-4 text-base font-medium tracking-tight rounded-xl transition-all text-left',
                activeSection === section.id
                  ? 'dark:bg-zinc-700 dark:text-emerald-300 bg-dark-gray/5 text-emerald-600'
                  : 'text-dark-gray/60 dark:text-light-gray/80 dark:hover:text-emerald-100  hover:bg-dark-gray/5 hover:text-dark-gray/90',
              )}>
              <Icon name={section.icon} className='size-4' />
              <span>{section.label}</span>
            </Button>
          ))}
        </nav>

        <form.Field name='visible'>
          {(field) => {
            const visible = (field.state.value as boolean) ?? false
            return (
              <div className='ml-4 w-fit flex items-center justify-between gap-6 px-4 py-3 rounded-2xl bg-slate-500/10 dark:bg-zinc-800/50 border border-dark-gray/10 dark:border-zinc-700/50'>
                <span className='text-sm font-medium tracking-tight text-dark-gray dark:text-foreground'>
                  Active Category
                </span>
                <Switch
                  size='sm'
                  isSelected={visible}
                  onValueChange={(value) => field.handleChange(value)}
                  onBlur={field.handleBlur}
                  classNames={{
                    wrapper: 'group-data-[selected=true]:bg-emerald-500',
                  }}
                />
              </div>
            )
          }}
        </form.Field>

        <div className='px-0 xl:px-3 portrait:fixed portrait:bottom-0'>
          <Button
            size='lg'
            type='submit'
            fullWidth
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
      <main
        ref={mainScrollRef}
        className='col-span-1 lg:col-span-8 xl:col-span-9 2xl:col-span-10 h-full overflow-y-auto space-y-0 pb-24 scroll-smooth px-1 relative md:pt-2'>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className='space-y-0 pt-2 relative'>
          <div id='basic-info' className=''>
            <BasicInfo
              form={form as CategoryFormApi}
              fields={categoryFields.slice(0, 2)}
            />
          </div>
          <div id='media' className=''>
            <Media form={form as CategoryFormApi} />
          </div>

          <div id='packaging'>
            <Packaging form={form as CategoryFormApi} />
          </div>

          <div id='details'>
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
