'use client'

import {useStorageUpload} from '@/hooks/use-storage-upload'
import {Icon} from '@/lib/icons'
import {Button, Image} from '@heroui/react'
import {useState} from 'react'
import {ProductFormValues} from '../product-schema'
import {FormInput, renderFields} from '../ui/fields'
import {useAppForm} from '../ui/form-context'
import {FormSection, Header} from './components'

interface MediaProps {
  form: ReturnType<typeof useAppForm>
  fields: Array<FormInput<ProductFormValues>>
}

export const Media = ({form, fields}: MediaProps) => {
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
    <FormSection id='media'>
      <Header label='Media' />
      <div className='grid gap-6'>
        {renderFields(form, fields)}
        <div className='flex w-full gap-6'>
          <form.AppField name='image'>
            {(field) => {
              const imageValue = (field.state.value as string) ?? ''
              const preview = getPreview(imageValue, imagePreviewMap)
              return (
                <div className='space-y-3 w-full flex-1'>
                  <div className='flex items-center justify-between flex-1'>
                    <label className='text-base font-medium tracking-tight dark:text-light-gray'>
                      Primary Image
                    </label>
                    <Button
                      size='sm'
                      variant='flat'
                      className='dark:bg-black/15'
                      onPress={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = async () => {
                          const file = input.files?.[0]
                          if (!file) return
                          try {
                            const {storageId, url} = await uploadFile(file)
                            field.handleChange(storageId)
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
                      Select Image
                    </Button>
                  </div>

                  <div className='rounded-xl size-100 relative py-8 flex flex-col items-center justify-center text-neutral-600 border border-dashed border-light-gray dark:border-dark-gray dark:bg-black/60'>
                    {/*<div className=' border border-neutral-800 bg-neutral-900/50 p-4 min-h-40 flex items-center justify-center overflow-hidden group'>*/}
                    {preview ? (
                      <Image
                        src={preview}
                        alt='Product preview'
                        className='max-h-60 w-full object-contain rounded-lg'
                      />
                    ) : (
                      <div className=' dark:text-light-gray flex flex-col items-center gap-2'>
                        <Icon
                          name='image-plus-light'
                          className='size-12 aspect-square opacity-50'
                        />
                        <span className='text-xs'>Select Primary Image</span>
                      </div>
                    )}
                  </div>

                  {/*<Input
                  value={String(field.state.value ?? '')}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='Or paste image URL / Storage ID'
                  size='sm'
                  variant='flat'
                  className=''
                />*/}
                </div>
              )
            }}
          </form.AppField>

          <form.AppField name='gallery'>
            {(field) => {
              const galleryValue = (field.state.value as string[]) ?? []
              return (
                <div className='space-y-3 w-full'>
                  <div className='flex items-center justify-between'>
                    <label className='text-base font-medium tracking-tight dark:text-light-gray'>
                      Gallery
                    </label>
                    <Button
                      size='sm'
                      variant='flat'
                      className='dark:bg-black/15'
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
                              newMap[storageId] =
                                url ?? URL.createObjectURL(file)
                            }

                            field.handleChange([...galleryValue, ...uploads])
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

                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 h-100'>
                    {galleryValue.map((storageId, index) => {
                      const preview = getPreview(storageId, galleryPreviewMap)
                      return (
                        <div
                          key={storageId + index}
                          className='relative aspect-square h-96 rounded-lg border bg-neutral-900 overflow-hidden group'>
                          {preview ? (
                            <Image
                              src={preview}
                              alt='Gallery item'
                              className='w-full h-full object-cover'
                            />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center text-neutral-700'>
                              <Icon name='image-open-light' />
                            </div>
                          )}
                          <button
                            type='button'
                            onClick={() => {
                              const newVal = [...galleryValue]
                              newVal.splice(index, 1)
                              field.handleChange(newVal)
                            }}
                            className='absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500'>
                            <Icon name='x' size={12} />
                          </button>
                        </div>
                      )
                    })}
                    {galleryValue.length === 0 && (
                      <div className='col-span-full py-8 flex flex-col items-center justify-center dark:text-light-gray border border-dashed  border-light-gray dark:border-dark-gray dark:bg-black/60 rounded-xl'>
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
