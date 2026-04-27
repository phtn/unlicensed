'use client'

import {ImageModal} from '@/app/account/chat/_components/message-list-image-modal'
import {withViewTransitionAndTransition} from '@/app/account/chat/_components/message-list-utils'
import {CompactInfo} from '@/components/ui/info'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {onError, onSuccess} from '@/ctx/toast'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {LegacyImage as Image} from '@/components/ui/legacy-image'
import {
  extractImageDetails,
  normalizeTag,
  summarizeStorageId,
  titleCaseTag,
} from '../helpers'

const ModalContent = Modal.Container

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

        <div className='grid min-h-0 flex-1 xl:grid-cols-[200px_minmax(0,1fr)_340px]'>
          <aside className='min-h-0 md:max-h-[82vh] bg-slate-200 dark:bg-dark-table/50 rounded-s-xl border border-r-0 border-slate-400 dark:border-background/80 p-4 backdrop-blur-sm'>
            <div className='space-y-2'>
              <input
                value={tagSearch}
                onChange={(event) => setTagSearch(event.target.value)}
                placeholder='Search tags'
                className='w-full rounded-lg border border-slate-400 dark:border-background/60 bg-background dark:bg-background/50 px-3 py-1 text-sm outline-none transition-colors focus:border-blue-500'
              />
            </div>

            <div className='mt-4 flex max-h-[48vh] md:max-h-[75vh] flex-col gap-1 overflow-y-auto pr-1 xl:min-h-0'>
              {filteredTagGroups.map((group) => {
                const isActive = activeGroup?.tag === group.tag

                return (
                  <button
                    key={group.tag}
                    type='button'
                    onClick={() => setActiveTag(group.tag)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg pl-3 py-0.5 text-left text-sm transition-colors',
                      isActive
                        ? 'bg-mac-blue/10 dark:bg-background/40 text-mac-blue'
                        : 'text-foreground/75 hover:bg-foreground/5',
                    )}>
                    <span className='truncate'>{titleCaseTag(group.tag)}</span>
                    <span className='rounded-full px-2 py-0.5 text-[11px]'>
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
                <div className='rounded-xl border border-dashed border-foreground/15 px-3 py-1 text-sm text-foreground/55'>
                  No matching tags found.
                </div>
              ) : null}
            </div>
          </aside>

          <section className='flex min-h-0 md:max-h-[82vh] flex-col rounded-none border border-slate-400 dark:border-dark-table bg-background/80 p-2 backdrop-blur-sm'>
            {activeGroup ? (
              <>
                <div className='mb-1 -mt-0.5 h-5 flex gap-2 px-1 flex-row items-start justify-between'>
                  <div>
                    <h3 className='font-normal text-foreground text-sm tracking-wide'>
                      {titleCaseTag(activeGroup.tag)}
                    </h3>
                  </div>

                  <p className='font-clash text-mac-blue text-xs tracking-wide'>
                    {activeGroup.total} image
                    {activeGroup.total === 1 ? '' : 's'}
                  </p>
                </div>

                <div className='flex-1 min-h-0 overflow-y-scroll'>
                  <div className='grid content-start grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 p-1 gap-1'>
                    {activeGroup.items.map((item) => {
                      const isSelected =
                        item.storageId === selectedItem?.storageId
                      const displayTitle =
                        item.caption?.trim() ||
                        summarizeStorageId(item.storageId)

                      return (
                        <button
                          key={item.storageId}
                          type='button'
                          onClick={() => setSelectedStorageId(item.storageId)}
                          className={cn(
                            'group relative overflow-hidden rounded-xs bg-background text-left transition-all aspect-square',
                            isSelected
                              ? 'ring-3 ring-mac-blue'
                              : 'hover:ring-light-brand',
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
                              <Icon
                                name='image-open-light'
                                className='size-6'
                              />
                            </div>
                          )}

                          <div className='absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/45 to-transparent px-1.5 pt-10 pb-1 text-white'>
                            <div className='font-semibold text-xs capitalize truncate'>
                              {extractImageDetails(
                                displayTitle,
                              ).name.replaceAll('_', ' ')}
                            </div>
                            <div className='flex items-end justify-between text-white/75'>
                              <span className='font-semibold text-[7px] leading-none'>
                                {extractImageDetails(displayTitle)
                                  .size.split('x')
                                  .shift()}
                                <span className='text-[8px]'>²</span>
                              </span>
                              <span className='font-semibold text-[7px] tracking-wide uppercase leading-none opacity-80'>
                                {extractImageDetails(displayTitle).type}
                              </span>
                            </div>
                          </div>

                          {isSelected ? (
                            <div className='absolute right-2 top-2 p-1 rounded-full bg-mac-blue text-white'>
                              <Icon name='checked' className='h-4 w-4' />
                            </div>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className='flex min-h-88 flex-1 items-center justify-center rounded-2xl border border-dashed border-foreground/15 px-6 text-center text-sm text-foreground/55'>
                <Icon name='spinners-ring' className='h-8 w-8' />
              </div>
            )}
          </section>

          <section className='flex min-h-0 flex-col rounded-e-xl border border-l-0 border-slate-400 dark:border-dark-table/50 bg-slate-100 dark:bg-dark-table/50 p-4 backdrop-blur-sm'>
            {selectedItem ? (
              <div className='flex min-h-0 flex-1 flex-col gap-4'>
                <div className='overflow-hidden rounded-xs bg-foreground/5'>
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
                    <h3 className='text-lg font-clash font-medium text-foreground capitalize'>
                      {(
                        selectedItem.caption?.trim() &&
                        extractImageDetails(selectedItem.caption?.trim()).name
                      )?.replaceAll('_', ' ') ||
                        summarizeStorageId(selectedItem.storageId)}
                    </h3>
                  </div>

                  <CompactInfo data={info} />

                  <div className='rounded-md border border-orange-400/20 bg-amber-500/8 py-3 text-sm text-foreground/70 text-center text-balance'>
                    Deleting this image removes it from any product lead image,
                    product gallery slot, and category hero image that still
                    references this storage ID.
                  </div>
                </div>

                <div className='grid gap-2 sm:grid-cols-2 h-full flex-1 place-items-end'>
                  {selectedItem.url ? (
                    <Button
                      size='sm'
                      fullWidth
                      variant='ghost'
                      key={selectedItem.url}
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        openImageModal()
                      }}
                      className={cn('relative overflow-hidden rounded-sm')}>
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
                    </Button>
                  ) : (
                    <div className='inline-flex h-10 items-center justify-center rounded-xl border border-dashed border-foreground/15 px-4 text-sm text-foreground/45'>
                      Preview unavailable
                    </div>
                  )}

                  <Button
                    size='sm'
                    fullWidth
                    variant='danger'
                    className='rounded-sm'
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

      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <ModalContent placement='center'>
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
              variant='tertiary'
              onPress={() => setIsDeleteModalOpen(false)}
              isDisabled={deletingStorageId !== null}>
              Cancel
            </Button>
            <Button
              variant='danger'
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
