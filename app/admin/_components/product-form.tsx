'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useStorageUpload} from '@/hooks/use-storage-upload'
import {ensureSlug} from '@/lib/slug'
import {Image} from '@heroui/react'
import {useForm} from '@tanstack/react-form'
import {useStore} from '@tanstack/react-store'
import {useMutation} from 'convex/react'
import {useMemo, useState} from 'react'
import {z} from 'zod'

const formatError = (error: unknown) => {
  if (!error) return null
  if (Array.isArray(error)) {
    return error
      .map((item) => (typeof item === 'string' ? item : ''))
      .filter(Boolean)
      .join(', ')
  }
  return typeof error === 'string' ? error : null
}

const parseLines = (value?: string) =>
  (value ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

const parseNumbers = (value?: string) => {
  if (!value) return undefined
  const numbers = value
    .split(',')
    .map((item) => item.trim())
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item) && Number.isFinite(item))

  return numbers.length > 0 ? numbers : undefined
}

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  slug: z.string().optional(),
  categorySlug: z.string().min(1, 'Select a category.'),
  shortDescription: z.string().min(10, 'Short description is required.'),
  description: z.string().min(20, 'Description is required.'),
  priceCents: z.number().min(0, 'Price must be positive.'),
  unit: z.string().min(1, 'Unit is required.'),
  availableDenominationsRaw: z.string().optional(),
  popularDenomination: z.string().optional(),
  thcPercentage: z.number().min(0, 'THC percentage must be positive.'),
  cbdPercentage: z.string().optional(),
  effectsRaw: z.string().optional(),
  terpenesRaw: z.string().optional(),
  featured: z.boolean(),
  available: z.boolean(),
  stock: z.number().min(0, 'Stock must be positive.'),
  rating: z
    .number()
    .min(0, 'Rating must be at least 0.')
    .max(5, 'Rating must be 5 or less.'),
  image: z
    .string()
    .min(1, 'Upload a primary image or provide a URL/storage ID.'),
  gallery: z.array(z.string()),
  consumption: z.string().min(5, 'Consumption guidance is required.'),
  flavorNotesRaw: z.string().optional(),
  potencyLevel: z.enum(['mild', 'medium', 'high']),
  potencyProfile: z.string().optional(),
  weightGrams: z.string().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

type CategoryDoc = Doc<'categories'>

type ProductFormProps = {
  categories: CategoryDoc[]
}

export const ProductForm = ({categories}: ProductFormProps) => {
  const createProduct = useMutation(api.products.m.createProduct)
  const {uploadFile, isUploading} = useStorageUpload()
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [imagePreviewMap, setImagePreviewMap] = useState<
    Record<string, string>
  >({})
  const [galleryPreviewMap, setGalleryPreviewMap] = useState<
    Record<string, string>
  >({})

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
    terpenesRaw: '',
    featured: true,
    available: true,
    stock: 0,
    rating: 4.5,
    image: '',
    gallery: [],
    consumption: '',
    flavorNotesRaw: '',
    potencyLevel: 'medium',
    potencyProfile: '',
    weightGrams: '',
  }

  const form = useForm({
    defaultValues,
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
        const payload = {
          name: data.name.trim(),
          slug: ensureSlug(data.slug ?? '', data.name),
          categorySlug: data.categorySlug,
          shortDescription: data.shortDescription.trim(),
          description: data.description.trim(),
          priceCents: Math.round(data.priceCents),
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
          effects: parseLines(data.effectsRaw),
          terpenes: parseLines(data.terpenesRaw),
          featured: data.featured,
          available: data.available,
          stock: Math.round(data.stock),
          rating: data.rating,
          image: data.image,
          gallery: data.gallery,
          consumption: data.consumption.trim(),
          flavorNotes: parseLines(data.flavorNotesRaw),
          potencyLevel: data.potencyLevel,
          potencyProfile: data.potencyProfile?.trim() || undefined,
          weightGrams:
            data.weightGrams && data.weightGrams.length > 0
              ? Number(data.weightGrams)
              : undefined,
        }

        await createProduct(payload)
        formApi.reset()
        setSlugManuallyEdited(false)
        setStatus('success')
        setImagePreviewMap({})
        setGalleryPreviewMap({})
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to create product.'
        setErrorMessage(message)
        setStatus('error')
      }
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const imageValue = useStore(form.store, (state) => state.values.image)
  const galleryValues = useStore(form.store, (state) => state.values.gallery)
  const heroImagePreview = useMemo(() => {
    if (!imageValue) return null
    if (imageValue.startsWith('http') || imageValue.startsWith('data:')) {
      return imageValue
    }
    return imagePreviewMap[imageValue] ?? null
  }, [imagePreviewMap, imageValue])

  const availableCategories = useMemo(() => {
    return categories.sort((a, b) => a.name.localeCompare(b.name))
  }, [categories])

  return (
    <section className='rounded-xl border border-neutral-800 bg-neutral-950/60 p-6 shadow-lg shadow-black/30'>
      <header className='mb-6 space-y-1'>
        <h2 className='text-lg font-semibold text-neutral-100'>Add Product</h2>
        <p className='text-sm text-neutral-400'>
          Create a new product, assign it to a category, and manage media
          assets.
        </p>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
        className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
        <div className='space-y-5'>
          <form.Field name='name'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Name
                </label>
                <input
                  type='text'
                  value={field.state.value}
                  onChange={(event) => {
                    const nextName = event.target.value
                    field.handleChange(nextName)
                    if (!slugManuallyEdited) {
                      form.setFieldValue('slug', ensureSlug('', nextName))
                    }
                  }}
                  onBlur={field.handleBlur}
                  className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  placeholder='Sunrise Sativa Flower'
                />
                {field.state.meta.isTouched &&
                formatError(field.state.meta.errors) ? (
                  <p className='text-sm text-rose-400'>
                    {formatError(field.state.meta.errors)}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name='slug'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Slug
                </label>
                <input
                  type='text'
                  value={field.state.value}
                  onChange={(event) => {
                    setSlugManuallyEdited(true)
                    field.handleChange(event.target.value)
                  }}
                  onBlur={field.handleBlur}
                  className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  placeholder='sunrise-sativa-flower'
                />
                <p className='text-xs text-neutral-500'>
                  Auto-generated from name. Customize as needed.
                </p>
              </div>
            )}
          </form.Field>

          <form.Field name='categorySlug'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Category
                </label>
                <select
                  value={field.state.value}
                  onChange={(event) =>
                    field.handleChange(
                      event.target.value as typeof field.state.value,
                    )
                  }
                  onBlur={field.handleBlur}
                  className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500'>
                  <option value=''>Select a category</option>
                  {availableCategories.map((category) => (
                    <option key={category._id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {field.state.meta.isTouched &&
                formatError(field.state.meta.errors) ? (
                  <p className='text-sm text-rose-400'>
                    {formatError(field.state.meta.errors)}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name='shortDescription'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Short Description
                </label>
                <textarea
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  className='h-20 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  placeholder='A bright, citrus-forward cultivar for daytime clarity.'
                />
                {field.state.meta.isTouched &&
                formatError(field.state.meta.errors) ? (
                  <p className='text-sm text-rose-400'>
                    {formatError(field.state.meta.errors)}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name='description'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Description
                </label>
                <textarea
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  className='h-36 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  placeholder='Tell the story, cultivation details, and experience.'
                />
                {field.state.meta.isTouched &&
                formatError(field.state.meta.errors) ? (
                  <p className='text-sm text-rose-400'>
                    {formatError(field.state.meta.errors)}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          <div className='grid grid-cols-2 gap-4'>
            <form.Field name='priceCents'>
              {(field) => (
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-neutral-200'>
                    Price (in cents)
                  </label>
                  <input
                    type='number'
                    value={field.state.value}
                    onChange={(event) =>
                      field.handleChange(Number(event.target.value))
                    }
                    onBlur={field.handleBlur}
                    min={0}
                    className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  />
                  {field.state.meta.isTouched &&
                  formatError(field.state.meta.errors) ? (
                    <p className='text-sm text-rose-400'>
                      {formatError(field.state.meta.errors)}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>

            <form.Field name='unit'>
              {(field) => (
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-neutral-200'>
                    Unit
                  </label>
                  <input
                    type='text'
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                    placeholder='3.5g jar'
                  />
                  {field.state.meta.isTouched &&
                  formatError(field.state.meta.errors) ? (
                    <p className='text-sm text-rose-400'>
                      {formatError(field.state.meta.errors)}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name='availableDenominationsRaw'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Available Denominations{' '}
                  <span className='text-neutral-500'>(comma separated)</span>
                </label>
                <input
                  type='text'
                  value={field.state.value ?? ''}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  placeholder='1, 3.5, 7, 14'
                />
              </div>
            )}
          </form.Field>

          <form.Field name='popularDenomination'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Popular Denomination
                </label>
                <input
                  type='number'
                  value={field.state.value ?? ''}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  min={0}
                  className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  placeholder='3.5'
                />
              </div>
            )}
          </form.Field>

          <div className='grid grid-cols-2 gap-4'>
            <form.Field name='thcPercentage'>
              {(field) => (
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-neutral-200'>
                    THC %
                  </label>
                  <input
                    type='number'
                    value={field.state.value}
                    onChange={(event) =>
                      field.handleChange(Number(event.target.value))
                    }
                    onBlur={field.handleBlur}
                    min={0}
                    step='0.1'
                    className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  />
                  {field.state.meta.isTouched &&
                  formatError(field.state.meta.errors) ? (
                    <p className='text-sm text-rose-400'>
                      {formatError(field.state.meta.errors)}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>

            <form.Field name='cbdPercentage'>
              {(field) => (
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-neutral-200'>
                    CBD % <span className='text-neutral-500'>(optional)</span>
                  </label>
                  <input
                    type='number'
                    value={field.state.value ?? ''}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    min={0}
                    step='0.1'
                    className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  />
                </div>
              )}
            </form.Field>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <form.Field name='stock'>
              {(field) => (
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-neutral-200'>
                    Stock
                  </label>
                  <input
                    type='number'
                    value={field.state.value}
                    onChange={(event) =>
                      field.handleChange(Number(event.target.value))
                    }
                    onBlur={field.handleBlur}
                    min={0}
                    className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  />
                  {field.state.meta.isTouched &&
                  formatError(field.state.meta.errors) ? (
                    <p className='text-sm text-rose-400'>
                      {formatError(field.state.meta.errors)}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>

            <form.Field name='rating'>
              {(field) => (
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-neutral-200'>
                    Rating
                  </label>
                  <input
                    type='number'
                    value={field.state.value}
                    onChange={(event) =>
                      field.handleChange(Number(event.target.value))
                    }
                    onBlur={field.handleBlur}
                    min={0}
                    max={5}
                    step='0.1'
                    className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  />
                  {field.state.meta.isTouched &&
                  formatError(field.state.meta.errors) ? (
                    <p className='text-sm text-rose-400'>
                      {formatError(field.state.meta.errors)}
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <form.Field name='featured'>
              {(field) => (
                <label className='flex items-center gap-2 text-sm text-neutral-200'>
                  <input
                    type='checkbox'
                    checked={field.state.value}
                    onChange={(event) =>
                      field.handleChange(event.target.checked)
                    }
                    onBlur={field.handleBlur}
                    className='h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500'
                  />
                  Featured
                </label>
              )}
            </form.Field>

            <form.Field name='available'>
              {(field) => (
                <label className='flex items-center gap-2 text-sm text-neutral-200'>
                  <input
                    type='checkbox'
                    checked={field.state.value}
                    onChange={(event) =>
                      field.handleChange(event.target.checked)
                    }
                    onBlur={field.handleBlur}
                    className='h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-emerald-500'
                  />
                  Available for sale
                </label>
              )}
            </form.Field>
          </div>

          <form.Field name='effectsRaw'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Effects{' '}
                  <span className='text-neutral-500'>(one per line)</span>
                </label>
                <textarea
                  value={field.state.value ?? ''}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  className='h-24 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  placeholder={'Energetic\nCreative\nFocused'}
                />
              </div>
            )}
          </form.Field>

          <form.Field name='terpenesRaw'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Terpenes{' '}
                  <span className='text-neutral-500'>(one per line)</span>
                </label>
                <textarea
                  value={field.state.value ?? ''}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  className='h-24 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  placeholder={'Limonene\nPinene\nOcimene'}
                />
              </div>
            )}
          </form.Field>

          <form.Field name='flavorNotesRaw'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Flavor Notes{' '}
                  <span className='text-neutral-500'>(one per line)</span>
                </label>
                <textarea
                  value={field.state.value ?? ''}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  className='h-24 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  placeholder={'Citrus zest\nPine resin\nHoneyed earth'}
                />
              </div>
            )}
          </form.Field>
        </div>

        <div className='space-y-5'>
          <form.Field name='image'>
            {(field) => (
              <div className='space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <label className='text-sm font-medium text-neutral-200'>
                    Primary Image
                  </label>
                  <button
                    type='button'
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = async () => {
                        const file = input.files?.[0]
                        if (!file) return
                        try {
                          const {storageId, url} = await uploadFile(file)
                          field.setValue(storageId)
                          setImagePreviewMap((prev) => ({
                            ...prev,
                            [storageId]: url ?? URL.createObjectURL(file),
                          }))
                        } catch (error) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : 'Failed to upload image.'
                          setErrorMessage(message)
                          setStatus('error')
                        }
                      }
                      input.click()
                    }}
                    className='rounded-md border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/10'
                    disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
                <input
                  type='text'
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  placeholder='Paste storage ID or image URL'
                />
                {field.state.meta.isTouched &&
                formatError(field.state.meta.errors) ? (
                  <p className='text-sm text-rose-400'>
                    {formatError(field.state.meta.errors)}
                  </p>
                ) : null}
                {heroImagePreview ? (
                  <Image
                    src={heroImagePreview}
                    alt='Product preview'
                    className='max-h-60 w-full rounded-lg border border-neutral-800 object-cover'
                  />
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name='gallery'>
            {(field) => (
              <div className='space-y-4 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <label className='text-sm font-medium text-neutral-200'>
                    Gallery Images
                  </label>
                  <button
                    type='button'
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.multiple = true
                      input.onchange = async () => {
                        const files = input.files
                        if (!files || files.length === 0) return
                        try {
                          const uploads: Array<{
                            storageId: string
                            url: string
                          }> = []
                          for (const file of Array.from(files)) {
                            const result = await uploadFile(file)
                            uploads.push({
                              storageId: result.storageId,
                              url: result.url ?? URL.createObjectURL(file),
                            })
                          }
                          field.setValue([
                            ...field.state.value,
                            ...uploads.map((item) => item.storageId),
                          ])
                          setGalleryPreviewMap((prev) => {
                            const next = {...prev}
                            uploads.forEach(({storageId, url}) => {
                              next[storageId] = url
                            })
                            return next
                          })
                        } catch (error) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : 'Failed to upload gallery images.'
                          setErrorMessage(message)
                          setStatus('error')
                        }
                      }
                      input.click()
                    }}
                    className='rounded-md border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/10'
                    disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
                <p className='text-xs text-neutral-500'>
                  Upload one or more images or paste existing storage IDs below.
                </p>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <p className='text-xs text-neutral-500'>
                      Manage gallery entries below.
                    </p>
                    <button
                      type='button'
                      onClick={() => field.setValue([...field.state.value, ''])}
                      className='rounded-md border border-neutral-700 px-2 py-1 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-800'>
                      Add manual entry
                    </button>
                  </div>
                  {field.state.value.length === 0 ? (
                    <p className='text-sm text-neutral-500'>
                      No gallery images yet. Upload files or add manual entries.
                    </p>
                  ) : (
                    field.state.value.map((storageId) => {
                      const preview =
                        storageId.startsWith('http') ||
                        storageId.startsWith('data:')
                          ? storageId
                          : galleryPreviewMap[storageId]
                      return (
                        <div
                          key={storageId}
                          className='flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950/40 p-2'>
                          {preview ? (
                            <Image
                              src={preview}
                              alt='Gallery preview'
                              className='h-16 w-16 rounded-md object-cover'
                            />
                          ) : (
                            <div className='flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-neutral-700 text-xs text-neutral-500'>
                              Pending
                            </div>
                          )}
                          <input
                            type='text'
                            value={storageId}
                            onChange={(event) => {
                              const nextValue = event.target.value
                              field.setValue(
                                field.state.value.map((value) =>
                                  value === storageId ? nextValue : value,
                                ),
                              )
                            }}
                            className='flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500'
                          />
                          <button
                            type='button'
                            onClick={() => {
                              field.setValue(
                                field.state.value.filter(
                                  (value) => value !== storageId,
                                ),
                              )
                              setGalleryPreviewMap((prev) => {
                                const {[storageId]: x, ...rest} = prev
                                console.table(x)
                                return rest
                              })
                            }}
                            className='rounded-md bg-neutral-800 px-2 py-1 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-700'>
                            Remove
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </form.Field>

          <form.Field name='consumption'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Consumption Guidance
                </label>
                <textarea
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  className='h-32 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  placeholder='Share recommendations for best experience...'
                />
                {field.state.meta.isTouched &&
                formatError(field.state.meta.errors) ? (
                  <p className='text-sm text-rose-400'>
                    {formatError(field.state.meta.errors)}
                  </p>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name='potencyLevel'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Potency Level
                </label>
                <select
                  value={field.state.value}
                  onChange={(event) =>
                    field.handleChange(
                      event.target.value as typeof field.state.value,
                    )
                  }
                  onBlur={field.handleBlur}
                  className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500'>
                  <option value='mild'>Mild</option>
                  <option value='medium'>Medium</option>
                  <option value='high'>High</option>
                </select>
              </div>
            )}
          </form.Field>

          <form.Field name='potencyProfile'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Potency Profile{' '}
                  <span className='text-neutral-500'>(optional)</span>
                </label>
                <textarea
                  value={field.state.value ?? ''}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  className='h-24 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                  placeholder='Describe the potency arc...'
                />
              </div>
            )}
          </form.Field>

          <form.Field name='weightGrams'>
            {(field) => (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-neutral-200'>
                  Weight (grams){' '}
                  <span className='text-neutral-500'>(optional)</span>
                </label>
                <input
                  type='number'
                  value={field.state.value ?? ''}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  min={0}
                  step='0.1'
                  className='w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-emerald-500'
                />
              </div>
            )}
          </form.Field>
        </div>

        <div className='col-span-full flex items-center gap-3'>
          <button
            type='submit'
            className='rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400'
            disabled={
              isSubmitting || isUploading || galleryValues.length === 0
            }>
            {isSubmitting ? 'Saving...' : 'Create Product'}
          </button>
          {status === 'success' ? (
            <span className='text-sm text-emerald-400'>
              Product saved successfully.
            </span>
          ) : null}
          {status === 'error' && errorMessage ? (
            <span className='text-sm text-rose-400'>{errorMessage}</span>
          ) : null}
        </div>
      </form>
    </section>
  )
}
