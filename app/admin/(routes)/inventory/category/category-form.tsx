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
import {useAppForm} from '../../../_components/ui/form-context'
import {Attributes} from './_category-sections/attributes'
import {BasicInfo} from './_category-sections/basic-info'
import {Details} from './_category-sections/details'
import {Media} from './_category-sections/media'
import {Packaging} from './_category-sections/packaging'
import {
  categoryFields,
  CategoryFormApi,
  CategoryFormValues,
  categorySchema,
  defaultValues,
  parseList,
  parseNumbers,
} from './category-schema'

type CategoryType = import('@/convex/categories/d').CategoryType

type CategoryFormProps = {
  categoryId?: Id<'categories'>
  category?: CategoryType | null
  initialValues?: CategoryFormValues
  onCreated?: VoidFunction
  onUpdated?: VoidFunction
}

const SECTIONS = [
  {id: 'basic-info', label: 'Basic Info', icon: 'file'},
  {id: 'media', label: 'Media', icon: 'image'},
  {id: 'packaging', label: 'Packaging', icon: 'box'},
  {id: 'attributes', label: 'Attributes', icon: 'sliders'},
  {id: 'details', label: 'Details', icon: 'align-left'},
] as const

export const CategoryForm = ({
  categoryId,
  category,
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
        const categorySlug = ensureSlug(data.slug ?? '', data.name)
        const payload = {
          name: data.name.trim(),
          slug: categorySlug,
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
          strainTypes: data.strainTypes ?? [],
          subcategories: data.subcategories ?? [],
          tiers: data.tiers ?? [],
          bases: data.bases ?? [],
          brands: data.brands ?? [],
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
      form.setFieldValue('strainTypes', initialValues.strainTypes ?? [])
      form.setFieldValue('subcategories', initialValues.subcategories ?? [])
      form.setFieldValue('tiers', initialValues.tiers ?? [])
      form.setFieldValue('bases', initialValues.bases ?? [])
      form.setFieldValue('brands', initialValues.brands ?? [])
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
    <div className='grid grid-cols-1 items-start gap-8 h-[calc(100lvh-6rem)] md:h-[calc(100vh-6rem)] md:p-4 lg:grid-cols-12 lg:p-0'>
      {/* Left Sidebar Navigation */}
      <aside className='hidden lg:block cols-span-3 2xl:col-span-2 col-span-3 h-full overflow-y-auto space-y-6'>
        <nav className='flex flex-col pl-2 gap-1'>
          <h1 className='text-lg flex pl-2 items-center space-x-2 font-okxs font-semibold py-4 opacity-80'>
            <div
              aria-hidden
              className='size-4 select-none aspect-square rounded-full bg-emerald-500'
            />
            <span>{isEditMode ? 'Edit Category' : 'Create New Category'}</span>
          </h1>
          {SECTIONS.map((section) => (
            <Button
              size='md'
              variant='tertiary'
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
                  onChange={(value: boolean) => field.handleChange(value)}
                  onBlur={field.handleBlur}
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
            isPending={isSubmitting}
            onPress={() => {
              void form.handleSubmit()
            }}>
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
        className='relative col-span-1 h-full overflow-y-auto space-y-0 scroll-smooth px-1 pb-28 md:pt-2 lg:col-span-8 lg:pb-0 xl:col-span-9 2xl:col-span-10'>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className='space-y-0 pt-2 relative'>
          <div className='mb-4 rounded-2xl border border-dark-gray/10 bg-slate-500/5 p-4 dark:border-zinc-700/50 dark:bg-zinc-800/40 lg:hidden'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
              <div className='min-w-0 space-y-1'>
                <h1 className='text-lg font-okxs font-semibold tracking-tight text-dark-gray dark:text-foreground'>
                  {isEditMode ? 'Edit Category' : 'Create New Category'}
                </h1>
                <p className='text-sm text-dark-gray/60 dark:text-light-gray/70'>
                  Manage visibility, packaging, media, and category metadata.
                </p>
              </div>
              <form.Field name='visible'>
                {(field) => {
                  const visible = (field.state.value as boolean) ?? false
                  return (
                    <div className='flex w-fit shrink-0 items-center gap-3 rounded-xl border border-dark-gray/10 bg-white/70 px-3 py-2 dark:border-zinc-700/50 dark:bg-zinc-900/60'>
                      <span className='text-sm font-medium tracking-tight text-dark-gray dark:text-foreground'>
                        Active
                      </span>
                      <Switch
                        size='sm'
                        isSelected={visible}
                        onChange={(value: boolean) => field.handleChange(value)}
                        onBlur={field.handleBlur}
                      />
                    </div>
                  )
                }}
              </form.Field>
            </div>
          </div>

          <div>
            <BasicInfo
              form={form as CategoryFormApi}
              fields={categoryFields.slice(0, 2)}
            />
          </div>
          <div>
            <Media form={form as CategoryFormApi} />
          </div>

          <div>
            <Packaging form={form as CategoryFormApi} />
          </div>

          <div>
            <Attributes
              form={form as CategoryFormApi}
              category={category ?? null}
            />
          </div>

          <div>
            <Details form={form as CategoryFormApi} />
          </div>

          {/* Mobile Actions */}
          <div className='fixed w-[calc(94.5lvw)] bottom-0 z-20 mt-4 border border-neutral-800 bg-neutral-900/85 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl backdrop-blur-md lg:hidden rounded-t-xl'>
            <Button
              type='submit'
              variant='primary'
              className='w-full rounded-sm font-semibold bg-emerald-500 text-white'
              isPending={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Update Category'
                  : 'Create Category'}
            </Button>
            {status === 'success' && (
              <p className='mt-2 text-sm text-center text-emerald-400'>
                {isEditMode
                  ? 'Category updated successfully!'
                  : 'Category created successfully!'}
              </p>
            )}
            {status === 'error' && errorMessage && (
              <p className='mt-2 text-sm text-center text-rose-400'>
                {errorMessage}
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  )
}
