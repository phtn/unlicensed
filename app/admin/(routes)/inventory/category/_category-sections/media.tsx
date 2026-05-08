'use client'

import {LegacyImage as Image} from '@/components/ui/legacy-image'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {PrimaryImageConverterModal} from '@/app/admin/(routes)/inventory/product/primary-image-converter-modal'
import {Button, Drawer} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import type {ReadonlyStore} from '@tanstack/store'
import {useQuery} from 'convex/react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import {CategoryFormApi, CategoryFormValues} from '../category-schema'
import {extractImageDetails, normalizeTag, titleCaseTag} from '../../helpers'
import {FormSection, Header} from './components'

interface MediaProps {
  form: CategoryFormApi
}

interface FormStoreState {
  values: CategoryFormValues
}

type TagGalleryGroup = {
  tag: string
  total: number
  items: Array<{
    storageId: string
    caption: string | null
    url: string | null
  }>
}

export const Media = ({form}: MediaProps) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isConverterOpen, setIsConverterOpen] = useState(false)
  const [converterSourceFile, setConverterSourceFile] = useState<File | null>(
    null,
  )
  const [tagSearch, setTagSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [uploadedPreviewById, setUploadedPreviewById] = useState<
    Record<string, string>
  >({})
  const libraryUploadInputRef = useRef<HTMLInputElement>(null)

  const heroImageValue = useStore(
    form.store as ReadonlyStore<FormStoreState>,
    (state: FormStoreState) => (state.values.heroImage as string) ?? '',
  )

  const categorySlug = useStore(
    form.store as ReadonlyStore<FormStoreState>,
    (state: FormStoreState) => (state.values.slug as string) ?? '',
  )

  const categoryName = useStore(
    form.store as ReadonlyStore<FormStoreState>,
    (state: FormStoreState) => (state.values.name as string) ?? '',
  )

  const categoryBrands = useStore(
    form.store as ReadonlyStore<FormStoreState>,
    (state: FormStoreState) =>
      (state.values.brands ?? []).map((brand) => brand.name).filter(Boolean),
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

  const previewById = useMemo(() => {
    const map = new Map<string, string>()

    for (const group of allTaggedGroups) {
      for (const item of group.items) {
        if (item.url) {
          map.set(item.storageId, item.url)
        }
      }
    }

    for (const [storageId, url] of Object.entries(uploadedPreviewById)) {
      if (url) {
        map.set(storageId, url)
      }
    }

    return map
  }, [allTaggedGroups, uploadedPreviewById])

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

  const openLibrary = useCallback(() => {
    const nextTag = preferredTagFromCategory ?? allTaggedGroups[0]?.tag ?? null
    setTagSearch('')
    setActiveTag(nextTag)
    setIsLibraryOpen(true)
  }, [allTaggedGroups, preferredTagFromCategory])

  const selectLibraryImage = useCallback(
    (storageId: string) => {
      form.setFieldValue('heroImage', storageId)
      setIsLibraryOpen(false)
    },
    [form],
  )

  const clearHeroImage = useCallback(() => {
    form.setFieldValue('heroImage', '')
  }, [form])

  const openDrawerUploadPicker = useCallback(() => {
    if (!libraryUploadInputRef.current) {
      return
    }

    libraryUploadInputRef.current.value = ''
    libraryUploadInputRef.current.click()
  }, [])

  const handleDrawerUploadSelection = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0]
      event.target.value = ''

      if (!nextFile) {
        return
      }

      setConverterSourceFile(nextFile)
      setIsLibraryOpen(false)
    },
    [],
  )

  useEffect(() => {
    if (isLibraryOpen || !converterSourceFile || isConverterOpen) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsConverterOpen(true)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [converterSourceFile, isConverterOpen, isLibraryOpen])

  const handleConverterOpenChange = useCallback((isOpen: boolean) => {
    setIsConverterOpen(isOpen)

    if (!isOpen) {
      setConverterSourceFile(null)
    }
  }, [])

  const handleConvertedLibraryUpload = useCallback(
    ({storageId, url}: {storageId: string; url: string | null}) => {
      if (url) {
        setUploadedPreviewById((current) => ({
          ...current,
          [storageId]: url,
        }))
      }

      form.setFieldValue('heroImage', storageId)
      setConverterSourceFile(null)
      setIsConverterOpen(false)
    },
    [form],
  )

  const heroPreview = resolvePreview(heroImageValue)

  return (
    <>
      <FormSection id='media'>
        <Header label='Media' />
        <div className='grid gap-6'>
          <div className='space-y-3 w-fit'>
            <div className='flex items-center justify-between'>
              <label
                className={cn(
                  'text-base font-medium tracking-tight dark:text-light-gray capitalize',
                  {'text-blue-500': heroImageValue},
                )}>
                {`${categorySlug} Hero Image`}
              </label>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='tertiary'
                  // endContent={<Icon name='image-open-light' />}
                  className='dark:bg-blue-500 dark:text-white rounded-lg'
                  onPress={openLibrary}>
                  Browse
                </Button>
                {heroImageValue ? (
                  <Button
                    size='sm'
                    variant='tertiary'
                    className='bg-light-gray/0 dark:bg-transparent'
                    onPress={clearHeroImage}>
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>

            <button
              type='button'
              onClick={openLibrary}
              className={cn(
                'rounded-xl size-full md:size-100 relative overflow-hidden border border-dashed border-light-gray dark:border-dark-gray dark:bg-black/60 transition-colors text-left',
                {
                  'border-2 border-solid border-blue-500 dark:border-blue-500':
                    heroImageValue.trim().length > 0,
                },
              )}>
              {heroPreview ? (
                <Image
                  src={heroPreview}
                  alt='Hero image preview'
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
                  <span className='text-xs font-okxs'>
                    Select Hero Image from Gallery
                  </span>
                </div>
              )}
            </button>

            {heroImageValue && !resolvePreview(heroImageValue) ? (
              <p className='text-xs text-dark-gray/70 dark:text-light-gray/70'>
                Selected storage ID may not be in the tagged gallery index yet.
              </p>
            ) : null}
          </div>
        </div>
      </FormSection>

      <Drawer isOpen={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <Drawer.Backdrop variant='transparent'>
          <Drawer.Content placement='right'>
            <Drawer.Dialog className='w-full max-w-6xl bg-transparent p-0 shadow-none'>
              <Drawer.Header className='h-6 mt-2'>
                <div className='flex w-full items-center justify-between px-4'>
                  <div className='flex items-center space-x-4'>
                    <p className='rounded-md bg-foreground/15 px-3 py-1 font-polysans text-sm capitalize tracking-wide text-mac-blue backdrop-blur-3xl'>
                      Media Library
                    </p>
                    <input
                      ref={libraryUploadInputRef}
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={handleDrawerUploadSelection}
                    />
                    <Button
                      size='sm'
                      variant='outline'
                      className='rounded-md bg-white/80 font-semibold text-dark-table'
                      onPress={openDrawerUploadPicker}>
                      Upload Image
                    </Button>
                  </div>
                  <Button
                    size='sm'
                    variant='tertiary'
                    onPress={() => setIsLibraryOpen(false)}
                    className='rounded bg-foreground/50 px-2 py-1 text-white'>
                    <Icon name='x' className='text-xl' />
                  </Button>
                </div>
              </Drawer.Header>

              <Drawer.Body className='bg-transparent! p-0 text-foreground'>
                <div className='grid h-[calc(100vh-8rem)] grid-cols-1 p-4 md:grid-cols-[200px_1fr]'>
                  <aside className='min-h-0 rounded-s-xl border border-slate-400 bg-slate-800/20 p-4 backdrop-blur-lg dark:border-background/80 dark:bg-dark-table/50 md:max-h-[88vh]'>
                    <div className='space-y-2'>
                      <input
                        value={tagSearch}
                        onChange={(event) => setTagSearch(event.target.value)}
                        placeholder='Search tags'
                        className='w-full rounded-lg border border-slate-400 bg-background px-3 py-1 text-sm outline-none transition-colors focus:border-blue-500 dark:border-background/60 dark:bg-background/50'
                      />
                    </div>

                    <div className='mt-3 max-h-[78vh] space-y-1 overflow-y-auto pr-1'>
                      {filteredTagGroups.map((group) => {
                        const isActive = activeGroup?.tag === group.tag
                        return (
                          <button
                            key={group.tag}
                            type='button'
                            onClick={() => setActiveTag(group.tag)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-lg py-0.5 pl-3 text-left text-sm transition-colors',
                              isActive
                                ? 'bg-mac-blue/10 text-mac-blue dark:bg-background/40'
                                : 'text-foreground/75 hover:bg-foreground/5',
                            )}>
                            <span className='truncate'>
                              {titleCaseTag(group.tag)}
                            </span>
                            <span className='rounded-full px-2 py-0.5 text-[11px]'>
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

                  <section className='flex min-h-0 flex-col rounded-e-xl border border-l-0 border-slate-400 bg-slate-100 px-4 pt-1.5 pb-0.5 dark:border-dark-table/50 dark:bg-background'>
                    {activeGroup ? (
                      <>
                        <div className='flex flex-col gap-4'>
                          <div className='flex items-center justify-between'>
                            <h3 className='space-x-2 text-base font-semibold'>
                              <span>{titleCaseTag(activeGroup.tag)}</span>
                              {preferredTagFromCategory &&
                              preferredTagFromCategory === activeGroup.tag ? (
                                <span className='rounded border border-mac-blue/60 px-1.5 py-0.5 text-xs font-semibold tracking-wide text-mac-blue'>
                                  Matches Category
                                </span>
                              ) : null}
                            </h3>
                            <p className='text-xs opacity-70'>
                              {activeGroup.total} image
                              {activeGroup.total === 1 ? '' : 's'}
                            </p>
                          </div>
                        </div>

                        <div className='min-h-0 flex-1 overflow-y-auto pr-1'>
                          <div className='grid content-start grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
                            {activeGroup.items.map((item) => {
                              const itemLabel =
                                item.caption?.trim() || item.storageId
                              const isSelected =
                                item.storageId === heroImageValue
                              const imageDetails = extractImageDetails(itemLabel)
                              const imageName = imageDetails.name || itemLabel
                              const imageType = imageDetails.type || 'image'

                              return (
                                <div
                                  key={item.storageId}
                                  role='button'
                                  tabIndex={0}
                                  onClick={() =>
                                    selectLibraryImage(item.storageId)
                                  }
                                  onKeyDown={(event) => {
                                    if (
                                      event.key === 'Enter' ||
                                      event.key === ' '
                                    ) {
                                      event.preventDefault()
                                      selectLibraryImage(item.storageId)
                                    }
                                  }}
                                  aria-label={
                                    isSelected
                                      ? `${itemLabel} is the current hero image`
                                      : `Select ${itemLabel} as the hero image`
                                  }
                                  className={cn(
                                    'group relative overflow-hidden rounded-lg border-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
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

                                  <div className='pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between truncate bg-black/50 px-2 py-1 text-[10px] text-white'>
                                    <span className='capitalize'>
                                      {imageName}
                                    </span>
                                    <span className='text-[7px] font-semibold uppercase tracking-wide opacity-80'>
                                      {imageType}
                                    </span>
                                  </div>

                                  {isSelected ? (
                                    <div className='pointer-events-none absolute left-1.5 top-1.5 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white'>
                                      Selected
                                    </div>
                                  ) : null}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className='flex h-full items-center justify-center rounded-lg border border-dashed border-foreground/20 text-sm text-foreground/60'>
                        Choose a tag to view gallery images.
                      </div>
                    )}
                  </section>
                </div>
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>

      <PrimaryImageConverterModal
        isOpen={isConverterOpen}
        onOpenChangeAction={handleConverterOpenChange}
        onConvertedAction={handleConvertedLibraryUpload}
        sourceUrl={null}
        sourceFile={converterSourceFile}
        categorySlug={categorySlug}
        productBrands={categoryBrands}
        suggestedFileNameStem={categoryName || categorySlug}
        variant='library-upload'
      />
    </>
  )
}
