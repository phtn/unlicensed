'use client'

import {FormInput, renderFields} from '@/app/admin/_components/ui/fields'
import {useAppForm} from '@/app/admin/_components/ui/form-context'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Drawer, DrawerContent, DrawerHeader, Image} from '@heroui/react'
import {Derived, useStore} from '@tanstack/react-store'
import {useQuery} from 'convex/react'
import {useCallback, useMemo, useState} from 'react'
import {ProductFormValues} from '../product-schema'
import {FormSection, Header} from './components'

interface MediaProps {
  form: ReturnType<typeof useAppForm>
  fields: Array<FormInput<ProductFormValues>>
}

interface FormStoreState {
  values: ProductFormValues
}

type MediaLibraryTarget = 'primary' | 'gallery'

type TagGalleryGroup = {
  tag: string
  total: number
  items: Array<{
    storageId: string
    caption: string | null
    url: string | null
  }>
}

const normalizeTag = (value: string) => value.trim().toLowerCase()

const titleCaseTag = (value: string) =>
  value
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')

export const Media = ({form, fields}: MediaProps) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [libraryTarget, setLibraryTarget] =
    useState<MediaLibraryTarget>('primary')
  const [tagSearch, setTagSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const primaryImageValue = useStore(
    form.store as unknown as Derived<FormStoreState, never>,
    (state: FormStoreState) => (state.values.image as string) ?? '',
  )

  const categorySlug = useStore(
    form.store as unknown as Derived<FormStoreState, never>,
    (state: FormStoreState) => (state.values.categorySlug as string) ?? '',
  )

  const galleryValue = useStore(
    form.store as unknown as Derived<FormStoreState, never>,
    (state: FormStoreState) => (state.values.gallery as string[]) ?? [],
  )

  const libraryResponse = useQuery(api.files.upload.listImageGalleriesByTag, {
    requiredTag: 'gallery:optimized',
    maxTags: 48,
    limitPerTag: 40,
  })

  const allTaggedGroups = useMemo(
    () => (libraryResponse?.tags ?? []) as TagGalleryGroup[],
    [libraryResponse],
  )

  const allSelectedImageIds = useMemo(
    () => [primaryImageValue, ...galleryValue].filter(Boolean),
    [primaryImageValue, galleryValue],
  )

  const previewById = useMemo(() => {
    const map = new Map<string, string>()

    for (const group of allTaggedGroups) {
      for (const item of group.items) {
        if (item.url) {
          map.set(item.storageId, item.url)
        }
      }
    }

    return map
  }, [allTaggedGroups])

  const resolvePreview = useCallback(
    (storageId: string) => {
      if (!storageId) {
        return null
      }
      if (storageId.startsWith('http') || storageId.startsWith('data:')) {
        return storageId
      }
      return previewById.get(storageId) ?? null
    },
    [previewById],
  )

  const filteredTagGroups = useMemo(() => {
    const normalizedSearch = normalizeTag(tagSearch)
    if (!normalizedSearch) {
      return allTaggedGroups
    }

    return allTaggedGroups.filter((group) =>
      normalizeTag(group.tag).includes(normalizedSearch),
    )
  }, [allTaggedGroups, tagSearch])

  const preferredTagFromCategory = useMemo(() => {
    const normalizedCategory = normalizeTag(categorySlug)
    if (!normalizedCategory) {
      return null
    }

    return (
      filteredTagGroups.find((group) => {
        const normalizedTag = normalizeTag(group.tag)
        return (
          normalizedTag === normalizedCategory ||
          normalizedTag.includes(normalizedCategory) ||
          normalizedCategory.includes(normalizedTag)
        )
      })?.tag ?? null
    )
  }, [categorySlug, filteredTagGroups])

  const activeGroup = useMemo(() => {
    if (filteredTagGroups.length === 0) {
      return null
    }

    if (!activeTag) {
      return filteredTagGroups[0]
    }

    return (
      filteredTagGroups.find((group) => group.tag === activeTag) ??
      filteredTagGroups[0]
    )
  }, [activeTag, filteredTagGroups])

  const openLibrary = useCallback(
    (target: MediaLibraryTarget) => {
      const nextTag =
        preferredTagFromCategory ?? allTaggedGroups[0]?.tag ?? null
      setTagSearch('')
      setActiveTag(nextTag)
      setLibraryTarget(target)
      setIsLibraryOpen(true)
    },
    [allTaggedGroups, preferredTagFromCategory],
  )

  const clearPrimaryImage = useCallback(() => {
    form.setFieldValue('image', '')
  }, [form])

  const toggleGalleryItem = useCallback(
    (storageId: string) => {
      const nextGallery = galleryValue.includes(storageId)
        ? galleryValue.filter((id) => id !== storageId)
        : [...galleryValue, storageId]

      form.setFieldValue('gallery', nextGallery)
    },
    [form, galleryValue],
  )

  const selectLibraryImage = useCallback(
    (storageId: string) => {
      if (libraryTarget === 'primary') {
        form.setFieldValue('image', storageId)
        setIsLibraryOpen(false)
        return
      }

      toggleGalleryItem(storageId)
    },
    [form, libraryTarget, toggleGalleryItem],
  )

  const displayImages = useMemo(() => {
    if (!primaryImageValue) {
      return galleryValue
    }

    return [
      primaryImageValue,
      ...galleryValue.filter((id) => id !== primaryImageValue),
    ]
  }, [galleryValue, primaryImageValue])

  const primaryPreview = resolvePreview(primaryImageValue)

  return (
    <>
      <FormSection id='media'>
        <Header label='Media' />
        <div className='grid gap-6'>
          <div className='grid gap-6 lg:grid-cols-2'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <label className='text-base font-medium tracking-tight dark:text-light-gray'>
                  Primary Image
                </label>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='flat'
                    className='dark:bg-blue-500 dark:text-white'
                    onPress={() => openLibrary('primary')}>
                    Browse Tags
                  </Button>
                  {primaryImageValue ? (
                    <Button
                      size='sm'
                      variant='light'
                      className='bg-light-gray/10 dark:bg-transparent'
                      onPress={clearPrimaryImage}>
                      Clear
                    </Button>
                  ) : null}
                </div>
              </div>

              <button
                type='button'
                onClick={() => openLibrary('primary')}
                className={cn(
                  'rounded-xl size-72 md:size-100 relative overflow-hidden border border-dashed border-light-gray dark:border-dark-gray dark:bg-black/60 transition-colors text-left',
                  {
                    'border-2 border-solid border-blue-500 dark:border-blue-500':
                      primaryImageValue.trim().length > 0,
                  },
                )}>
                {primaryPreview ? (
                  <Image
                    src={primaryPreview}
                    alt='Primary image preview'
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
                    <span className='text-xs'>Choose Primary Image</span>
                  </div>
                )}
              </button>
            </div>

            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <label className='text-base font-medium tracking-tight dark:text-light-gray'>
                  Gallery
                </label>
                <Button
                  size='sm'
                  variant='flat'
                  className='dark:bg-black/15'
                  onPress={() => openLibrary('gallery')}>
                  Browse Tags
                </Button>
              </div>

              <div className='flex min-h-72 flex-wrap gap-4 rounded-xl border border-dashed border-light-gray p-4 dark:border-dark-gray dark:bg-black/60'>
                {displayImages.map((storageId, index) => {
                  const isPrimary =
                    primaryImageValue.length > 0 &&
                    storageId === primaryImageValue
                  const preview = resolvePreview(storageId)

                  return (
                    <div
                      key={`${storageId}-${index}`}
                      className={cn(
                        'relative size-32 rounded-xl border-2 group',
                        {
                          'border-blue-500': isPrimary,
                          'border-foreground/20 bg-background': !isPrimary,
                        },
                      )}>
                      {isPrimary ? (
                        <div className='absolute z-40 -top-2.5 right-1.5 rounded bg-blue-600 px-1.5 py-0 text-[8px] font-brk uppercase text-white'>
                          Primary
                        </div>
                      ) : null}

                      {preview ? (
                        <Image
                          src={preview}
                          radius='none'
                          alt={isPrimary ? 'Primary image' : 'Gallery image'}
                          className='size-full rounded-[9px] object-cover'
                        />
                      ) : (
                        <div className='flex size-full items-center justify-center rounded-xl text-dark-gray/50'>
                          <Icon name='image-open-light' />
                        </div>
                      )}

                      {!isPrimary ? (
                        <button
                          type='button'
                          onClick={() => toggleGalleryItem(storageId)}
                          className='absolute right-1 top-1 z-20 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500'>
                          <Icon name='x' size={12} />
                        </button>
                      ) : null}
                    </div>
                  )
                })}

                {displayImages.length === 0 ? (
                  <button
                    type='button'
                    onClick={() => openLibrary('gallery')}
                    className='flex w-full flex-col items-center justify-center py-8 text-light-gray'>
                    <Icon
                      name='image-open-light'
                      className='mb-2 size-12 opacity-50'
                    />
                    <span className='text-xs'>
                      Select tagged gallery images
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className='rounded-xl border border-light-gray/60 bg-light-gray/5 p-4 dark:border-dark-gray/60 dark:bg-black/40'>
            <p className='mb-3 text-xs font-medium uppercase tracking-[0.12em] text-dark-gray/60 dark:text-light-gray/70'>
              Manual override
            </p>
            {renderFields(form, fields)}
          </div>

          {allSelectedImageIds.some((id) => !resolvePreview(id)) ? (
            <p className='text-xs text-dark-gray/70 dark:text-light-gray/70'>
              Some selected storage IDs are not in the tagged gallery index yet.
            </p>
          ) : null}
        </div>
      </FormSection>

      <Drawer
        placement='right'
        isOpen={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        size='5xl'>
        <DrawerContent className='max-w-6xl bg-background p-0'>
          <DrawerHeader className='border-b border-foreground/10'>
            <div className='flex w-full items-center justify-between gap-3'>
              <div className='space-y-0.5'>
                <p className='text-sm font-semibold uppercase tracking-[0.08em] text-blue-500'>
                  Media Library
                </p>
                <p className='text-sm text-foreground/70'>
                  {libraryTarget === 'primary'
                    ? 'Choose one image for the primary slot.'
                    : 'Select or remove gallery images by clicking them.'}
                </p>
              </div>
              <Button
                size='sm'
                variant='flat'
                onPress={() => setIsLibraryOpen(false)}>
                Done
              </Button>
            </div>
          </DrawerHeader>

          <div className='grid h-[calc(100vh-8rem)] grid-cols-1 gap-4 p-4 md:grid-cols-[260px_1fr]'>
            <aside className='rounded-xl border border-foreground/10 bg-background/80 p-3'>
              <div className='space-y-2'>
                <label className='text-xs font-medium uppercase tracking-widest opacity-70'>
                  Gallery Tags
                </label>
                <input
                  value={tagSearch}
                  onChange={(event) => setTagSearch(event.target.value)}
                  placeholder='Search tags'
                  className='w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-blue-500'
                />
              </div>

              <div className='mt-3 max-h-[calc(100vh-16rem)] space-y-1 overflow-y-auto pr-1'>
                {filteredTagGroups.map((group) => {
                  const isActive = activeGroup?.tag === group.tag
                  return (
                    <button
                      key={group.tag}
                      type='button'
                      onClick={() => setActiveTag(group.tag)}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                        isActive
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'hover:bg-foreground/5',
                      )}>
                      <span className='truncate'>
                        {titleCaseTag(group.tag)}
                      </span>
                      <span className='rounded bg-foreground/10 px-1.5 py-0.5 text-[11px]'>
                        {group.total}
                      </span>
                    </button>
                  )
                })}

                {filteredTagGroups.length === 0 ? (
                  <div className='rounded-lg border border-dashed border-foreground/20 px-3 py-4 text-xs text-foreground/60'>
                    No tagged gallery images found.
                  </div>
                ) : null}
              </div>
            </aside>

            <section className='rounded-xl border border-foreground/10 bg-background/80 p-3 md:p-4'>
              {activeGroup ? (
                <>
                  <div className='mb-3 flex items-center justify-between'>
                    <div>
                      <h3 className='text-base font-semibold'>
                        {titleCaseTag(activeGroup.tag)}
                      </h3>
                      <p className='text-xs opacity-70'>
                        {activeGroup.total} tagged image
                        {activeGroup.total === 1 ? '' : 's'}
                      </p>
                    </div>
                    {preferredTagFromCategory &&
                    preferredTagFromCategory === activeGroup.tag ? (
                      <span className='rounded bg-blue-500/10 px-2 py-1 text-[11px] font-medium text-blue-500'>
                        Matches category
                      </span>
                    ) : null}
                  </div>

                  <div className='grid max-h-[calc(100vh-16rem)] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4'>
                    {activeGroup.items.map((item) => {
                      const isSelected =
                        libraryTarget === 'primary'
                          ? item.storageId === primaryImageValue
                          : galleryValue.includes(item.storageId)

                      return (
                        <button
                          key={item.storageId}
                          type='button'
                          onClick={() => selectLibraryImage(item.storageId)}
                          className={cn(
                            'group relative overflow-hidden rounded-xl border-2 text-left transition-all',
                            {
                              'border-blue-500 ring-2 ring-blue-500/40':
                                isSelected,
                              'border-foreground/20 hover:border-foreground/40':
                                !isSelected,
                            },
                          )}>
                          {item.url ? (
                            <Image
                              src={item.url}
                              alt={item.caption ?? item.storageId}
                              radius='none'
                              className='aspect-square w-full object-cover'
                            />
                          ) : (
                            <div className='flex aspect-square w-full items-center justify-center bg-foreground/5 text-foreground/50'>
                              <Icon name='image-open-light' />
                            </div>
                          )}

                          <div className='absolute inset-x-0 bottom-0 truncate bg-black/50 px-2 py-1 text-[10px] text-white'>
                            {item.caption?.trim() || item.storageId}
                          </div>

                          {isSelected ? (
                            <div className='absolute left-1.5 top-1.5 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white'>
                              {libraryTarget === 'primary'
                                ? 'Selected'
                                : 'Added'}
                            </div>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className='flex h-full items-center justify-center rounded-lg border border-dashed border-foreground/20 text-sm text-foreground/60'>
                  Choose a tag to view gallery images.
                </div>
              )}
            </section>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
