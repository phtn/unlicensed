'use client'

import { api } from '@/convex/_generated/api'
import { Doc } from '@/convex/_generated/dataModel'
import { Icon } from '@/lib/icons'
import { ensureSlug } from '@/lib/slug'
import { Button } from '@heroui/react'
import { useForm } from '@tanstack/react-form'
import { useStore } from '@tanstack/react-store'
import { useMutation } from 'convex/react'
import { useEffect, useState } from 'react'
import { ProductFormValues, productSchema } from './product-schema'
import { Attributes } from './product-sections/attributes'
import { BasicInfo } from './product-sections/basic-info'
import { Details } from './product-sections/details'
import { Inventory } from './product-sections/inventory'
import { Media } from './product-sections/media'
import { Pricing } from './product-sections/pricing'
import { cn } from '@/lib/utils'

type CategoryDoc = Doc<'categories'>

type ProductFormProps = {
  categories: CategoryDoc[] | undefined
}

const SECTIONS = [
  { id: 'basic-info', label: 'Basic Info', icon: 'file' },
  { id: 'media', label: 'Media', icon: 'image' },
  { id: 'pricing', label: 'Pricing', icon: 'dollar' },
  { id: 'inventory', label: 'Inventory', icon: 'box' },
  { id: 'attributes', label: 'Attributes', icon: 'sliders' },
  { id: 'details', label: 'Details', icon: 'align-left' },
] as const

export const ProductForm = ({ categories }: ProductFormProps) => {
  const createProduct = useMutation(api.products.m.createProduct)
  const [activeSection, setActiveSection] = useState<string>('basic-info')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const defaultValues: ProductFormValues = {
    name: '',
    slug: '',
    categorySlug: '',
    shortDescription: '',
    description: '',
    priceCents: 0,
    unit: '',
    availableDenominationsRaw: '',
    popularDenomination: '',
    thcPercentage: 0,
    cbdPercentage: '',
    effectsRaw: '',
    effects: [],
    terpenesRaw: '',
    terpenes: [],
    flavors: [],
    flavorNotesRaw: '',
    featured: true,
    available: true,
    stock: 0,
    rating: 4.5,
    image: '',
    gallery: [],
    consumption: '',
    potencyLevel: 'medium',
    potencyProfile: '',
    weightGrams: '',
    variants: [],
  }

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
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
            const nums = val.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && isFinite(n))
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
              ? Number(data.popularDenomination)
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
          image: data.image,
          gallery: data.gallery,
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

        await createProduct(payload)
        formApi.reset()
        setStatus('success')
        // Reset scroll
        document.getElementById('basic-info')?.scrollIntoView({ behavior: 'smooth' })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to create product.'
        setErrorMessage(message)
        setStatus('error')
      }
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const categorySlug = useStore(form.store, (state) => state.values.categorySlug)

  // Auto-populate variants for Flower
  useEffect(() => {
    const category = categories?.find((c) => c.slug === categorySlug)
    const isFlower =
      category?.name.toLowerCase().includes('flower') ||
      category?.slug.toLowerCase().includes('flower')

    if (isFlower) {
      const currentVariants = form.getFieldValue('variants')
      if (!currentVariants || currentVariants.length === 0) {
        form.setFieldValue('variants', [
          { label: '1/8', price: 35 },
          { label: '1/4', price: 60 },
          { label: '1/2', price: 100 },
          { label: 'Oz', price: 175 },
          { label: 'Bulk', price: 5 },
        ])
      }
    }
  }, [categorySlug, categories, form])

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 lg:p-8 items-start h-[calc(100vh-12rem)]">
      {/* Left Sidebar Navigation */}
      <aside className="hidden lg:block col-span-3 h-full overflow-y-auto pr-2 space-y-6">
        <div className="space-y-1">
          <h2 className="px-4 text-lg font-semibold tracking-tight">New Product</h2>
          <p className="px-4 text-sm text-neutral-500">
            Fill in the details below to create a new product entry.
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                'flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors text-left',
                activeSection === section.id
                  ? 'bg-neutral-800 text-emerald-500'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50',
              )}
            >
              <Icon name={section.icon} className="size-4" />
              <span>{section.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-4 pt-4 border-t border-neutral-800">
          <Button
            type="submit"
            color="success"
            className="w-full font-semibold"
            isLoading={isSubmitting}
            onPress={(e) => {
              // @ts-expect-error - Event type mismatch in HeroUI vs React
              e.preventDefault()
              void form.handleSubmit()
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </Button>
          {status === 'success' && (
            <p className="mt-2 text-sm text-center text-emerald-500">
              Product created successfully!
            </p>
          )}
          {status === 'error' && errorMessage && (
            <p className="mt-2 text-sm text-center text-rose-500">
              {errorMessage}
            </p>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="col-span-1 lg:col-span-9 h-full overflow-y-auto space-y-8 pb-24 scroll-smooth px-1">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className="space-y-8"
        >
          <div id="basic-info" className="scroll-mt-4">
            <BasicInfo form={form} categories={categories} />
          </div>

          <div id="media" className="scroll-mt-4">
            <Media form={form} />
          </div>

          <div id="pricing" className="scroll-mt-4">
            <Pricing form={form} />
          </div>

          <div id="inventory" className="scroll-mt-4">
            <Inventory form={form} />
          </div>

          <div id="attributes" className="scroll-mt-4">
            <Attributes form={form} />
          </div>

          <div id="details" className="scroll-mt-4">
            <Details form={form} />
          </div>

          {/* Mobile Actions */}
          <div className="lg:hidden sticky bottom-4 z-20 p-4 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl">
            <Button
              type="submit"
              color="success"
              className="w-full font-semibold"
              isLoading={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
