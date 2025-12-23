'use client'

import {api} from '@/convex/_generated/api'
import {useImageConverter} from '@/hooks/use-image-converter'
import {useStorageUpload} from '@/hooks/use-storage-upload'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useEffect, useState} from 'react'
import {CategoryFormApi} from '../category-schema'
import {FormSection, Header} from './components'

interface MediaProps {
  form: CategoryFormApi
}

interface HeroImageFieldProps {
  field: {
    state: {
      value: unknown
      meta: {isTouched: boolean; errors: Array<string | undefined>}
    }
    handleChange: (value: string) => void
    handleBlur: () => void
  }
  imagePreviewMap: Record<string, string>
  setImagePreviewMap: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >
  pendingPrimaryImage: {file: File; preview: string} | null
  setPendingPrimaryImage: React.Dispatch<
    React.SetStateAction<{file: File; preview: string} | null>
  >
  validationError: string | null
  setValidationError: React.Dispatch<React.SetStateAction<string | null>>
  isConverting: boolean
  setIsConverting: React.Dispatch<React.SetStateAction<boolean>>
  uploadFile: (file: File) => Promise<{storageId: string; url: string | null}>
  isUploading: boolean
  convert: (
    file: File,
    options: {format: 'avif' | 'webp' | 'jpeg'; quality?: number},
  ) => Promise<{
    blob: Blob
    size: number
    format: string
    originalSize: number
    compressionRatio: number
  }>
  validateImageFile: (file: File) => Promise<string | null>
}

const HeroImageField = ({
  field,
  imagePreviewMap,
  setImagePreviewMap,
  pendingPrimaryImage,
  setPendingPrimaryImage,
  validationError,
  setValidationError,
  isConverting,
  setIsConverting,
  uploadFile,
  isUploading,
  convert,
  validateImageFile,
}: HeroImageFieldProps) => {
  const imageValue = (field.state.value as string) ?? ''

  // Fetch storage URL if heroImage is a storage ID (not a URL)
  const storageUrl = useQuery(
    api.uploads.getStorageUrl,
    imageValue &&
      !imageValue.startsWith('http') &&
      !imageValue.startsWith('data:')
      ? {storageId: imageValue}
      : 'skip',
  )

  // Populate imagePreviewMap when storage URL is fetched
  useEffect(() => {
    if (
      imageValue &&
      storageUrl &&
      !imageValue.startsWith('http') &&
      !imageValue.startsWith('data:')
    ) {
      setImagePreviewMap((prev) => {
        // Only update if not already set
        if (prev[imageValue]) return prev
        return {
          ...prev,
          [imageValue]: storageUrl,
        }
      })
    }
  }, [imageValue, storageUrl, setImagePreviewMap])

  // Helper to get preview URL
  const getPreview = (storageId: string) => {
    if (!storageId) return null
    if (storageId.startsWith('http') || storageId.startsWith('data:')) {
      return storageId
    }
    return imagePreviewMap[storageId] ?? null
  }

  const preview = pendingPrimaryImage
    ? pendingPrimaryImage.preview
    : getPreview(imageValue)

  const handleFileSelect = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      // Clear previous validation error
      setValidationError(null)

      // Validate the file
      const error = await validateImageFile(file)
      if (error) {
        setValidationError(error)
        return
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPendingPrimaryImage({file, preview: previewUrl})
    }
    input.click()
  }

  const handleSave = async () => {
    if (!pendingPrimaryImage) return

    // Clear any previous validation errors
    setValidationError(null)

    setIsConverting(true)
    try {
      // Validate again before converting (in case file was modified)
      const error = await validateImageFile(pendingPrimaryImage.file)
      if (error) {
        setValidationError(error)
        setIsConverting(false)
        return
      }

      // Convert to webp
      const converted = await convert(pendingPrimaryImage.file, {
        format: 'webp',
        quality: 0.9,
      })

      // Create a File object from the converted blob
      const webpFile = new File(
        [converted.blob],
        `${pendingPrimaryImage.file.name.replace(/\.[^/.]+$/, '')}.webp`,
        {type: 'image/webp'},
      )

      // Upload the converted file
      const {storageId, url} = await uploadFile(webpFile)

      // Update form field
      field.handleChange(storageId)

      // Update preview map
      setImagePreviewMap((prev) => ({
        ...prev,
        [storageId]: url ?? pendingPrimaryImage.preview,
      }))

      // Clean up pending state
      URL.revokeObjectURL(pendingPrimaryImage.preview)
      setPendingPrimaryImage(null)
      setValidationError(null)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to convert and upload image. Please try again.'
      setValidationError(errorMessage)
      console.error('Failed to convert and upload', error)
    } finally {
      setIsConverting(false)
    }
  }

  const handleCancel = () => {
    if (pendingPrimaryImage) {
      URL.revokeObjectURL(pendingPrimaryImage.preview)
      setPendingPrimaryImage(null)
    }
    setValidationError(null)
  }

  return (
    <div className='space-y-3 w-full'>
      <div className='flex items-center justify-between'>
        <label
          className={cn(
            'text-base font-medium tracking-tight dark:text-light-gray',
            {'text-blue-500': preview},
          )}>
          {preview ? imageValue : 'Hero Image'}
        </label>
        {pendingPrimaryImage ? (
          <div className='flex gap-1'>
            <Button
              size='sm'
              onPress={handleSave}
              className='text-white bg-blue-500'
              isLoading={isConverting || isUploading}>
              Save Image
            </Button>
            <Button
              size='sm'
              variant='light'
              onPress={handleCancel}
              isDisabled={isConverting || isUploading}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size='sm'
            variant='flat'
            className='dark:bg-black/15'
            onPress={handleFileSelect}>
            Select Image
          </Button>
        )}
      </div>

      <div
        className={cn(
          'rounded-xl size-full md:size-100 relative overflow-hidden border border-dashed border-light-gray dark:border-dark-gray dark:bg-black/60',
          {
            'border-2 border-solid border-blue-500 dark:border-blue-500':
              imageValue.trim(),
          },
        )}>
        {preview ? (
          <Image
            src={preview}
            alt='Hero preview'
            radius='none'
            shadow='none'
            className='w-full h-full object-cover'
          />
        ) : (
          <div
            onClick={handleFileSelect}
            className='absolute inset-0 flex flex-col items-center justify-center gap-2 dark:text-light-gray'>
            <Icon
              name='image-plus-light'
              className='size-12 aspect-square opacity-50'
            />
            <span className='text-xs'>Select Hero Image</span>
          </div>
        )}
      </div>

      {validationError && (
        <div className='text-xs text-rose-500 flex space-x-1 bg-rose-50 w-fit py-1 px-2 rounded-lg'>
          <Icon name='alert-rhombus' className='size-4' />
          <span>{validationError}</span>
        </div>
      )}
      {field.state.meta.isTouched &&
        field.state.meta.errors.filter(Boolean).length > 0 && (
          <p className='text-xs text-rose-400'>
            {field.state.meta.errors.filter(Boolean).join(', ')}
          </p>
        )}
    </div>
  )
}

export const Media = ({form}: MediaProps) => {
  const {uploadFile, isUploading} = useStorageUpload()
  const {convert, validateImageFile} = useImageConverter()
  const [imagePreviewMap, setImagePreviewMap] = useState<
    Record<string, string>
  >({})
  const [pendingPrimaryImage, setPendingPrimaryImage] = useState<{
    file: File
    preview: string
  } | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  return (
    <FormSection id='media'>
      <Header label='Media' />
      <div className='grid gap-6'>
        <form.AppField name='heroImage'>
          {(field) => (
            <HeroImageField
              field={field}
              imagePreviewMap={imagePreviewMap}
              setImagePreviewMap={setImagePreviewMap}
              pendingPrimaryImage={pendingPrimaryImage}
              setPendingPrimaryImage={setPendingPrimaryImage}
              validationError={validationError}
              setValidationError={setValidationError}
              isConverting={isConverting}
              setIsConverting={setIsConverting}
              uploadFile={uploadFile}
              isUploading={isUploading}
              convert={convert}
              validateImageFile={validateImageFile}
            />
          )}
        </form.AppField>
      </div>
    </FormSection>
  )
}
