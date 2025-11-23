'use client'

import {api} from '@/convex/_generated/api'
import {useStorageUpload} from '@/hooks/use-storage-upload'
import {Icon} from '@/lib/icons'
import {ensureSlug} from '@/lib/slug'
import {Button, Image, Input, Textarea} from '@heroui/react'
import {useForm} from '@tanstack/react-form'
import {useStore} from '@tanstack/react-store'
import {useMutation} from 'convex/react'
import {useState} from 'react'
import {z} from 'zod'

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  slug: z.string().optional(),
  description: z.string().min(10, 'Description is required.'),
  heroImage: z
    .string()
    .min(1, 'Please upload a hero image or provide an image URL/storage ID.'),
  highlight: z.string().optional(),
  benefitsRaw: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

const parseList = (value?: string) =>
  (value ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

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

type CategoryFormProps = {
  onCreated?: VoidFunction
}

export const CategoryForm = ({onCreated}: CategoryFormProps) => {
  const createCategory = useMutation(api.categories.m.create)
  const {uploadFile, isUploading} = useStorageUpload()
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [imagePreviewMap, setImagePreviewMap] = useState<
    Record<string, string>
  >({})

  const defaultValues: CategoryFormValues = {
    name: '',
    slug: '',
    description: '',
    heroImage: '',
    highlight: '',
    benefitsRaw: '',
  }

  const form = useForm({
    defaultValues,
    onSubmit: async ({value, formApi}) => {
      setStatus('idle')
      setErrorMessage(null)
      try {
        const parsed = categorySchema.safeParse(value)
        if (!parsed.success) {
          const message =
            parsed.error.issues[0]?.message ??
            'Please review the form for validation errors.'
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
        }

        await createCategory(payload)
        formApi.reset()
        setSlugManuallyEdited(false)
        setStatus('success')
        setImagePreviewMap({})
        onCreated?.()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to create category.'
        setErrorMessage(message)
        setStatus('error')
      }
    },
  })

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)
  const heroImageValue = useStore(form.store, (state) => state.values.heroImage)
  const heroImagePreview =
    heroImageValue.startsWith('http') || heroImageValue.startsWith('data:')
      ? heroImageValue
      : imagePreviewMap[heroImageValue]

  return (
    <section className='rounded-xl border border-neutral-800 p-6 shadow-lg shadow-black/30'>
      <header className='mb-6 space-y-1'>
        <h2 className='text-lg font-semibold tracking-tight'>
          Create Category
        </h2>
        <p className='text-sm'>
          Define a new collection with description, highlight, and benefits.
        </p>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
        className='space-y-5'>
        <form.Field name='name'>
          {(field) => (
            <div className='space-y-2'>
              <label className='block text-sm font-medium '>Name</label>
              <Input
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
                placeholder='Premium Flower'
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
              <label className='block text-sm font-medium '>Slug</label>
              <Input
                type='text'
                value={field.state.value}
                onChange={(event) => {
                  setSlugManuallyEdited(true)
                  field.handleChange(event.target.value)
                }}
                onBlur={field.handleBlur}
                placeholder='premium-flower'
              />
              <p className='text-xs text-neutral-500'>
                Auto-generated from name. Customize if needed.
              </p>
            </div>
          )}
        </form.Field>

        <form.Field name='description'>
          {(field) => (
            <div className='space-y-2'>
              <label className='block text-sm font-medium '>Description</label>
              <Textarea
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                className='h-28 '
                placeholder='Describe the category experience...'
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

        <form.Field name='highlight'>
          {(field) => (
            <div className='space-y-2'>
              <label className='block text-sm font-medium '>
                Highlight <span className='text-neutral-500'>(optional)</span>
              </label>
              <Input
                type='text'
                value={field.state.value ?? ''}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder='Hand-trimmed buds with rich terpene expression.'
              />
            </div>
          )}
        </form.Field>

        <form.Field name='benefitsRaw'>
          {(field) => (
            <div className='space-y-2'>
              <label className='block text-sm font-medium '>
                Benefits <span className='text-neutral-500'>(optional)</span>
              </label>
              <Textarea
                value={field.state.value ?? ''}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                className='h-24'
                placeholder={
                  'Enter one benefit per line\ne.g.\nFull-spectrum cannabinoids'
                }
              />
            </div>
          )}
        </form.Field>

        <form.Field name='heroImage'>
          {(field) => (
            <div className='space-y-3'>
              <div className='flex items-center justify-between gap-3'>
                <label className='text-sm font-medium '>Hero Image</label>
                <Button
                  type='button'
                  variant='flat'
                  size='sm'
                  onPress={() => {
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
                  className='px-3 py-1 text-xs font-semibold'
                  disabled={isUploading}>
                  <span className='tracking-tight'>
                    {isUploading ? 'Uploading...' : 'Browse file'}
                  </span>
                  <Icon name='open-folder' className='size-4' />
                </Button>
              </div>
              <Input
                type='text'
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder='Paste storage ID or image URL'
              />
              <p className='text-xs text-neutral-500'>
                Upload an image or paste an existing URL/storage ID.
              </p>
              {field.state.meta.isTouched &&
              formatError(field.state.meta.errors) ? (
                <p className='text-sm text-rose-400'>
                  {formatError(field.state.meta.errors)}
                </p>
              ) : null}

              {heroImagePreview ? (
                <Image
                  src={heroImagePreview}
                  alt='Hero preview'
                  className='max-h-48 w-full rounded-lg border border-neutral-800 object-cover'
                />
              ) : null}
            </div>
          )}
        </form.Field>

        <div className='flex items-center gap-3'>
          <Button
            type='submit'
            color='primary'
            variant='shadow'
            className='rounded-lg px-8 py-2 text-sm font-semibold tracking-tight transition disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400'
            disabled={isSubmitting || isUploading}>
            {isSubmitting ? 'Saving...' : 'Create Category'}
          </Button>
          {status === 'success' ? (
            <span className='text-sm'>Category saved successfully.</span>
          ) : null}
          {status === 'error' && errorMessage ? (
            <span className='text-sm text-rose-400'>{errorMessage}</span>
          ) : null}
        </div>
      </form>
    </section>
  )
}
