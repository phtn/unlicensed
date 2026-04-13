'use client'

import {useAppForm} from '@/app/admin/_components/ui/form-context'
import {api} from '@/convex/_generated/api'
import {Doc, Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {ensureSlug} from '@/lib/slug'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useMutation} from 'convex/react'
import {useCallback, useEffect, useRef, useState} from 'react'
import {Attributes} from './_product-sections/attributes'
import {BasicInfo} from './_product-sections/basic-info'
import {Details} from './_product-sections/details'
import {Inventory} from './_product-sections/inventory'
import {Media} from './_product-sections/media'
import {Packaging} from './_product-sections/packaging'
import {Pricing} from './_product-sections/pricing'
import {
  defaultValues,
  productFields,
  ProductFormApi,
  ProductFormValues,
  productSchema,
} from './product-schema'

type CategoryDoc = Doc<'categories'>

type ProductFormProps = {
  categories: CategoryDoc[] | undefined
  initialCategorySlug?: string
  product?: Doc<'products'>
  productId?: Id<'products'>
  initialValues?: ProductFormValues
  onCreated?: VoidFunction
  onUpdated?: VoidFunction
}

const SECTIONS = [
  {id: 'basic-info', label: 'Basic Info', icon: 'file'},
  {id: 'media', label: 'Media', icon: 'image'},
  {id: 'pricing', label: 'Pricing', icon: 'dollar'},
  {id: 'packaging', label: 'Packaging', icon: 'box'},
  {id: 'inventory', label: 'Inventory', icon: 'box'},
  {id: 'attributes', label: 'Attributes', icon: 'sliders'},
  {id: 'details', label: 'Details', icon: 'align-left'},
] as const

type ProductSectionId = (typeof SECTIONS)[number]['id']

const PRODUCT_FIELD_SECTION_MAP: Partial<
  Record<keyof ProductFormValues, ProductSectionId>
> = {
  name: 'basic-info',
  slug: 'basic-info',
  base: 'basic-info',
  categorySlug: 'basic-info',
  brand: 'basic-info',
  strainType: 'basic-info',
  tier: 'basic-info',
  subcategory: 'basic-info',
  productType: 'basic-info',
  image: 'media',
  gallery: 'media',
  priceCents: 'pricing',
  batchId: 'pricing',
  unit: 'pricing',
  availableDenominationsRaw: 'inventory',
  popularDenomination: 'inventory',
  priceByDenomination: 'pricing',
  salePriceByDenomination: 'inventory',
  variants: 'pricing',
  packagingMode: 'packaging',
  stockUnit: 'packaging',
  packSize: 'packaging',
  startingWeight: 'packaging',
  remainingWeight: 'packaging',
  netWeight: 'packaging',
  netWeightUnit: 'packaging',
  inventoryMode: 'inventory',
  stock: 'inventory',
  masterStockQuantity: 'inventory',
  masterStockUnit: 'inventory',
  lowStockThreshold: 'inventory',
  stockByDenomination: 'inventory',
  effects: 'attributes',
  terpenes: 'attributes',
  flavors: 'attributes',
  shortDescription: 'details',
  description: 'details',
  consumption: 'details',
  potencyLevel: 'details',
  potencyProfile: 'details',
  lineage: 'details',
  weightGrams: 'details',
  noseRating: 'details',
}

const PRODUCT_FIELD_LABEL_MAP = new Map(
  productFields.map((field) => [String(field.name), field.label]),
)

const humanizeFieldName = (fieldName: string) =>
  fieldName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase())

const getProductFieldLabel = (fieldName: string) =>
  PRODUCT_FIELD_LABEL_MAP.get(fieldName) ?? humanizeFieldName(fieldName)

const getFieldNameFromServerError = (
  message: string,
): keyof ProductFormValues | null => {
  if (message === 'Product name is required') return 'name'
  if (/^Product with slug ".+" already exists\.$/.test(message)) return 'slug'
  if (
    message === 'Category slug is required' ||
    /^Category ".+" not found\.$/.test(message)
  ) {
    return 'categorySlug'
  }
  if (/^Base ".+" is invalid/.test(message)) return 'base'
  if (/^Tier ".+" is invalid/.test(message)) return 'tier'
  if (/^Brand ".+" is invalid/.test(message)) return 'brand'
  return null
}

export const ProductForm = ({
  categories,
  initialCategorySlug,
  product,
  productId,
  initialValues,
  onCreated,
  onUpdated,
}: ProductFormProps) => {
  const isEditMode = !!productId
  const createProduct = useMutation(api.products.m.createProduct)
  const updateProduct = useMutation(api.products.m.updateProduct)
  const archiveProduct = useMutation(api.products.m.archiveProduct)
  const [activeSection, setActiveSection] = useState<string>('basic-info')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorFieldLabel, setErrorFieldLabel] = useState<string | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)
  const mainScrollRef = useRef<HTMLElement>(null)

  const formValues = initialValues ?? defaultValues

  const focusSection = useCallback((sectionId: ProductSectionId) => {
    setActiveSection(sectionId)
    const element = document.getElementById(sectionId)
    const scrollContainer = mainScrollRef.current

    if (element && scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const scrollTop =
        scrollContainer.scrollTop + elementRect.top - containerRect.top

      scrollContainer.scrollTo({
        top: scrollTop + 16,
        behavior: 'smooth',
      })
    } else if (element) {
      element.scrollIntoView({behavior: 'smooth', block: 'start'})
    }
  }, [])

  const handleSubmitError = useCallback(
    ({
      fieldName,
      message,
    }: {
      fieldName?: keyof ProductFormValues | null
      message: string
    }) => {
      const nextFieldLabel = fieldName ? getProductFieldLabel(fieldName) : null
      setErrorFieldLabel(nextFieldLabel)
      setErrorMessage(message)
      setStatus('error')

      const sectionId = fieldName ? PRODUCT_FIELD_SECTION_MAP[fieldName] : null
      if (sectionId) {
        focusSection(sectionId)
      }
    },
    [focusSection],
  )

  const form = useAppForm({
    defaultValues: formValues,
    onSubmit: async ({value, formApi}) => {
      setStatus('idle')
      setErrorMessage(null)
      setErrorFieldLabel(null)
      try {
        const parsed = productSchema.safeParse(value)
        if (!parsed.success) {
          const issue = parsed.error.issues[0]
          const fieldName =
            typeof issue?.path?.[0] === 'string'
              ? (issue.path[0] as keyof ProductFormValues)
              : null
          const message =
            issue?.message ??
            'Please review the product form for validation errors.'
          handleSubmitError({fieldName, message})

          return
        }

        const data = parsed.data
        // Ensure brand is read from form state (TanStack Form can omit untouched fields from submit value)
        const brandFromForm = form.getFieldValue('brand')
        const brandValue = Array.isArray(brandFromForm)
          ? brandFromForm
              .map((brand) => String(brand).trim())
              .filter((brand) => brand.length > 0)
          : Array.isArray(data.brand)
            ? data.brand
                .map((brand) => brand.trim())
                .filter((brand) => brand.length > 0)
            : undefined
        const productTypeFromForm = form.getFieldValue('productType')
        const productTypeValue =
          typeof productTypeFromForm === 'string'
            ? productTypeFromForm.trim() || undefined
            : data.productType?.trim() || undefined
        const strainTypeFromForm = form.getFieldValue('strainType')
        const strainTypeValue =
          typeof strainTypeFromForm === 'string'
            ? strainTypeFromForm.trim() || undefined
            : data.strainType?.trim() || undefined
        const isVapeCategory = data.categorySlug === 'vapes'
        const isSharedInventoryMode = data.inventoryMode === 'shared'
        const parsedNetWeight =
          data.netWeight && data.netWeight.trim().length > 0
            ? Number(data.netWeight)
            : undefined
        const netWeight =
          parsedNetWeight != null && Number.isFinite(parsedNetWeight)
            ? parsedNetWeight
            : undefined
        const parseOptionalNumber = (val?: string) => {
          if (!val || val.trim().length === 0) return undefined
          const parsedValue = Number(val)
          return Number.isFinite(parsedValue) ? parsedValue : undefined
        }
        const packSizeFromForm = form.getFieldValue('packSize')
        const packSizeValue =
          typeof packSizeFromForm === 'string'
            ? parseOptionalNumber(packSizeFromForm)
            : parseOptionalNumber(data.packSize)

        const parseNumbers = (
          val?: string | Array<string | number> | '',
        ) => {
          if (!val) return undefined
          const values = Array.isArray(val) ? val : val.split(',')
          const nums = values
            .map((value) => Number(String(value).trim()))
            .filter((value) => Number.isFinite(value))
          return nums.length > 0 ? nums : undefined
        }

        const payload = {
          name: data.name.trim(),
          slug: ensureSlug(data.slug ?? '', data.name),
          base: data.base?.trim() || undefined,
          categorySlug: data.categorySlug,
          brand: brandValue && brandValue.length > 0 ? brandValue : undefined,
          shortDescription: data.shortDescription?.trim(),
          description: data.description?.trim(),
          priceCents: Math.round(data.priceCents * 100),
          batchId: data.batchId?.trim() || undefined,
          unit: data.unit.trim(),
          availableDenominations: parseNumbers(data.availableDenominationsRaw),
          popularDenomination: parseNumbers(data.popularDenomination),
          thcPercentage: data.thcPercentage,
          cbdPercentage:
            data.cbdPercentage && data.cbdPercentage.length > 0
              ? Number(data.cbdPercentage)
              : undefined,
          effects: data.effects || [],
          terpenes: data.terpenes || [],
          featured: data.featured,
          available: data.available,
          eligibleForRewards: data.eligibleForRewards,
          eligibleForDeals: data.eligibleForDeals,
          onSale: data.onSale,
          inventoryMode: data.inventoryMode,
          ...(isEditMode
            ? {}
            : {
                stock:
                  data.inventoryMode === 'by_denomination' && data.stock != null
                    ? Math.round(data.stock)
                    : undefined,
                masterStockQuantity:
                  isSharedInventoryMode && data.masterStockQuantity != null
                    ? data.masterStockQuantity
                    : undefined,
                stockByDenomination:
                  data.inventoryMode === 'by_denomination'
                    ? data.stockByDenomination
                    : undefined,
              }),
          masterStockUnit: isSharedInventoryMode
            ? data.masterStockUnit?.trim() || undefined
            : undefined,
          lowStockThreshold: parseOptionalNumber(data.lowStockThreshold),
          rating: data.rating,
          image: data.image as Id<'_storage'>,
          gallery: data.gallery as Array<Id<'_storage'>>,
          consumption: data.consumption?.trim(),
          flavorNotes: data.flavors || [],
          potencyLevel: data.potencyLevel,
          potencyProfile: data.potencyProfile?.trim() || undefined,
          lineage: data.lineage?.trim() || undefined,
          productType: productTypeValue,
          strainType: strainTypeValue,
          subcategory: data.subcategory?.trim() || undefined,
          noseRating: isVapeCategory ? undefined : data.noseRating,
          weightGrams:
            data.weightGrams && data.weightGrams.length > 0
              ? Number(data.weightGrams)
              : undefined,
          netWeight,
          netWeightUnit: data.netWeightUnit?.trim() || undefined,
          packagingMode: data.packagingMode,
          stockUnit: data.stockUnit?.trim() || undefined,
          packSize: packSizeValue,
          startingWeight: parseOptionalNumber(data.startingWeight),
          remainingWeight: parseOptionalNumber(data.remainingWeight),
          variants: data.variants?.map((v) => {
            const denomKey = v.label.match(/^(\d+\.?\d*)/)?.[1]
            const priceCents =
              denomKey != null && data.priceByDenomination?.[denomKey] != null
                ? Math.round(data.priceByDenomination[denomKey] * 100)
                : Math.round((v.price ?? 0) * 100)
            return {...v, price: priceCents}
          }),
          priceByDenomination:
            data.priceByDenomination &&
            Object.keys(data.priceByDenomination).length > 0
              ? Object.fromEntries(
                  Object.entries(data.priceByDenomination).map(([k, v]) => [
                    k,
                    Math.round(Number(v) * 100),
                  ]),
                )
              : undefined,
          salePriceByDenomination:
            data.salePriceByDenomination &&
            Object.keys(data.salePriceByDenomination).length > 0
              ? Object.fromEntries(
                  Object.entries(data.salePriceByDenomination).map(([k, v]) => [
                    k,
                    Math.round(Number(v) * 100),
                  ]),
                )
              : undefined,
          tier: data.tier,
          eligibleForUpgrade: data.eligibleForUpgrade,
          upgradePrice:
            data.upgradePrice != null
              ? Math.round(data.upgradePrice * 100)
              : undefined,
        }

        if (isEditMode && productId) {
          await updateProduct({
            id: productId,
            fields: payload,
          })
          setErrorFieldLabel(null)
          setStatus('success')
          onUpdated?.()
        } else {
          await createProduct(payload)
          formApi.reset()
          setErrorFieldLabel(null)
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
        handleSubmitError({
          fieldName:
            error instanceof Error
              ? getFieldNameFromServerError(error.message)
              : null,
          message,
        })
      }
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  // Sync initialValues into form when editing (ensures brand and other fields show when returning to the form)
  const lastSyncedProductId = useRef<Id<'products'> | null>(null)
  useEffect(() => {
    if (!isEditMode || !productId || !initialValues) return
    if (lastSyncedProductId.current === productId) return
    lastSyncedProductId.current = productId
    form.setFieldValue('name', initialValues.name ?? '')
    form.setFieldValue('slug', initialValues.slug ?? '')
    form.setFieldValue('base', initialValues.base ?? '')
    form.setFieldValue('categorySlug', initialValues.categorySlug ?? '')
    form.setFieldValue('brand', initialValues.brand ?? [])
    form.setFieldValue('shortDescription', initialValues.shortDescription ?? '')
    form.setFieldValue('description', initialValues.description ?? '')
    form.setFieldValue('priceCents', initialValues.priceCents ?? 0)
    form.setFieldValue('batchId', initialValues.batchId ?? '')
    form.setFieldValue('unit', initialValues.unit ?? '')
    form.setFieldValue(
      'availableDenominationsRaw',
      initialValues.availableDenominationsRaw ?? [],
    )
    form.setFieldValue(
      'popularDenomination',
      initialValues.popularDenomination ?? [],
    )
    form.setFieldValue('thcPercentage', initialValues.thcPercentage ?? 0)
    form.setFieldValue('cbdPercentage', initialValues.cbdPercentage ?? '')
    form.setFieldValue('effects', initialValues.effects ?? [])
    form.setFieldValue('terpenes', initialValues.terpenes ?? [])
    form.setFieldValue('flavors', initialValues.flavors ?? [])
    form.setFieldValue('featured', initialValues.featured ?? false)
    form.setFieldValue('available', initialValues.available ?? false)
    form.setFieldValue(
      'eligibleForRewards',
      initialValues.eligibleForRewards ?? true,
    )
    form.setFieldValue(
      'eligibleForDeals',
      initialValues.eligibleForDeals ?? false,
    )
    form.setFieldValue('onSale', initialValues.onSale ?? false)
    form.setFieldValue(
      'inventoryMode',
      initialValues.inventoryMode ?? 'by_denomination',
    )
    form.setFieldValue('stock', initialValues.stock ?? 0)
    form.setFieldValue('masterStockQuantity', initialValues.masterStockQuantity)
    form.setFieldValue('masterStockUnit', initialValues.masterStockUnit ?? '')
    form.setFieldValue(
      'lowStockThreshold',
      initialValues.lowStockThreshold ?? '',
    )
    form.setFieldValue(
      'stockByDenomination',
      initialValues.stockByDenomination ?? {},
    )
    form.setFieldValue('rating', initialValues.rating ?? 0)
    form.setFieldValue('image', initialValues.image ?? '')
    form.setFieldValue('gallery', initialValues.gallery ?? [])
    form.setFieldValue('consumption', initialValues.consumption ?? '')
    form.setFieldValue('potencyLevel', initialValues.potencyLevel ?? 'medium')
    form.setFieldValue('potencyProfile', initialValues.potencyProfile ?? '')
    form.setFieldValue('lineage', initialValues.lineage ?? '')
    form.setFieldValue('strainType', initialValues.strainType ?? '')
    form.setFieldValue('subcategory', initialValues.subcategory ?? '')
    form.setFieldValue('productType', initialValues.productType ?? '')
    form.setFieldValue('noseRating', initialValues.noseRating ?? 0)
    form.setFieldValue('netWeight', initialValues.netWeight ?? '')
    form.setFieldValue('netWeightUnit', initialValues.netWeightUnit ?? '')
    form.setFieldValue('packagingMode', initialValues.packagingMode)
    form.setFieldValue('stockUnit', initialValues.stockUnit ?? '')
    form.setFieldValue('packSize', initialValues.packSize ?? '')
    form.setFieldValue('startingWeight', initialValues.startingWeight ?? '')
    form.setFieldValue('remainingWeight', initialValues.remainingWeight ?? '')
    form.setFieldValue('variants', initialValues.variants ?? [])
    form.setFieldValue(
      'priceByDenomination',
      initialValues.priceByDenomination ?? {},
    )
    form.setFieldValue(
      'salePriceByDenomination',
      initialValues.salePriceByDenomination ?? {},
    )
    form.setFieldValue('tier', initialValues.tier)
    form.setFieldValue(
      'eligibleForUpgrade',
      initialValues.eligibleForUpgrade ?? false,
    )
    form.setFieldValue('upgradePrice', initialValues.upgradePrice)
  }, [isEditMode, productId, initialValues, form])

  useEffect(() => {
    if (!isEditMode || !categories?.length) return

    const currentCategorySlug = form.getFieldValue('categorySlug')
    if (!currentCategorySlug) return

    const selectedCategory =
      categories.find((category) => category.slug === currentCategorySlug) ??
      null
    if (!selectedCategory) return

    const units = selectedCategory.units ?? []
    const denominations = selectedCategory.denominations ?? []

    const currentUnit = ((form.getFieldValue('unit') as string) ?? '').trim()
    const primaryUnit = currentUnit || units[0] || ''
    if (!currentUnit && units.length > 0) {
      form.setFieldValue('unit', units[0])
    }

    if (!primaryUnit || denominations.length === 0) return

    const currentVariants = form.getFieldValue('variants') as
      | Array<{label: string; price: number}>
      | undefined
    const hasVariants =
      Array.isArray(currentVariants) && currentVariants.length > 0
    if (!hasVariants) {
      form.setFieldValue(
        'variants',
        denominations.map((denomination) => ({
          label: `${denomination}${primaryUnit}`,
          price: 0,
        })),
      )
    }

    const currentAvailableDenominations = form.getFieldValue(
      'availableDenominationsRaw',
    ) as string | string[] | undefined
    const hasCurrentAvailableDenominations = Array.isArray(
      currentAvailableDenominations,
    )
      ? currentAvailableDenominations.length > 0
      : !!currentAvailableDenominations?.trim()

    if (!hasCurrentAvailableDenominations) {
      form.setFieldValue(
        'availableDenominationsRaw',
        denominations.map(String),
      )
    }

    const currentStockByDenomination =
      (form.getFieldValue('stockByDenomination') as
        | Record<string, number>
        | undefined) ?? {}
    const nextStockByDenomination = {...currentStockByDenomination}
    let stockChanged = false
    for (const denomination of denominations) {
      const key = String(denomination)
      if (nextStockByDenomination[key] === undefined) {
        nextStockByDenomination[key] = 0
        stockChanged = true
      }
    }
    if (stockChanged) {
      form.setFieldValue('stockByDenomination', nextStockByDenomination)
    }

    const currentPriceByDenomination =
      (form.getFieldValue('priceByDenomination') as
        | Record<string, number>
        | undefined) ?? {}
    const nextPriceByDenomination = {...currentPriceByDenomination}
    let priceChanged = false
    for (const denomination of denominations) {
      const key = String(denomination)
      if (nextPriceByDenomination[key] === undefined) {
        nextPriceByDenomination[key] = 0
        priceChanged = true
      }
    }
    if (priceChanged) {
      form.setFieldValue('priceByDenomination', nextPriceByDenomination)
    }
  }, [isEditMode, categories, form])

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

  const scrollToSection = useCallback(
    (sectionId: ProductSectionId) => {
      focusSection(sectionId)
    },
    [focusSection],
  )

  const handleArchiveProduct = useCallback(async () => {
    if (!productId) return

    setStatus('idle')
    setErrorMessage(null)
    setErrorFieldLabel(null)
    setIsArchiving(true)
    try {
      await archiveProduct({productId})
      onUpdated?.()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to archive product.'
      setErrorMessage(message)
      setStatus('error')
    } finally {
      setIsArchiving(false)
    }
  }, [archiveProduct, onUpdated, productId])

  return (
    <div className='grid grid-cols-1 items-start gap-8 h-[calc(100lvh-6rem)] md:h-[calc(100vh-6rem)] md:p-4 lg:grid-cols-12 lg:p-0'>
      {/* Left Sidebar Navigation */}
      <aside className='hidden lg:block col-span-2 h-full overflow-y-auto pr-2 space-y-6'>
        <nav className='flex flex-col gap-1'>
          <h1 className='flex items-center space-x-2 font-okxs font-semibold p-4 opacity-80'>
            <div
              aria-hidden
              className='size-4 select-none aspect-square rounded-full bg-blue-500'
            />
            <span>{isEditMode ? 'Edit Product' : 'Create New Product'}</span>
          </h1>
          {SECTIONS.map((section) => (
            <Button
              size='md'
              variant='outline'
              fullWidth
              key={section.id}
              onPress={() => scrollToSection(section.id)}
              className={cn(
                'flex items-center justify-start gap-3 px-4 text-base font-medium tracking-tight rounded-lg transition-all text-left border-transparent',
                activeSection === section.id
                  ? 'dark:bg-zinc-700 dark:text-blue-300 bg-dark-gray/5 text-blue-500'
                  : 'text-dark-gray/60 dark:text-light-gray/80 dark:hover:text-blue-100  hover:bg-dark-gray/5 hover:text-dark-gray/90',
              )}>
              <Icon name={section.icon} className='size-4' />
              <span>{section.label}</span>
            </Button>
          ))}
        </nav>

        <div className='px-1 xl:px-2 2xl:px-4'>
          <Button
            size='lg'
            type='submit'
            className='w-full rounded-xl font-medium tracking-tight bg-blue-500 text-white'
            isDisabled={isSubmitting}
            onPress={form.handleSubmit}>
            {isSubmitting
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
                ? 'Save Changes'
                : 'Create Product'}
          </Button>
          {status === 'success' && (
            <p className='mt-2 text-sm text-center text-emerald-500'>
              {isEditMode ? 'Update Successful!' : 'Product Created!'}
            </p>
          )}
          <div className='my-4'>
            {status === 'error' && errorMessage && (
              <div className='p-1 mt-2 rounded-md dark:bg-red-500/80 bg-red-600/80 flex whitespace-pre-wrap overflow-scroll'>
                <div className=' text-sm text-white font-clash'>
                  {errorFieldLabel ? (
                    <p className='text-xs uppercase tracking-[0.14em] font-ios border-b'>
                      Field: {errorFieldLabel}
                    </p>
                  ) : null}
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        ref={mainScrollRef}
        className='col-span-1 h-full overflow-y-auto space-y-0 scroll-smooth md:px-1 md:pb-28 dark:bg-dark-table/40 lg:col-span-10 lg:pb-0'>
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
              fields={productFields.slice(0, 10)}
              categories={categories}
              onArchiveProduct={isEditMode ? handleArchiveProduct : undefined}
              isArchiving={isArchiving}></BasicInfo>
          </div>
          <div id='media' className='scroll-mt-4'>
            <Media
              form={form as ProductFormApi}
              fields={productFields.slice(10, 10)}></Media>
          </div>
          <div id='pricing' className='scroll-mt-4'>
            <Pricing
              form={form as ProductFormApi}
              fields={productFields}
              categories={categories}
              isEditMode={isEditMode}
            />
          </div>

          <div id='packaging' className='scroll-mt-4'>
            <Packaging form={form as ProductFormApi} />
          </div>

          <div id='inventory' className='scroll-mt-4'>
            <Inventory
              form={form as ProductFormApi}
              isEditMode={isEditMode}
              product={product}
            />
          </div>

          <div id='attributes' className='scroll-mt-4'>
            <Attributes form={form as ProductFormApi} />
          </div>

          <div id='details' className='scroll-mt-4'>
            <Details form={form as ProductFormApi} />
          </div>

          {/* Mobile Actions */}
          <div className='sticky bottom-0 z-20 mt-4 border border-neutral-800 bg-neutral-900/85 p-0 pb-[calc(env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden'>
            <Button
              size='lg'
              type='submit'
              className='h-12 mb-2 w-full font-medium font-okxs'>
              {isSubmitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Create Product'}
            </Button>
            {status === 'success' && (
              <p className='mt-2 text-sm text-center text-emerald-400'>
                {isEditMode
                  ? 'Product updated successfully!'
                  : 'Product created successfully!'}
              </p>
            )}
            {status === 'error' && errorMessage && (
              <div className='mt-2 text-center text-rose-400'>
                {errorFieldLabel ? (
                  <p className='text-[11px] uppercase tracking-[0.18em] opacity-80'>
                    Field: {errorFieldLabel}
                  </p>
                ) : null}
                <p className='text-sm'>{errorMessage}</p>
              </div>
            )}
          </div>
        </form>
      </main>
    </div>
  )
}
