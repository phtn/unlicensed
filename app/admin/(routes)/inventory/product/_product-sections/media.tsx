'use client'

import {FormInput, renderFields} from '@/app/admin/_components/ui/fields'
import {useAppForm} from '@/app/admin/_components/ui/form-context'
import {Id} from '@/convex/_generated/dataModel'
import {useImageConverter} from '@/hooks/use-image-converter'
import {useStorageUpload} from '@/hooks/use-storage-upload'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Image} from '@heroui/react'
import {Derived, useStore} from '@tanstack/react-store'
import {useMemo, useState} from 'react'
import {ProductFormValues} from '../product-schema'
import {FormSection, Header} from './components'

interface MediaProps {
  form: ReturnType<typeof useAppForm>
  fields: Array<FormInput<ProductFormValues>>
}

interface FormStoreState {
  values: ProductFormValues
}

export const Media = ({form, fields}: MediaProps) => {
  const {uploadFile, isUploading} = useStorageUpload()
  const {convert, validateImageFile} = useImageConverter()
  const [imagePreviewMap, setImagePreviewMap] = useState<
    Record<string, string>
  >({})
  const [galleryPreviewMap, setGalleryPreviewMap] = useState<
    Record<string, string>
  >({})
  const [pendingPrimaryImage, setPendingPrimaryImage] = useState<{
    file: File
    preview: string
  } | null>(null)
  const [pendingGalleryImages, setPendingGalleryImages] = useState<
    Array<{file: File; preview: string}>
  >([])
  const [isConverting, setIsConverting] = useState(false)
  const [isConvertingGallery, setIsConvertingGallery] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [galleryValidationErrors, setGalleryValidationErrors] = useState<
    Record<number, string | null>
  >({})

  // Get primary image value to include in gallery display (reactively)
  const primaryImageValue = useStore(
    form.store as unknown as Derived<FormStoreState, never>,
    (state: FormStoreState) => (state.values.image as Id<'_storage'>) ?? '',
  )

  const galleryValue = useStore(
    form.store as unknown as Derived<FormStoreState, never>,
    (state: FormStoreState) => (state.values.gallery as string[]) ?? [],
  )

  const allImageIds = useMemo(() => {
    const ids = [primaryImageValue, ...galleryValue].filter(Boolean)
    return [...new Set(ids)]
  }, [primaryImageValue, galleryValue])

  const resolveUrl = useStorageUrls(allImageIds)

  // Helper to get preview URL
  const getPreview = (storageId: string, map: Record<string, string>) => {
    if (!storageId) return null
    if (storageId.startsWith('http') || storageId.startsWith('data:')) {
      return storageId
    }
    // Check local preview map first (for newly uploaded files)
    if (map[storageId]) return map[storageId]

    // Then check resolved URLs from server
    return resolveUrl(storageId) || null
  }

  return (
    <FormSection id='media'>
      <Header label='Media' />
      <div className='grid gap-6'>
        {renderFields(form, fields)}
        <div className='flex w-full gap-6'>
          <form.AppField name='image'>
            {(field) => {
              const imageValue = (field.state.value as string) ?? ''
              const preview = pendingPrimaryImage
                ? pendingPrimaryImage.preview
                : getPreview(imageValue, imagePreviewMap)

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
                  const error = await validateImageFile(
                    pendingPrimaryImage.file,
                  )
                  if (error) {
                    setValidationError(error)
                    setIsConverting(false)
                    return
                  }

                  // Convert to webp
                  const converted = await convert(pendingPrimaryImage.file, {
                    format: 'webp',
                    quality: 0.8,
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
                <div className='space-y-3 w-full flex-1'>
                  <div className='flex items-center justify-between flex-1'>
                    <label className='text-base font-medium tracking-tight dark:text-light-gray'>
                      Primary Image
                    </label>
                    {pendingPrimaryImage ? (
                      <div className='flex gap-1'>
                        <Button
                          size='sm'
                          onPress={handleSave}
                          className='dark:bg-blue-500 dark:text-white'
                          isLoading={isConverting || isUploading}>
                          Save Image
                        </Button>
                        <Button
                          size='sm'
                          variant='light'
                          onPress={handleCancel}
                          className='bg-light-gray/10 dark:bg-transparent'
                          isDisabled={isConverting || isUploading}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size='sm'
                        variant='flat'
                        className='dark:bg-blue-500 dark:text-white'
                        onPress={handleFileSelect}>
                        Select Image
                      </Button>
                    )}
                  </div>

                  <div
                    className={cn(
                      'rounded-xl size-72 md:size-100 relative overflow-hidden border border-dashed border-light-gray dark:border-dark-gray dark:bg-black/60',
                      {
                        'border-2 border-solid border-blue-500 dark:border-blue-500':
                          primaryImageValue.trim(),
                      },
                    )}>
                    {preview ? (
                      <Image
                        src={preview}
                        alt='Product preview'
                        radius='none'
                        shadow='none'
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 dark:text-light-gray'>
                        <Icon
                          name='image-plus-light'
                          className='size-12 aspect-square opacity-50'
                        />
                        <span className='text-xs'>Select Primary Image</span>
                      </div>
                    )}
                  </div>
                  {validationError && (
                    <div className='text-xs text-rose-500 flex space-x-1 bg-rose-50 w-fit py-1 px-2 rounded-lg'>
                      <Icon name='alert-rhombus' className='size-4' />
                      <span>{validationError}</span>
                    </div>
                  )}
                </div>
              )
            }}
          </form.AppField>

          <form.AppField name='gallery'>
            {(field) => {
              const galleryValue = (field.state.value as string[]) ?? []

              // Combine primary image (if exists) with gallery, avoiding duplicates
              const displayImages = primaryImageValue
                ? [
                    primaryImageValue,
                    ...galleryValue.filter((id) => id !== primaryImageValue),
                  ]
                : galleryValue

              const handleGalleryFileSelect = async () => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.multiple = true
                input.onchange = async () => {
                  const files = input.files
                  if (!files?.length) return

                  // Clear previous validation errors
                  setGalleryValidationErrors({})

                  // Validate all files
                  const validFiles: Array<{file: File; preview: string}> = []
                  const errors: Record<number, string | null> = {}

                  for (let i = 0; i < files.length; i++) {
                    const file = files[i]
                    const error = await validateImageFile(file)
                    if (error) {
                      errors[validFiles.length + i] = error
                    } else {
                      validFiles.push({
                        file,
                        preview: URL.createObjectURL(file),
                      })
                    }
                  }

                  if (Object.keys(errors).length > 0) {
                    setGalleryValidationErrors(errors)
                  }

                  if (validFiles.length > 0) {
                    setPendingGalleryImages((prev) => [...prev, ...validFiles])
                  }
                }
                input.click()
              }

              const handleSaveGallery = async () => {
                if (pendingGalleryImages.length === 0) return

                // Clear any previous validation errors
                setGalleryValidationErrors({})

                setIsConvertingGallery(true)
                try {
                  const uploads: string[] = []
                  const newMap = {...galleryPreviewMap}

                  for (const pendingImage of pendingGalleryImages) {
                    // Validate again before converting (in case file was modified)
                    const error = await validateImageFile(pendingImage.file)
                    if (error) {
                      setGalleryValidationErrors((prev) => ({
                        ...prev,
                        [pendingGalleryImages.indexOf(pendingImage)]: error,
                      }))
                      setIsConvertingGallery(false)
                      return
                    }

                    // Convert to webp
                    const converted = await convert(pendingImage.file, {
                      format: 'webp',
                      quality: 0.8,
                    })

                    // Create a File object from the converted blob
                    const webpFile = new File(
                      [converted.blob],
                      `${pendingImage.file.name.replace(/\.[^/.]+$/, '')}.webp`,
                      {type: 'image/webp'},
                    )

                    // Upload the converted file
                    const {storageId, url} = await uploadFile(webpFile)
                    uploads.push(storageId)
                    newMap[storageId] = url ?? pendingImage.preview

                    // Clean up preview URL
                    URL.revokeObjectURL(pendingImage.preview)
                  }

                  // Read current gallery value from form state to avoid stale closures
                  const currentGallery = (field.state.value as string[]) ?? []
                  field.handleChange([...currentGallery, ...uploads])
                  setGalleryPreviewMap(newMap)
                  setPendingGalleryImages([])
                  setGalleryValidationErrors({})
                } catch (error) {
                  const errorMessage =
                    error instanceof Error
                      ? error.message
                      : 'Failed to convert and upload gallery images. Please try again.'
                  console.error('Failed to convert and upload gallery', error)
                  setGalleryValidationErrors({
                    [-1]: errorMessage,
                  })
                } finally {
                  setIsConvertingGallery(false)
                }
              }

              const handleCancelGallery = () => {
                // Clean up all preview URLs
                pendingGalleryImages.forEach((img) => {
                  URL.revokeObjectURL(img.preview)
                })
                setPendingGalleryImages([])
                setGalleryValidationErrors({})
              }

              const handleRemovePending = (index: number) => {
                const removed = pendingGalleryImages[index]
                URL.revokeObjectURL(removed.preview)
                setPendingGalleryImages((prev) =>
                  prev.filter((_, i) => i !== index),
                )
              }

              return (
                <div className='space-y-3 w-full'>
                  <div className='flex items-center justify-between'>
                    <label className='text-base font-medium tracking-tight dark:text-light-gray'>
                      Gallery
                    </label>
                    {pendingGalleryImages.length > 0 ? (
                      <div className='flex gap-1'>
                        <Button
                          size='sm'
                          color='primary'
                          onPress={handleSaveGallery}
                          className='dark:bg-blue-500 dark:text-white'
                          isLoading={isConvertingGallery || isUploading}>
                          Save Images
                        </Button>
                        <Button
                          size='sm'
                          variant='flat'
                          onPress={handleCancelGallery}
                          className='bg-light-gray/10'
                          isDisabled={isConvertingGallery || isUploading}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size='sm'
                        variant='flat'
                        className='dark:bg-black/15'
                        onPress={handleGalleryFileSelect}>
                        Add Images
                      </Button>
                    )}
                  </div>

                  <div className='flex flex-wrap gap-4'>
                    {/* Show primary image first if available */}
                    {displayImages.map((storageId, index) => {
                      const isPrimary =
                        index === 0 &&
                        primaryImageValue &&
                        storageId === primaryImageValue
                      const preview = getPreview(
                        storageId,
                        isPrimary ? imagePreviewMap : galleryPreviewMap,
                      )
                      return (
                        <div
                          key={storageId + index}
                          className={`relative w-32 h-32 rounded-xl group ${
                            isPrimary
                              ? 'border-2 border-blue-500'
                              : 'border-2 border-foreground/20 bg-background'
                          } ${primaryImageValue ? 'flex' : 'hidden'}`}>
                          {isPrimary && (
                            <div className='absolute z-200 -top-2.5 right-1.5 px-1.5 py-0 text-[8px] font-brk uppercase bg-blue-600 text-white rounded'>
                              Primary
                            </div>
                          )}
                          {preview ? (
                            <Image
                              src={preview}
                              radius='none'
                              alt={isPrimary ? 'Primary image' : 'Gallery item'}
                              className={cn(
                                'w-full h-full object-cover rounded-xl overflow-hidden',
                              )}
                            />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center text-dark-gray/50 rounded-xl'>
                              <Icon name='image-open-light' />
                            </div>
                          )}

                          {!isPrimary && (
                            <button
                              type='button'
                              onClick={() => {
                                const currentGallery =
                                  (field.state.value as string[]) ?? []
                                const newVal = currentGallery.filter(
                                  (id) => id !== storageId,
                                )
                                field.handleChange(newVal)
                              }}
                              className='absolute z-20 top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500'>
                              <Icon name='x' size={12} />
                            </button>
                          )}
                        </div>
                      )
                    })}

                    {/* Show pending gallery images */}
                    {pendingGalleryImages.map((pendingImage, index) => (
                      <div
                        key={`pending-${index}`}
                        className='relative w-32 h-32 rounded-xl border-2 border-dashed border-blue-500 bg-neutral-900 overflow-hidden group'>
                        <Image
                          src={pendingImage.preview}
                          alt='Pending gallery item'
                          className='w-full h-full object-cover opacity-70'
                        />
                        <div className='absolute inset-0 flex items-center justify-center bg-black/30'>
                          <span className='text-xs text-white font-medium'>
                            Pending
                          </span>
                        </div>
                        <button
                          type='button'
                          onClick={() => handleRemovePending(index)}
                          className='absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500'>
                          <Icon name='x' size={12} />
                        </button>
                        {galleryValidationErrors[index] && (
                          <div className='absolute bottom-0 left-0 right-0 bg-red-500/90 text-white text-xs p-1'>
                            {galleryValidationErrors[index]}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add Image Button */}
                    {pendingGalleryImages.length === 0 && (
                      <button
                        type='button'
                        onClick={handleGalleryFileSelect}
                        className='w-32 h-32 rounded-lg border border-dashed border-light-gray dark:border-dark-gray bg-light-gray/10 dark:bg-black/60 flex items-center justify-center hover:bg-light-gray/20 dark:hover:bg-black/80 transition-colors'>
                        <Icon
                          name='image-plus-light'
                          className='size-8 text-neutral-600 dark:text-light-gray opacity-50'
                        />
                      </button>
                    )}

                    {displayImages.length === 0 &&
                      pendingGalleryImages.length === 0 && (
                        <div className='w-full py-8 flex flex-col items-center justify-center dark:text-light-gray border border-dashed border-light-gray dark:border-dark-gray dark:bg-black/60 rounded-xl'>
                          <Icon
                            name='image-open-light'
                            className='size-12 mb-2 opacity-50'
                          />
                          <span className='text-xs'>Gallery images</span>
                        </div>
                      )}
                  </div>

                  {Object.keys(galleryValidationErrors).length > 0 && (
                    <div className='space-y-1'>
                      {Object.entries(galleryValidationErrors).map(
                        ([index, error]) =>
                          error && (
                            <p key={index} className='text-xs text-rose-400'>
                              {error}
                            </p>
                          ),
                      )}
                    </div>
                  )}
                </div>
              )
            }}
          </form.AppField>
        </div>
      </div>
    </FormSection>
  )
}
