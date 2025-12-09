'use client'

import {Id} from '@/convex/_generated/dataModel'
import {useImageConverter} from '@/hooks/use-image-converter'
import {useStorageUpload} from '@/hooks/use-storage-upload'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Image} from '@heroui/react'
import {Derived, useStore} from '@tanstack/react-store'
import {useState} from 'react'
import {ProductFormValues} from '../product-schema'
import {FormInput, renderFields} from '../ui/fields'
import {useAppForm} from '../ui/form-context'
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
  const {convert} = useImageConverter()
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

  // Get primary image value to include in gallery display (reactively)
  const primaryImageValue = useStore(
    form.store as unknown as Derived<FormStoreState, never>,
    (state: FormStoreState) => (state.values.image as Id<'_storage'>) ?? '',
  )

  // Helper to get preview URL
  const getPreview = (storageId: string, map: Record<string, string>) => {
    if (!storageId) return null
    if (storageId.startsWith('http') || storageId.startsWith('data:')) {
      return storageId
    }
    return map[storageId] ?? null
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

              const handleFileSelect = () => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = () => {
                  const file = input.files?.[0]
                  if (!file) return

                  // Create preview
                  const previewUrl = URL.createObjectURL(file)
                  setPendingPrimaryImage({file, preview: previewUrl})
                }
                input.click()
              }

              const handleSave = async () => {
                if (!pendingPrimaryImage) return

                setIsConverting(true)
                try {
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
                } catch (error) {
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
                          color='primary'
                          onPress={handleSave}
                          className='text-blue-500'
                          isLoading={isConverting || isUploading}>
                          Save Image
                        </Button>
                        <Button
                          size='sm'
                          variant='flat'
                          onPress={handleCancel}
                          className='bg-light-gray/10'
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
                      'rounded-xl size-100 relative overflow-hidden border border-dashed border-light-gray dark:border-dark-gray dark:bg-black/60',
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

              const handleGalleryFileSelect = () => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.multiple = true
                input.onchange = () => {
                  const files = input.files
                  if (!files?.length) return

                  // Create previews for all selected files
                  const newPendingImages = Array.from(files).map((file) => ({
                    file,
                    preview: URL.createObjectURL(file),
                  }))
                  setPendingGalleryImages((prev) => [
                    ...prev,
                    ...newPendingImages,
                  ])
                }
                input.click()
              }

              const handleSaveGallery = async () => {
                if (pendingGalleryImages.length === 0) return

                setIsConvertingGallery(true)
                try {
                  const uploads: string[] = []
                  const newMap = {...galleryPreviewMap}

                  for (const pendingImage of pendingGalleryImages) {
                    // Convert to webp
                    const converted = await convert(pendingImage.file, {
                      format: 'webp',
                      quality: 0.9,
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

                  field.handleChange([...galleryValue, ...uploads])
                  setGalleryPreviewMap(newMap)
                  setPendingGalleryImages([])
                } catch (error) {
                  console.error('Failed to convert and upload gallery', error)
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
                          className='text-blue-500'
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
                          className={`relative w-32 h-32 rounded-xl overflow-hidden group ${
                            isPrimary
                              ? 'border-2 border-blue-500'
                              : 'border bg-neutral-900'
                          }`}>
                          {preview ? (
                            <Image
                              src={preview}
                              radius='none'
                              alt={isPrimary ? 'Primary image' : 'Gallery item'}
                              className='w-full h-full object-cover'
                            />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center text-neutral-700'>
                              <Icon name='image-open-light' />
                            </div>
                          )}
                          {isPrimary && (
                            <div className='absolute top-1 left-1 px-2 py-0.5 text-xs font-medium bg-blue-500/80 text-white rounded'>
                              Primary
                            </div>
                          )}
                          {!isPrimary && (
                            <button
                              type='button'
                              onClick={() => {
                                const newVal = [...galleryValue]
                                const galleryIndex = newVal.indexOf(storageId)
                                if (galleryIndex !== -1) {
                                  newVal.splice(galleryIndex, 1)
                                  field.handleChange(newVal)
                                }
                              }}
                              className='absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500'>
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
                        className='relative w-32 h-32 rounded-lg border-2 border-dashed border-blue-500 bg-neutral-900 overflow-hidden group'>
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
                </div>
              )
            }}
          </form.AppField>
        </div>
      </div>
    </FormSection>
  )
}
