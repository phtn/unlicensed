'use client'

import {useImageConverter} from '@/hooks/use-image-converter'
import {useStorageUpload} from '@/hooks/use-storage-upload'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Image} from '@heroui/react'
import {useState} from 'react'
import {CategoryFormApi} from '../category-schema'
import {FormSection, Header} from './components'

interface MediaProps {
  form: CategoryFormApi
}

export const Media = ({form}: MediaProps) => {
  const {uploadFile, isUploading} = useStorageUpload()
  const {convert} = useImageConverter()
  const [imagePreviewMap, setImagePreviewMap] = useState<
    Record<string, string>
  >({})
  const [pendingPrimaryImage, setPendingPrimaryImage] = useState<{
    file: File
    preview: string
  } | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  // Helper to get preview URL
  const getPreview = (storageId: string) => {
    if (!storageId) return null
    if (storageId.startsWith('http') || storageId.startsWith('data:')) {
      return storageId
    }
    return imagePreviewMap[storageId] ?? null
  }

  return (
    <FormSection id='media'>
      <Header label='Media' />
      <div className='grid gap-6'>
        <form.AppField name='heroImage'>
          {(field) => {
            const imageValue = (field.state.value as string) ?? ''
            const preview = pendingPrimaryImage
              ? pendingPrimaryImage.preview
              : getPreview(imageValue)

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
              <div className='space-y-3 w-full'>
                <div className='flex items-center justify-between'>
                  <label className='text-base font-medium tracking-tight dark:text-light-gray'>
                    Hero Image
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
                    <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 dark:text-light-gray'>
                      <Icon
                        name='image-plus-light'
                        className='size-12 aspect-square opacity-50'
                      />
                      <span className='text-xs'>Select Hero Image</span>
                    </div>
                  )}
                </div>

                {field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0 && (
                    <p className='text-xs text-rose-400'>
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
              </div>
            )
          }}
        </form.AppField>
      </div>
    </FormSection>
  )
}
