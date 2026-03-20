'use client'

import {ImageModal} from '@/app/account/chat/_components/message-list-image-modal'
import {withViewTransitionAndTransition} from '@/app/account/chat/_components/message-list-utils'
import {CompactInfo} from '@/components/ui/info'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {onError, onSuccess} from '@/ctx/toast'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Button,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'

type GalleryItem = {
  recordId: string
  storageId: string
  caption: string | null
  uploadedAt: number
  url: string | null
  tags: string[]
}

type TagGalleryGroup = {
  tag: string
  total: number
  items: GalleryItem[]
}

const REQUIRED_TAG = 'gallery:optimized'

const normalizeTag = (value: string) => value.trim().toLowerCase()

const titleCaseTag = (value: string) =>
  value
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')

const summarizeStorageId = (value: string) =>
  value.length <= 18 ? value : `${value.slice(0, 8)}...${value.slice(-6)}`

const uploadedAtFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const formatUploadedAt = (value: number | null | undefined) => {
  if (!value) {
    return 'Unknown'
  }

  return uploadedAtFormatter.format(value)
}

export const ProductGalleryManager = () => {
  const [tagSearch, setTagSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [selectedStorageId, setSelectedStorageId] = useState<string | null>(
    null,
  )
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingStorageId, setDeletingStorageId] = useState<string | null>(
    null,
  )

  const [imageModal, setImageModal] = useState<{
    url: string
    fileName: string
  } | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const deleteManagedImage = useMutation(api.files.upload.deleteManagedImage)
  const galleryResponse = useQuery(api.files.upload.listImageGalleriesByTag, {
    requiredTag: REQUIRED_TAG,
    maxTags: 60,
    limitPerTag: 60,
  })

  const deferredTagSearch = useDeferredValue(tagSearch)

  const allTaggedGroups = useMemo(
    () => (galleryResponse?.tags ?? []) as TagGalleryGroup[],
    [galleryResponse],
  )

  const filteredTagGroups = useMemo(() => {
    const normalizedSearch = normalizeTag(deferredTagSearch)
    if (!normalizedSearch) {
      return allTaggedGroups
    }

    return allTaggedGroups.filter((group) =>
      normalizeTag(group.tag).includes(normalizedSearch),
    )
  }, [allTaggedGroups, deferredTagSearch])

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

  useEffect(() => {
    if (!activeGroup) {
      if (selectedStorageId !== null) {
        setSelectedStorageId(null)
      }
      return
    }

    const hasSelectedItem = activeGroup.items.some(
      (item) => item.storageId === selectedStorageId,
    )

    if (!hasSelectedItem) {
      setSelectedStorageId(activeGroup.items[0]?.storageId ?? null)
    }
  }, [activeGroup, selectedStorageId])

  const selectedItem = useMemo(() => {
    if (!activeGroup) {
      return null
    }

    return (
      activeGroup.items.find((item) => item.storageId === selectedStorageId) ??
      activeGroup.items[0] ??
      null
    )
  }, [activeGroup, selectedStorageId])

  const handleDeleteSelectedImage = async () => {
    if (!selectedItem) {
      return
    }

    const item = selectedItem
    setDeletingStorageId(item.storageId)

    try {
      const result = await deleteManagedImage({
        storageId: item.storageId as Id<'_storage'>,
      })

      const removedReferenceCount =
        result.removedFromPrimaryCount +
        result.removedFromGalleryCount +
        result.removedFromCategoryHeroCount

      const detachedTargets = [
        result.affectedProducts > 0
          ? `${result.affectedProducts} product${result.affectedProducts === 1 ? '' : 's'}`
          : null,
        result.removedFromCategoryHeroCount > 0
          ? `${result.removedFromCategoryHeroCount} categor${result.removedFromCategoryHeroCount === 1 ? 'y' : 'ies'}`
          : null,
      ].filter((value): value is string => value !== null)

      const referenceSummary =
        removedReferenceCount > 0
          ? ` Removed ${removedReferenceCount} reference${removedReferenceCount === 1 ? '' : 's'} from ${detachedTargets.join(' and ')}.`
          : ''

      onSuccess(
        `Deleted ${item.caption?.trim() || summarizeStorageId(item.storageId)}.${referenceSummary}`,
      )
      setIsDeleteModalOpen(false)
    } catch (error) {
      onError(
        error instanceof Error ? error.message : 'Failed to delete image.',
      )
    } finally {
      setDeletingStorageId(null)
    }
  }

  const info = useMemo(
    () => [
      {key: 'File Record', value: selectedItem?.recordId},
      {key: 'Storage ID', value: selectedItem?.storageId},
      {key: 'Image Res', value: getResolutions(selectedItem?.tags)},
      {key: 'Uploaded', value: selectedItem?.uploadedAt},
    ],
    [selectedItem],
  )

  const openImageModal = useCallback(() => {
    // if (!attachment.url) return
    // const url = attachment.url
    withViewTransitionAndTransition(() => {
      setImageModal({
        url: selectedItem?.url ?? '',
        fileName: selectedItem?.caption ?? 'image filename',
      })
    })
  }, [selectedItem])

  const closeImageModal = useCallback(() => {
    withViewTransitionAndTransition(() => {
      setImageModal(null)
    })
  }, [])

  useEffect(() => {
    if (!imageModal) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeImageModal()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [imageModal, closeImageModal])

  return (
    <>
      <div className='flex min-h-0 flex-1 flex-col gap-2'>
        {imageModal && (
          <ImageModal
            url={imageModal.url}
            fileName={imageModal.fileName}
            isDownloading={isDownloading}
            setIsDownloading={setIsDownloading}
            onClose={closeImageModal}
          />
        )}

        <div className='grid min-h-0 flex-1 gap-2 xl:grid-cols-[240px_minmax(0,1fr)_340px]'>
          <aside className='min-h-0 rounded-2xl border border-foreground/10 bg-background/80 p-4 backdrop-blur-sm'>
            <div className='space-y-2'>
              <input
                value={tagSearch}
                onChange={(event) => setTagSearch(event.target.value)}
                placeholder='Search tags'
                className='w-full rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-blue-500'
              />
            </div>

            <div className='mt-4 flex max-h-[48vh] flex-col gap-1 overflow-y-auto pr-1 xl:max-h-full xl:min-h-0'>
              {filteredTagGroups.map((group) => {
                const isActive = activeGroup?.tag === group.tag

                return (
                  <button
                    key={group.tag}
                    type='button'
                    onClick={() => setActiveTag(group.tag)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                      isActive
                        ? 'bg-blue-500/10 text-blue-500'
                        : 'text-foreground/75 hover:bg-foreground/5',
                    )}>
                    <span className='truncate'>{titleCaseTag(group.tag)}</span>
                    <span className='rounded-full bg-foreground/10 px-2 py-0.5 text-[11px]'>
                      {group.total}
                    </span>
                  </button>
                )
              })}

              {galleryResponse === undefined ? (
                <div className='rounded-xl border border-dashed border-foreground/15 px-3 py-6 text-sm text-foreground/55'>
                  Loading gallery index...
                </div>
              ) : null}

              {galleryResponse !== undefined &&
              filteredTagGroups.length === 0 ? (
                <div className='rounded-xl border border-dashed border-foreground/15 px-3 py-6 text-sm text-foreground/55'>
                  No matching tags found.
                </div>
              ) : null}
            </div>
          </aside>

          <section className='flex min-h-0 flex-col rounded-2xl border border-foreground/10 bg-background/80 p-4 backdrop-blur-sm'>
            {activeGroup ? (
              <>
                <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <h3 className='text-base font-semibold text-foreground'>
                      {titleCaseTag(activeGroup.tag)}
                    </h3>
                  </div>

                  <p className='text-sm text-foreground/60'>
                    {activeGroup.total} optimized image
                    {activeGroup.total === 1 ? '' : 's'} in this tag group
                  </p>
                </div>

                <div className='grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5'>
                  {activeGroup.items.map((item) => {
                    const isSelected =
                      item.storageId === selectedItem?.storageId
                    const displayTitle =
                      item.caption?.trim() || summarizeStorageId(item.storageId)

                    return (
                      <button
                        key={item.storageId}
                        type='button'
                        onClick={() => setSelectedStorageId(item.storageId)}
                        className={cn(
                          'group relative overflow-hidden rounded-md border bg-background text-left transition-all aspect-square',
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/35'
                            : 'border-foreground/15 hover:border-foreground/35',
                        )}>
                        {item.url ? (
                          <Image
                            src={item.url}
                            alt={displayTitle}
                            radius='none'
                            className='aspect-square w-full object-cover'
                          />
                        ) : (
                          <div className='flex aspect-square w-full items-center justify-center bg-foreground/5 text-foreground/40'>
                            <Icon name='image-open-light' className='size-6' />
                          </div>
                        )}

                        <div className='absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/45 to-transparent px-3 pt-10 pb-3 text-white'>
                          <div className='truncate text-xs font-medium'>
                            {displayTitle}
                          </div>
                          <div className='mt-1 text-[11px] text-white/75'>
                            {formatUploadedAt(item.uploadedAt)}
                          </div>
                        </div>

                        {isSelected ? (
                          <div className='absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white'>
                            Selected
                          </div>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className='flex min-h-88 flex-1 items-center justify-center rounded-2xl border border-dashed border-foreground/15 px-6 text-center text-sm text-foreground/55'>
                <Icon name='spinners-ring' className='h-8 w-8' />
              </div>
            )}
          </section>

          <section className='flex min-h-0 flex-col rounded-2xl border border-foreground/10 bg-background/80 p-4 backdrop-blur-sm'>
            {selectedItem ? (
              <div className='flex min-h-0 flex-1 flex-col gap-4'>
                <div className='overflow-hidden rounded-lg border border-foreground/10 bg-foreground/5'>
                  {selectedItem.url ? (
                    <Image
                      src={selectedItem.url}
                      alt={
                        selectedItem.caption?.trim() ||
                        summarizeStorageId(selectedItem.storageId)
                      }
                      radius='none'
                      className='aspect-square w-full object-cover'
                    />
                  ) : (
                    <div className='flex aspect-square w-full items-center justify-center text-foreground/40'>
                      <Icon name='image-open-light' className='size-8' />
                    </div>
                  )}
                </div>

                <div className='min-h-0 space-y-4 overflow-y-auto pr-1'>
                  <div className='space-y-1'>
                    <p className='text-xs font-semibold uppercase tracking-[0.16em] text-blue-500'>
                      Asset Details
                    </p>
                    <h3 className='text-base font-normal text-foreground'>
                      {selectedItem.caption?.trim() ||
                        summarizeStorageId(selectedItem.storageId)}
                    </h3>
                  </div>

                  <CompactInfo data={info} />

                  <div className='rounded-2xl border border-amber-500/20 bg-amber-500/8 py-3 text-sm text-foreground/70 text-center text-balance'>
                    Deleting this image removes it from any product lead image,
                    product gallery slot, and category hero image that still
                    references this storage ID.
                  </div>
                </div>

                <div className='grid gap-2 sm:grid-cols-2'>
                  {selectedItem.url ? (
                    <button
                      key={selectedItem.url}
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        openImageModal()
                      }}
                      className={cn(
                        'relative overflow-hidden rounded-lg border border-border/40 transition-colors',
                        'bg-background hover:bg-background/60',
                      )}>
                      {selectedItem.url ? (
                        <span>Open Image</span>
                      ) : (
                        <div className='flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28'>
                          <Icon
                            name='spinner-dots'
                            className='size-5 text-muted-foreground'
                          />
                        </div>
                      )}
                    </button>
                  ) : (
                    <div className='inline-flex h-10 items-center justify-center rounded-xl border border-dashed border-foreground/15 px-4 text-sm text-foreground/45'>
                      Preview unavailable
                    </div>
                  )}

                  <Button
                    color='danger'
                    className='h-10 rounded-xl'
                    onPress={() => setIsDeleteModalOpen(true)}
                    isDisabled={deletingStorageId !== null}>
                    Delete image
                  </Button>
                </div>
              </div>
            ) : (
              <div className='flex min-h-88 flex-1 items-center justify-center rounded-2xl border border-dashed border-foreground/15 px-6 text-center text-sm text-foreground/55'>
                Select an image to inspect its details.
              </div>
            )}
          </section>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        placement='center'
        backdrop='blur'>
        <ModalContent>
          <ModalHeader>Delete Gallery Image</ModalHeader>
          <ModalBody>
            <p className='text-sm text-foreground/70'>
              Delete{' '}
              <span className='font-medium text-foreground'>
                {selectedItem?.caption?.trim() ||
                  (selectedItem
                    ? summarizeStorageId(selectedItem.storageId)
                    : 'this image')}
              </span>
              ? This also removes its product and category media references.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant='light'
              onPress={() => setIsDeleteModalOpen(false)}
              isDisabled={deletingStorageId !== null}>
              Cancel
            </Button>
            <Button
              color='danger'
              isLoading={deletingStorageId === selectedItem?.storageId}
              onPress={() => void handleDeleteSelectedImage()}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

const getResolutions = (tags: string[] | undefined) => {
  const size = tags?.find((tag) => tag.startsWith('size:'))?.split(':')[1]
  return size ? `${size}x${size} px` : null
}
