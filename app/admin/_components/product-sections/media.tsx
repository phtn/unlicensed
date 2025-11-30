'use client'

import {
  TextureCard,
  TextureCardContent,
  TextureCardHeader,
  TextureCardTitle,
} from '@/components/ui/texture-card'
import {useStorageUpload} from '@/hooks/use-storage-upload'
import {Icon} from '@/lib/icons'
import {Button, Image, Input} from '@heroui/react'
import {useState} from 'react'
import {ProductFormApi} from '../product-schema'

interface MediaProps {
  form: ProductFormApi
}

export const Media = ({form}: MediaProps) => {
  const {uploadFile, isUploading} = useStorageUpload()
  const [imagePreviewMap, setImagePreviewMap] = useState<
    Record<string, string>
  >({})
  const [galleryPreviewMap, setGalleryPreviewMap] = useState<
    Record<string, string>
  >({})

  // Helper to get preview URL
  const getPreview = (storageId: string, map: Record<string, string>) => {
    if (!storageId) return null
    if (storageId.startsWith('http') || storageId.startsWith('data:')) {
      return storageId
    }
    return map[storageId] ?? null
  }

  return (
    <TextureCard id='media'>
      <TextureCardHeader>
        <TextureCardTitle>Media</TextureCardTitle>
      </TextureCardHeader>
      <TextureCardContent className='grid gap-6'>
        <form.Field name='image'>
          {(field) => {
            const preview = getPreview(field.state.value, imagePreviewMap)
            return (
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium text-neutral-300'>
                    Primary Image
                  </label>
                  <Button
                    size='sm'
                    variant='flat'
                    color='primary'
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
                          console.error('Failed to upload', error)
                        }
                      }
                      input.click()
                    }}
                    isLoading={isUploading}>
                    Upload Image
                  </Button>
                </div>

                <div className='relative rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 min-h-40 flex items-center justify-center overflow-hidden group'>
                  {preview ? (
                    <Image
                      src={preview}
                      alt='Product preview'
                      className='max-h-60 w-full object-contain rounded-lg'
                    />
                  ) : (
                    <div className='text-neutral-600 flex flex-col items-center gap-2'>
                      <Icon name='image' className='size-8 opacity-50' />
                      <span className='text-xs'>No image selected</span>
                    </div>
                  )}
                </div>

                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='Or paste image URL / Storage ID'
                  size='sm'
                  variant='flat'
                  // classNames={{
                  //   inputWrapper: 'bg-neutral-900',
                  // }}
                />
              </div>
            )
          }}
        </form.Field>

        <form.Field name='gallery'>
          {(field) => (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <label className='text-sm font-medium text-neutral-300'>
                  Gallery
                </label>
                <Button
                  size='sm'
                  variant='flat'
                  onPress={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.multiple = true
                    input.onchange = async () => {
                      const files = input.files
                      if (!files?.length) return
                      try {
                        const uploads: string[] = []
                        const newMap = {...galleryPreviewMap}

                        for (const file of Array.from(files)) {
                          const {storageId, url} = await uploadFile(file)
                          uploads.push(storageId)
                          newMap[storageId] = url ?? URL.createObjectURL(file)
                        }

                        field.setValue([...field.state.value, ...uploads])
                        setGalleryPreviewMap(newMap)
                      } catch (error) {
                        console.error('Failed to upload gallery', error)
                      }
                    }
                    input.click()
                  }}
                  isLoading={isUploading}>
                  Add Images
                </Button>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                {field.state.value.map((storageId, index) => {
                  const preview = getPreview(storageId, galleryPreviewMap)
                  return (
                    <div
                      key={storageId + index}
                      className='relative aspect-square rounded-lg border border-neutral-800 bg-neutral-900 overflow-hidden group'>
                      {preview ? (
                        <Image
                          src={preview}
                          alt='Gallery item'
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center text-neutral-700'>
                          <Icon name='image' />
                        </div>
                      )}
                      <button
                        type='button'
                        onClick={() => {
                          const newVal = [...field.state.value]
                          newVal.splice(index, 1)
                          field.setValue(newVal)
                        }}
                        className='absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500'>
                        <Icon name='x' size={12} />
                      </button>
                    </div>
                  )
                })}
                {field.state.value.length === 0 && (
                  <div className='col-span-full py-8 flex flex-col items-center justify-center text-neutral-600 border border-dashed border-neutral-800 rounded-xl'>
                    <Icon name='images' className='size-8 mb-2 opacity-50' />
                    <span className='text-xs'>No gallery images</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </form.Field>
      </TextureCardContent>
    </TextureCard>
  )
}
