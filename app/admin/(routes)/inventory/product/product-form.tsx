'use client'

import {api} from '@/convex/_generated/api'
import {Doc, Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {ensureSlug} from '@/lib/slug'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useMutation} from 'convex/react'
import {useCallback, useEffect, useRef, useState} from 'react'
import {
  defaultValues,
  productFields,
  ProductFormApi,
  ProductFormValues,
  productSchema,
} from '../../../_components/product-schema'
import {Attributes} from '../../../_components/product-sections/attributes'
import {BasicInfo} from '../../../_components/product-sections/basic-info'
import {Details} from '../../../_components/product-sections/details'
import {Inventory} from '../../../_components/product-sections/inventory'
import {Media} from '../../../_components/product-sections/media'
import {Pricing} from '../../../_components/product-sections/pricing'
import {useAppForm} from '../../../_components/ui/form-context'

type CategoryDoc = Doc<'categories'>

type ProductFormProps = {
  categories: CategoryDoc[] | undefined
  initialCategorySlug?: string
  productId?: Id<'products'>
  initialValues?: ProductFormValues
  onCreated?: VoidFunction
  onUpdated?: VoidFunction
}

const SECTIONS = [
  {id: 'basic-info', label: 'Basic Info', icon: 'file'},
  {id: 'media', label: 'Media', icon: 'image'},
  {id: 'pricing', label: 'Pricing', icon: 'dollar'},
  {id: 'inventory', label: 'Inventory', icon: 'box'},
  {id: 'attributes', label: 'Attributes', icon: 'sliders'},
  {id: 'details', label: 'Details', icon: 'align-left'},
] as const

export const ProductForm = ({
  categories,
  initialCategorySlug,
  productId,
  initialValues,
  onCreated,
  onUpdated,
}: ProductFormProps) => {
  const isEditMode = !!productId
  const createProduct = useMutation(api.products.m.createProduct)
  const updateProduct = useMutation(api.products.m.updateProduct)
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
        const parsed = productSchema.safeParse(value)
        if (!parsed.success) {
          const message =
            parsed.error.issues[0]?.message ??
            'Please review the product form for validation errors.'
          setErrorMessage(message)
          setStatus('error')

          return
        }

        const data = parsed.data

        // Helper to parse comma-separated numbers
        const parseNumbers = (val?: string) => {
          if (!val) return undefined
          const nums = val
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => !isNaN(n) && isFinite(n))
          return nums.length > 0 ? nums : undefined
        }

        const payload = {
          name: data.name.trim(),
          slug: ensureSlug(data.slug ?? '', data.name),
          categorySlug: data.categorySlug,
          shortDescription: data.shortDescription.trim(),
          description: data.description.trim(),
          priceCents: Math.round(data.priceCents * 100),
          unit: data.unit.trim(),
          availableDenominations: parseNumbers(data.availableDenominationsRaw),
          popularDenomination:
            data.popularDenomination && data.popularDenomination.length > 0
              ? data.popularDenomination
              : undefined,
          thcPercentage: data.thcPercentage,
          cbdPercentage:
            data.cbdPercentage && data.cbdPercentage.length > 0
              ? Number(data.cbdPercentage)
              : undefined,
          effects: data.effects || [],
          terpenes: data.terpenes || [],
          featured: data.featured,
          available: data.available,
          stock: Math.round(data.stock),
          rating: data.rating,
          image: data.image as Id<'_storage'>,
          gallery: data.gallery as Array<Id<'_storage'>>,
          consumption: data.consumption.trim(),
          flavorNotes: data.flavors || [],
          potencyLevel: data.potencyLevel,
          potencyProfile: data.potencyProfile?.trim() || undefined,
          weightGrams:
            data.weightGrams && data.weightGrams.length > 0
              ? Number(data.weightGrams)
              : undefined,
          variants: data.variants?.map((v) => ({
            ...v,
            price: Math.round(v.price * 100),
          })),
        }

        if (isEditMode && productId) {
          await updateProduct({
            id: productId,
            fields: payload,
          })
          setStatus('success')
          onUpdated?.()
        } else {
          await createProduct(payload)
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
              ? 'Failed to update product.'
              : 'Failed to create product.'
        setErrorMessage(message)
        setStatus('error')
      }
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  // Auto-populate category from search params
  useEffect(() => {
    if (initialCategorySlug && categories) {
      const categoryExists = categories.some(
        (c) => c.slug === initialCategorySlug,
      )
      if (categoryExists) {
        const currentCategorySlug = form.getFieldValue('categorySlug')
        if (!currentCategorySlug) {
          form.setFieldValue('categorySlug', initialCategorySlug)
        }
      }
    }
  }, [initialCategorySlug, categories, form])

  const scrollToSection = useCallback((sectionId: string) => {
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
        top: scrollTop + 16, // Account for spacing
        behavior: 'smooth',
      })
    } else if (element) {
      // Fallback to default behavior if ref is not available
      element.scrollIntoView({behavior: 'smooth', block: 'start'})
    }
  }, [])

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 md:p-4 lg:p-0 items-start h-[calc(100vh-6rem)]'>
      {/* Left Sidebar Navigation */}
      <aside className='hidden lg:block col-span-2 h-full overflow-y-auto pr-2 space-y-6'>
        <nav className='flex flex-col gap-1'>
          <h1 className='flex items-center space-x-2 tracking-tighter font-semibold p-4'>
            <div
              aria-hidden
              className='size-4 select-none aspect-square rounded-full bg-blue-500'
            />
            <span>{isEditMode ? 'Edit Product' : 'Create New Product'}</span>
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
                'flex justify-start items-center gap-3 px-4 text-base font-medium tracking-tight rounded-lg transition-all text-left',
                activeSection === section.id
                  ? 'dark:bg-zinc-700 dark:text-blue-300 bg-dark-gray/5 text-blue-500'
                  : 'text-dark-gray/60 dark:text-light-gray/80 dark:hover:text-blue-100  hover:bg-dark-gray/5 hover:text-dark-gray/90',
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
            className='w-full rounded-xl font-medium tracking-tight bg-blue-500 text-white'
            isLoading={isSubmitting}
            onPress={form.handleSubmit}>
            {isSubmitting
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
                ? 'Update Product'
                : 'Create Product'}
          </Button>
          {status === 'success' && (
            <p className='mt-2 text-sm text-center text-emerald-500'>
              {isEditMode
                ? 'Product updated successfully!'
                : 'Product created successfully!'}
            </p>
          )}
          <div className='wrap-break-word'>
            {status === 'error' && errorMessage && (
              <p className='mt-2 text-sm text-center text-rose-500'>
                {errorMessage}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        ref={mainScrollRef}
        className='col-span-1 lg:col-span-10 h-full overflow-y-auto space-y-0 mb-24 scroll-smooth px-1 dark:bg-dark-table/40'>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className='space-y-0 pt-1'>
          <div id='basic-info' className='scroll-mt-4'>
            <BasicInfo
              form={form as ProductFormApi}
              fields={productFields.slice(0, 3)}
              categories={categories}></BasicInfo>
          </div>
          <div id='media' className='scroll-mt-4'>
            <Media
              form={form as ProductFormApi}
              fields={productFields.slice(3, 4)}></Media>
          </div>
          <div id='pricing' className='scroll-mt-4'>
            <Pricing form={form as ProductFormApi} categories={categories} />
          </div>

          <div id='inventory' className='scroll-mt-4'>
            <Inventory form={form as ProductFormApi} />
          </div>

          <div id='attributes' className='scroll-mt-4'>
            <Attributes form={form as ProductFormApi} />
          </div>

          <div id='details' className='scroll-mt-4'>
            <Details form={form as ProductFormApi} />
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
                  ? 'Update Product'
                  : 'Create Product'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
