'use client'

import {FormInput} from '@/app/admin/_components/ui/fields'
import {useAppForm} from '@/app/admin/_components/ui/form-context'
import {Alert, AlertDescription, AlertTitle} from '@/components/reui/alert'
import {api} from '@/convex/_generated/api'
import {useFileUpload} from '@/hooks/use-file-upload'
import {useStorageUpload} from '@/hooks/use-storage-upload'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Drawer} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import type {ReadonlyStore} from '@tanstack/store'
import {useQuery} from 'convex/react'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {PrimaryImageConverterModal} from '../primary-image-converter-modal'
import {ProductFormValues} from '../product-schema'
import {FormSection, Header} from './components'


import {LegacyImage as Image} from '@/components/ui/legacy-image'

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

type UploadState = {
  status: 'uploading' | 'error'
  message?: string
}

const MAX_UPLOAD_FILES = 12
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024

const normalizeTag = (value: string) => value.trim().toLowerCase()

const titleCaseTag = (value: string) =>
  value
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')

const summarizeStorageId = (value: string) =>
  value.length <= 16 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`

export const Media = ({form, fields: _fields}: MediaProps) => {
  const {uploadFile} = useStorageUpload()
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [isConverterOpen, setIsConverterOpen] = useState(false)
  const [recentlyOptimizedStorageIds, setRecentlyOptimizedStorageIds] =
    useState<string[]>([])
  const [libraryTarget, setLibraryTarget] =
    useState<MediaLibraryTarget>('primary')
  const [tagSearch, setTagSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [uploadStateById, setUploadStateById] = useState<
    Record<string, UploadState>
  >({})
  const [uploadedPreviewById, setUploadedPreviewById] = useState<
    Record<string, string>
  >({})
  const processingFileIdsRef = useRef<Set<string>>(new Set())

  const primaryImageValue = useStore(
    form.store as ReadonlyStore<FormStoreState>,
    (state: FormStoreState) => (state.values.image as string) ?? '',
  )

  const categorySlug = useStore(
    form.store as ReadonlyStore<FormStoreState>,
    (state: FormStoreState) => (state.values.categorySlug as string) ?? '',
  )

  const productName = useStore(
    form.store as ReadonlyStore<FormStoreState>,
    (state: FormStoreState) => (state.values.name as string) ?? '',
  )

  const productBrands = useStore(
    form.store as ReadonlyStore<FormStoreState>,
    (state: FormStoreState) =>
      ((state.values.brand as string[] | undefined) ?? []).filter(Boolean),
  )

  const galleryValue = useStore(
    form.store as ReadonlyStore<FormStoreState>,
    (state: FormStoreState) => (state.values.gallery as string[]) ?? [],
  )

  const libraryResponse = useQuery(api.files.upload.listImageGalleriesByTag, {
    requiredTag: 'gallery:optimized',
    maxTags: 48,
    limitPerTag: 40,
  })

  const [
    {files: queuedFiles, isDragging, errors: uploadValidationErrors},
    {
      removeFile: removeQueuedFile,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      getInputProps,
    },
  ] = useFileUpload({
    accept: 'image/*',
    maxFiles: MAX_UPLOAD_FILES,
    maxSize: MAX_UPLOAD_SIZE,
    multiple: true,
  })

  const allTaggedGroups = useMemo(
    () => (libraryResponse?.tags ?? []) as TagGalleryGroup[],
    [libraryResponse],
  )

  const selectedStorageIds = useMemo(
    () => [
      ...new Set(
        [primaryImageValue, ...galleryValue].filter(
          (value): value is string =>
            !!value && !value.startsWith('http') && !value.startsWith('data:'),
        ),
      ),
    ],
    [primaryImageValue, galleryValue],
  )

  const resolvedSelectedUrls = useQuery(
    api.uploads.getStorageUrls,
    selectedStorageIds.length > 0 ? {storageIds: selectedStorageIds} : 'skip',
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

    for (const item of resolvedSelectedUrls ?? []) {
      if (item.url) {
        map.set(item.storageId, item.url)
      }
    }

    return map
  }, [allTaggedGroups, uploadedPreviewById, resolvedSelectedUrls])

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

  const removeGalleryItem = useCallback(
    (storageId: string) => {
      if (!galleryValue.includes(storageId)) {
        return
      }

      form.setFieldValue(
        'gallery',
        galleryValue.filter((id) => id !== storageId),
      )
    },
    [form, galleryValue],
  )

  const setPrimaryImage = useCallback(
    (storageId: string) => {
      if (!storageId || storageId === primaryImageValue) {
        return
      }

      const nextGallery = galleryValue.filter((id) => id !== storageId)
      if (
        primaryImageValue &&
        primaryImageValue !== storageId &&
        !nextGallery.includes(primaryImageValue)
      ) {
        nextGallery.unshift(primaryImageValue)
      }

      form.setFieldValue('image', storageId)
      form.setFieldValue('gallery', nextGallery)
    },
    [form, galleryValue, primaryImageValue],
  )

  const attachUploadedStorageIds = useCallback(
    (storageIds: string[]) => {
      if (storageIds.length === 0) {
        return
      }

      let nextPrimary = primaryImageValue.trim()
      const nextGallery = [...galleryValue]

      for (const storageId of storageIds) {
        if (!storageId) {
          continue
        }

        if (!nextPrimary) {
          nextPrimary = storageId
          continue
        }

        if (storageId !== nextPrimary && !nextGallery.includes(storageId)) {
          nextGallery.push(storageId)
        }
      }

      form.setFieldValue('image', nextPrimary)
      form.setFieldValue('gallery', nextGallery)
    },
    [form, galleryValue, primaryImageValue],
  )

  const dismissQueuedFile = useCallback(
    (fileId: string) => {
      processingFileIdsRef.current.delete(fileId)
      removeQueuedFile(fileId)
      setUploadStateById((current) => {
        const next = {...current}
        delete next[fileId]
        return next
      })
    },
    [removeQueuedFile],
  )

  useEffect(() => {
    const nextQueuedFiles = queuedFiles.filter(
      (item) =>
        item.file instanceof File && !processingFileIdsRef.current.has(item.id),
    )

    if (nextQueuedFiles.length === 0) {
      return
    }

    for (const item of nextQueuedFiles) {
      processingFileIdsRef.current.add(item.id)
    }

    setUploadStateById((current) => {
      const next = {...current}
      for (const item of nextQueuedFiles) {
        next[item.id] = {status: 'uploading'}
      }
      return next
    })

    let cancelled = false

    const uploadQueuedFiles = async () => {
      const uploadedStorageIds: string[] = []

      for (const item of nextQueuedFiles) {
        if (cancelled || !(item.file instanceof File)) {
          return
        }

        try {
          const {storageId, url} = await uploadFile(item.file)
          if (cancelled) {
            return
          }

          if (url) {
            setUploadedPreviewById((current) => ({
              ...current,
              [storageId]: url,
            }))
          }

          uploadedStorageIds.push(storageId)
          dismissQueuedFile(item.id)
        } catch (error) {
          if (cancelled) {
            return
          }

          const message =
            error instanceof Error ? error.message : 'Failed to upload file.'

          setUploadStateById((current) => ({
            ...current,
            [item.id]: {
              status: 'error',
              message,
            },
          }))
        }
      }

      if (!cancelled) {
        attachUploadedStorageIds(uploadedStorageIds)
      }
    }

    void uploadQueuedFiles()

    return () => {
      cancelled = true
    }
  }, [attachUploadedStorageIds, dismissQueuedFile, queuedFiles, uploadFile])

  const selectLibraryImage = useCallback(
    (storageId: string) => {
      if (libraryTarget === 'primary') {
        setPrimaryImage(storageId)
        setIsLibraryOpen(false)
        return
      }

      if (storageId === primaryImageValue) {
        return
      }

      toggleGalleryItem(storageId)
    },
    [libraryTarget, primaryImageValue, setPrimaryImage, toggleGalleryItem],
  )

  const setLeadFromLibrary = useCallback(
    (storageId: string) => {
      setPrimaryImage(storageId)

      if (libraryTarget === 'primary') {
        setIsLibraryOpen(false)
      }
    },
    [libraryTarget, setPrimaryImage],
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

  const displayMediaItems = useMemo(
    () =>
      displayImages.map((storageId, index) => {
        const isPrimary =
          primaryImageValue.length > 0 && storageId === primaryImageValue
        const preview = resolvePreview(storageId)
        const galleryIndex = primaryImageValue ? index : index + 1

        return {
          storageId,
          preview,
          isPrimary,
          badgeLabel: isPrimary ? 'Lead' : `#${index + 1}`,
          label: isPrimary ? 'Lead image' : `Gallery ${galleryIndex}`,
          summary: preview
            ? isPrimary
              ? 'Primary image'
              : 'Gallery image'
            : summarizeStorageId(storageId),
        }
      }),
    [displayImages, primaryImageValue, resolvePreview],
  )

  const primaryMediaItem = useMemo(
    () => displayMediaItems.find((item) => item.isPrimary) ?? null,
    [displayMediaItems],
  )

  const galleryMediaItems = useMemo(
    () => displayMediaItems.filter((item) => !item.isPrimary),
    [displayMediaItems],
  )

  const thumbnailMediaItems = useMemo(
    () => galleryMediaItems.slice(0, 4),
    [galleryMediaItems],
  )

  const remainingMediaCount = Math.max(galleryMediaItems.length - 4, 0)

  const hasUnresolvedDisplayImages = useMemo(
    () =>
      displayImages.some(
        (storageId) =>
          !storageId.startsWith('http') &&
          !storageId.startsWith('data:') &&
          !resolvePreview(storageId),
      ),
    [displayImages, resolvePreview],
  )

  const queuedTotalBytes = useMemo(
    () =>
      queuedFiles.reduce((total, item) => {
        if (item.file instanceof File) {
          return total + item.file.size
        }
        return total
      }, 0),
    [queuedFiles],
  )

  const uploadMessages = useMemo(
    () => [
      ...new Set([
        ...uploadValidationErrors,
        ...Object.values(uploadStateById)
          .map((state) =>
            state.status === 'error'
              ? (state.message ?? 'Upload failed.')
              : null,
          )
          .filter((message): message is string => !!message),
      ]),
    ],
    [uploadStateById, uploadValidationErrors],
  )

  const activeUploadCount = useMemo(
    () =>
      Object.values(uploadStateById).filter(
        (state) => state.status === 'uploading',
      ).length,
    [uploadStateById],
  )

  const optimizedStorageIds = useMemo(() => {
    const ids = new Set(recentlyOptimizedStorageIds)

    for (const group of allTaggedGroups) {
      for (const item of group.items) {
        ids.add(item.storageId)
      }
    }

    return ids
  }, [allTaggedGroups, recentlyOptimizedStorageIds])

  const canConvertPrimaryImage = useMemo(
    () =>
      Boolean(
        primaryMediaItem?.preview &&
        primaryImageValue &&
        !optimizedStorageIds.has(primaryImageValue),
      ),
    [optimizedStorageIds, primaryImageValue, primaryMediaItem?.preview],
  )

  const handleConvertedPrimary = useCallback(
    ({storageId, url}: {storageId: string; url: string | null}) => {
      if (url) {
        setUploadedPreviewById((current) => ({
          ...current,
          [storageId]: url,
        }))
      }

      setRecentlyOptimizedStorageIds((current) =>
        current.includes(storageId) ? current : [...current, storageId],
      )
      setPrimaryImage(storageId)
      setIsConverterOpen(false)
    },
    [setPrimaryImage],
  )

  return (
    <>
      <FormSection>
        <Header label='Media' />
        <div className='grid gap-6'>
          <section
            className={cn(
              'rounded-2xl border border-dashed p-5 transition-colors',
              isDragging
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-foreground/15 bg-background/60',
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}>
            <input {...getInputProps()} className='sr-only' />

            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div className='flex items-start gap-4'>
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg',
                    isDragging ? 'bg-blue-500/10' : 'bg-foreground/5',
                  )}>
                  <Icon
                    name='image-plus-light'
                    className={cn(
                      'size-8',
                      isDragging ? 'text-blue-500' : 'text-foreground/60',
                    )}
                  />
                </div>

                <div className='space-y-0.5'>
                  <h3 className='text-base font-semibold'>
                    Upload Product Images
                  </h3>
                  <p className='text-sm text-foreground/70'>
                    Select images from the product gallery.
                  </p>
                </div>
              </div>
              <div className='flex items-center space-x-4'>
                <Button
                  id='converter-trigger'
                  variant='tertiary'
                  className='rounded-lg bg-indigo-950 text-white dark:text-white'
                  isDisabled={!canConvertPrimaryImage}
                  onPress={() => setIsConverterOpen(true)}>
                  {!canConvertPrimaryImage
                    ? 'Image Optimized'
                    : 'Optimize Primary Image'}
                  <Icon
                    name='lightning'
                    className='size-5 rotate-6 text-yellow-500'
                  />
                </Button>
                <Button
                  variant='tertiary'
                  className='rounded-lg bg-blue-500 text-white dark:text-white'
                  onPress={() => openLibrary('gallery')}>
                  Select Primary Image
                  <Icon name='image-plus-light' className='size-5' />
                </Button>
              </div>
            </div>

            {(queuedFiles.length > 0 || activeUploadCount > 0) && (
              <div className='mt-5 flex flex-wrap items-center gap-3 text-xs text-foreground/60'>
                <span>
                  Queue: {queuedFiles.length}/{MAX_UPLOAD_FILES}
                </span>
                <span>
                  {Math.round(MAX_UPLOAD_SIZE / (1024 * 1024))}MB max per file
                </span>
                <span>
                  Pending size:{' '}
                  {queuedTotalBytes > 0
                    ? `${(queuedTotalBytes / (1024 * 1024)).toFixed(2)} MB`
                    : '0 MB'}
                </span>
                {activeUploadCount > 0 ? (
                  <span className='inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-1 text-blue-500'>
                    <span className='size-3 animate-spin rounded-full border border-current border-r-transparent' />
                    Uploading {activeUploadCount}
                  </span>
                ) : null}
              </div>
            )}

            {queuedFiles.length > 0 ? (
              <div className='mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                {queuedFiles.map((item) => {
                  const uploadState = uploadStateById[item.id]
                  const isUploading = uploadState?.status === 'uploading'
                  const isError = uploadState?.status === 'error'

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'overflow-hidden rounded-xl border bg-background',
                        {
                          'border-blue-500/30': isUploading,
                          'border-red-500/40': isError,
                          'border-foreground/10': !isUploading && !isError,
                        },
                      )}>
                      <div className='relative aspect-square overflow-hidden bg-foreground/5'>
                        {item.preview ? (
                          <Image
                            src={item.preview}
                            alt={item.file.name}
                            radius='none'
                            shadow='none'
                            className='size-full object-cover'
                          />
                        ) : (
                          <div className='flex size-full items-center justify-center text-foreground/40'>
                            <Icon name='image-open-light' className='size-7' />
                          </div>
                        )}

                        {isUploading ? (
                          <div className='absolute inset-0 flex items-center justify-center bg-black/45 text-white'>
                            <div className='flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs'>
                              <span className='size-3.5 animate-spin rounded-full border border-current border-r-transparent' />
                              Uploading
                            </div>
                          </div>
                        ) : null}

                        {!isUploading ? (
                          <button
                            type='button'
                            onClick={() => dismissQueuedFile(item.id)}
                            className='absolute right-2 top-2 rounded-full bg-black/55 p-1.5 text-white transition-colors hover:bg-black/75'>
                            <Icon name='x' size={14} />
                          </button>
                        ) : null}
                      </div>

                      <div className='space-y-1 p-3'>
                        <p className='truncate text-sm font-medium'>
                          {item.file.name}
                        </p>
                        <p className='text-xs text-foreground/55'>
                          {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        {isError && uploadState?.message ? (
                          <p className='text-xs text-red-500'>
                            {uploadState.message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {uploadMessages.length > 0 ? (
              <Alert variant='destructive' className='mt-5'>
                <AlertTitle>File upload error(s)</AlertTitle>
                <AlertDescription>
                  {uploadMessages.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </AlertDescription>
              </Alert>
            ) : null}
            <div className='mt-6 space-y-3'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h3 className='text-sm font-semibold'>Selected Media</h3>
                    <span className='bg-background/80 px-2 py-0.5 text-sm text-mac-blue'>
                      {displayMediaItems.length} total
                    </span>
                    {remainingMediaCount > 0 ? (
                      <span className='rounded-full border border-foreground/10 bg-background/80 px-2 py-0.5 text-[11px] text-foreground/60'>
                        +{remainingMediaCount} more
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className='flex flex-wrap gap-2'>
                  <Button
                    size='sm'
                    variant='tertiary'
                    className='rounded-lg'
                    onPress={() => openLibrary('gallery')}>
                    Add Gallery Images
                    <Icon name='image-open-light' className='size-5' />
                  </Button>
                  {primaryImageValue ? (
                    <Button
                      size='sm'
                      variant='tertiary'
                      className='bg-light-gray/0 dark:bg-transparent'
                      onPress={clearPrimaryImage}>
                      Clear Primary
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className='grid gap-4 md:grid-cols-[minmax(0,14rem)_1fr] md:items-start'>
                <div className='space-y-2'>
                  <p className='text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/55'>
                    Primary Image
                  </p>

                  {primaryMediaItem ? (
                    <div className='group relative aspect-square w-full max-w-40 overflow-hidden rounded-2xl border border-foreground/10 bg-background sm:max-w-48 md:max-w-none'>
                      {primaryMediaItem.preview ? (
                        <Image
                          src={primaryMediaItem.preview}
                          alt={primaryMediaItem.label}
                          radius='none'
                          shadow='none'
                          removeWrapper
                          className='pointer-events-none size-full object-cover'
                        />
                      ) : (
                        <div className='flex size-full items-center justify-center bg-foreground/5 text-foreground/45'>
                          <Icon
                            name='image-open-light'
                            className='size-8 opacity-70'
                          />
                        </div>
                      )}

                      <div className='absolute left-3 top-3 z-10 rounded bg-blue-600 px-2 py-1 text-xs font-medium uppercase tracking-[0.12em] text-white'>
                        Lead
                      </div>

                      <button
                        type='button'
                        onClick={clearPrimaryImage}
                        className='absolute right-3 top-3 z-20 flex size-8 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-red-500'
                        aria-label='Clear lead image'>
                        <Icon name='x' size={14} />
                      </button>

                      <div className='absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/80 via-black/30 to-transparent px-3 py-3 text-white'>
                        <p className='truncate text-sm font-medium'>
                          {primaryMediaItem.label}
                        </p>
                        <p className='truncate text-xs text-white/75'>
                          {primaryMediaItem.summary}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type='button'
                      onClick={() => openLibrary('gallery')}
                      className='flex aspect-square w-full max-w-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-foreground/20 bg-background/50 px-4 text-center transition-colors hover:border-blue-500/50 hover:bg-blue-500/5 sm:max-w-48 md:max-w-none'>
                      <div className='flex size-11 items-center justify-center rounded-full bg-foreground/5 text-foreground/70'>
                        <Icon name='image-plus-light' className='size-5' />
                      </div>
                      <div className='space-y-1'>
                        <p className='text-sm font-semibold'>
                          Select primary image
                        </p>
                      </div>
                    </button>
                  )}
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between gap-3'>
                    <p className='text-[11px] font-medium uppercase tracking-[0.16em] text-foreground/55'>
                      Gallery Slots
                    </p>
                    {remainingMediaCount > 0 ? (
                      <span className='rounded-full border border-foreground/10 bg-background/80 px-2 py-0.5 text-[11px] text-foreground/60'>
                        +{remainingMediaCount} more
                      </span>
                    ) : null}
                  </div>

                  <div className='overflow-x-auto pb-1 sm:overflow-visible sm:pb-0'>
                    <div className='flex w-max gap-3 sm:grid sm:w-full sm:grid-cols-4'>
                      {Array.from({length: 4}).map((_, index) => {
                        const item = thumbnailMediaItems[index]
                        const slotLabel = `Gallery slot ${index + 1}`

                        if (!item) {
                          return (
                            <button
                              key={`empty-slot-${index}`}
                              type='button'
                              onClick={() => openLibrary('gallery')}
                              className='group relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl border border-dashed border-foreground/20 bg-background/50 text-left transition-colors hover:border-blue-500/50 hover:bg-blue-500/5 sm:w-auto'>
                              <div className='flex size-full flex-col items-center justify-center gap-2 text-foreground/45'>
                                <Icon
                                  name='image-plus-light'
                                  className='size-7 opacity-70'
                                />
                                <span className='text-[11px] font-medium uppercase tracking-[0.16em]'>
                                  {slotLabel}
                                </span>
                              </div>
                            </button>
                          )
                        }

                        return (
                          <div
                            key={item.storageId}
                            className='group relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl border border-foreground/10 bg-background sm:w-auto'>
                            {item.preview ? (
                              <Image
                                src={item.preview}
                                alt={item.label}
                                radius='none'
                                shadow='none'
                                removeWrapper
                                className='pointer-events-none size-full object-cover'
                              />
                            ) : (
                              <div className='flex size-full items-center justify-center bg-foreground/5 text-foreground/45'>
                                <Icon
                                  name='image-open-light'
                                  className='size-7'
                                />
                              </div>
                            )}

                            <div className='absolute left-2 top-2 z-10 rounded bg-black/60 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white'>
                              {item.badgeLabel}
                            </div>

                            <div className='absolute right-2 top-2 z-20 flex gap-1.5'>
                              <button
                                type='button'
                                onClick={() => setPrimaryImage(item.storageId)}
                                className='rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-white transition-colors hover:bg-blue-600'>
                                Lead
                              </button>
                              <button
                                type='button'
                                onClick={() =>
                                  removeGalleryItem(item.storageId)
                                }
                                className='flex size-7 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-red-500'
                                aria-label={`Remove ${item.label.toLowerCase()}`}>
                                <Icon name='x' size={12} />
                              </button>
                            </div>

                            <div className='absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/80 via-black/30 to-transparent px-2 py-2 text-white'>
                              <p className='truncate text-xs font-medium'>
                                {item.label}
                              </p>
                              <p className='truncate text-[11px] text-white/75'>
                                {item.summary}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {hasUnresolvedDisplayImages ? (
            <p className='text-xs text-dark-gray/70 dark:text-light-gray/70'>
              Some selected storage IDs have not resolved to preview URLs yet.
            </p>
          ) : null}
        </div>
      </FormSection>

      <PrimaryImageConverterModal
        isOpen={isConverterOpen}
        onOpenChangeAction={setIsConverterOpen}
        onConvertedAction={handleConvertedPrimary}
        sourceUrl={primaryMediaItem?.preview ?? null}
        categorySlug={categorySlug}
        productBrands={productBrands}
        suggestedFileNameStem={productName}
      />

      <Drawer isOpen={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
        <Drawer.Backdrop>
          <Drawer.Content placement='right'>
            <Drawer.Dialog className='w-full max-w-6xl bg-background p-0'>
              <Drawer.Header className='border-b border-foreground/10'>
                <div className='flex w-full items-center justify-between gap-3'>
                  <div className='space-y-0.5'>
                    <p className='text-sm font-semibold uppercase tracking-[0.08em] text-blue-500'>
                      Media Library
                    </p>
                    <p className='text-sm text-foreground/70'>
                      Click any image to add it to the gallery. Use Lead to
                      promote an image, or remove it from the top-right button.
                    </p>
                  </div>
                  <Button
                    size='sm'
                    variant='tertiary'
                    onPress={() => setIsLibraryOpen(false)}>
                    Done
                  </Button>
                </div>
              </Drawer.Header>

              <Drawer.Body className='p-0'>
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
                      const itemLabel = item.caption?.trim() || item.storageId
                      const isLead = item.storageId === primaryImageValue
                      const isSelected =
                        libraryTarget === 'primary'
                          ? isLead
                          : galleryValue.includes(item.storageId)
                      const isActive = isLead || isSelected

                      return (
                        <div
                          key={item.storageId}
                          role='button'
                          tabIndex={0}
                          onClick={() => selectLibraryImage(item.storageId)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              selectLibraryImage(item.storageId)
                            }
                          }}
                          aria-label={
                            libraryTarget === 'primary'
                              ? `Select ${itemLabel} as primary image`
                              : isLead
                                ? `${itemLabel} is the current lead image`
                                : isSelected
                                  ? `Remove ${itemLabel} from gallery`
                                  : `Add ${itemLabel} to gallery`
                          }
                          aria-pressed={
                            libraryTarget === 'gallery' ? isActive : undefined
                          }
                          className={cn(
                            'group relative overflow-hidden rounded-xl border-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
                            {
                              'border-blue-500 ring-2 ring-blue-500/40':
                                isActive,
                              'border-foreground/20 hover:border-foreground/40':
                                !isActive,
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

                          <div className='pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/50 px-2 py-1 text-[10px] text-white'>
                            {itemLabel}
                          </div>

                          {isActive ? (
                            <div className='pointer-events-none absolute left-1.5 top-1.5 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium uppercase text-white'>
                              {isLead
                                ? 'Lead'
                                : libraryTarget === 'primary'
                                  ? 'Selected'
                                  : 'Added'}
                            </div>
                          ) : null}

                          <div className='absolute right-1.5 top-1.5 z-20 flex gap-1.5'>
                            <button
                              type='button'
                              onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                setLeadFromLibrary(item.storageId)
                              }}
                              disabled={isLead}
                              className={cn(
                                'rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-white transition-colors',
                                isLead
                                  ? 'cursor-default bg-blue-600'
                                  : 'bg-black/60 hover:bg-blue-600',
                              )}
                              aria-label={
                                isLead
                                  ? `${itemLabel} is already the lead image`
                                  : `Set ${itemLabel} as the lead image`
                              }>
                              Lead
                            </button>

                            {isSelected && !isLead ? (
                              <button
                                type='button'
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  removeGalleryItem(item.storageId)
                                }}
                                className='flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-500'
                                aria-label={`Remove ${itemLabel} from gallery`}>
                                <Icon name='x' size={12} />
                              </button>
                            ) : null}
                          </div>
                        </div>
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
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </>
  )
}
