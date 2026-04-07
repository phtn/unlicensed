'use client'

import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Card, Chip} from '@heroui/react'
import {useMutation} from 'convex/react'
import Link from 'next/link'
import {startTransition, useState} from 'react'

import {LegacyImage as Image} from '@/components/ui/legacy-image'

type CategoryListItem = Doc<'categories'> & {
  productCount: number
}

interface CurrentCategoriesProps {
  categories: CategoryListItem[] | undefined
}

type CategoryStat = {
  label: string
  value: number
}

type CategoryFilter = 'active' | 'inactive'
type CategoryId = CategoryListItem['_id']
type CategoryAttributeEntry = {name: string; slug: string}

const countItems = (items?: unknown[]) => items?.length ?? 0

const getCategoryStrainTypes = (
  category: CategoryListItem,
): CategoryAttributeEntry[] => {
  const legacyCategory = category as CategoryListItem & {
    productTypes?: CategoryAttributeEntry[]
  }

  return category.strainTypes ?? legacyCategory.productTypes ?? []
}

const isCategoryActive = (category: CategoryListItem) =>
  category.visible !== false

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const reordered = [...items]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)
  return reordered
}

function reorderFilteredCategories(
  categories: CategoryListItem[],
  visibleIds: Set<CategoryId>,
  draggedId: CategoryId,
  targetId: CategoryId,
): CategoryListItem[] {
  const filtered = categories.filter((category) => visibleIds.has(category._id))
  const draggedIndex = filtered.findIndex(
    (category) => category._id === draggedId,
  )
  const targetIndex = filtered.findIndex(
    (category) => category._id === targetId,
  )

  if (
    draggedIndex === -1 ||
    targetIndex === -1 ||
    draggedIndex === targetIndex
  ) {
    return categories
  }

  const reorderedFiltered = moveItem(filtered, draggedIndex, targetIndex)
  let filteredIndex = 0

  return categories.map((category) =>
    visibleIds.has(category._id)
      ? reorderedFiltered[filteredIndex++]
      : category,
  )
}

const buildStats = (category: CategoryListItem): CategoryStat[] => {
  // const merchandisingOptions =
  //   countItems(category.tiers) +
  //   countItems(category.bases) +
  //   countItems(category.brands) +
  //   countItems(category.units) +
  //   countItems(category.denominations)

  return [
    {label: 'Products', value: category.productCount},
    {label: 'Tiers', value: countItems(category.tiers)},
    {label: 'Types', value: countItems(getCategoryStrainTypes(category))},
    {label: 'Base', value: countItems(category.bases)},
    {label: 'Subcategory', value: countItems(category.subcategories)},
    {label: 'Brands', value: countItems(category.brands)},
  ]
}

const buildPreviewTags = (category: CategoryListItem) => {
  const labels = [
    ...getCategoryStrainTypes(category).map((item) => item.name),
    ...(category.subcategories ?? []).map((item) => item.name),
    ...(category.tiers ?? []).map((item) => item.name),
    ...(category.bases ?? []).map((item) => item.name),
    ...(category.brands ?? []).map((item) => item.name),
  ]

  return [
    ...new Set(labels.map((label) => label.trim()).filter(Boolean)),
  ].slice(0, 4)
}

const buildWarnings = (category: CategoryListItem) => {
  const warnings: string[] = []

  if (!category.heroImage) warnings.push('No hero image')
  if (!category.highlight && !category.description) warnings.push('No summary')
  if (category.productCount === 0) warnings.push('No products')

  return warnings.slice(0, 3)
}

const CategoryCard = ({
  category,
  heroImageUrl,
  isDragging = false,
  isDropTarget = false,
  onDragHandlePointerDown,
  dragHandleDisabled = false,
}: {
  category: CategoryListItem
  heroImageUrl: string | null
  isDragging?: boolean
  isDropTarget?: boolean
  onDragHandlePointerDown?: VoidFunction
  dragHandleDisabled?: boolean
}) => {
  const categoryHref = category.slug
    ? `/admin/inventory/category?slug=${category.slug}`
    : `/admin/inventory/category?tabId=edit&id=${category._id}`
  const previewTags = buildPreviewTags(category)
  const warnings = buildWarnings(category)
  const stats = buildStats(category)
  const summary =
    category.highlight?.trim() ||
    category.description?.trim() ||
    'Missing a short summary for this category.'

  return (
    <Card
      className={cn(
        'h-full border border-black/10 bg-white/80 hover:border-emerald-500/20 hover:bg-white dark:border-white/10 dark:bg-dark-table/45 dark:hover:border-emerald-400/30 dark:hover:bg-dark-table/60 transition-all duration-300 p-0 rounded-lg overflow-hidden shadow-none',
        {
          'scale-[0.985] opacity-60': isDragging,
          'border-emerald-500/60 ring-2 ring-emerald-500/30 dark:border-emerald-400/60 dark:ring-emerald-400/20':
            isDropTarget,
        },
      )}>
      <div className='relative h-36 overflow-hidden bg-linear-to-br from-emerald-500/15 via-sky-500/10 to-transparent'>
        {heroImageUrl ? (
          <Image
            removeWrapper
            loading='eager'
            alt={`${category.name} hero`}
            src={heroImageUrl}
            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_55%),linear-gradient(135deg,rgba(15,23,42,0.04),transparent)] dark:bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.2),transparent_55%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent)]'>
            <div className='flex size-14 items-center justify-center rounded-2xl border border-white/40 bg-white/70 text-2xl font-semibold uppercase text-emerald-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/20 dark:text-emerald-300'>
              {category.name.slice(0, 1)}
            </div>
          </div>
        )}
        <h4 className='absolute top-4 left-2 z-100 truncate text-3xl font-semibold tracking-tight text-white bg-linear-to-r from-transparent to-black/40 pl-2 pr-4 rounded-e-full'>
          {category.name}
        </h4>
        <div className='absolute inset-0 bg-linear-to-t from-white via-white/20 to-transparent dark:from-[#0a0c10] dark:via-[#0a0c10]/25' />
        <div className='absolute right-4 top-4 z-100 flex items-center gap-2'>
          <Button
            size='sm'
            isIconOnly
            variant='tertiary'
            aria-label={`Drag to reorder ${category.name}`}
            isDisabled={dragHandleDisabled}
            onPointerDown={() => onDragHandlePointerDown?.()}
            className='group/handle bg-black/20 h-6 rounded-sm flex items-center cursor-grab active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40 text-white'>
            <Icon name='dots-fill' className='size-5 m-auto -rotate-45' />
          </Button>
          {/*<div className='flex size-9 items-center justify-center rounded-full border border-black/10 bg-white/80 text-neutral-700 backdrop-blur dark:border-white/10 dark:bg-black/35 dark:text-white/85'>
            <Icon name='circle-in' className='size-4' />
          </div>*/}
        </div>
      </div>

      <div className='flex h-[calc(100%-9rem)] flex-col gap-1 p-4'>
        <div className=''>
          <div className='flex items-start justify-between gap-2'>
            <div className='min-w-0'>
              <p className='truncate text-xs text-neutral-500 font-ios tracking-wider'>
                /{category.slug ?? 'Missing slug'}
              </p>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='flex h-7 gap-2 items-center font-clash text-sm '>
                <Link
                  href={`/admin/inventory/category?id=${category._id}&tabId=edit`}
                  className='group flex items-center rounded-md bg-black text-white dark:bg-white dark:text-dark-table touch-pan-y h-6 px-4'>
                  Edit
                </Link>
              </div>
              <div className='flex h-7 gap-2 items-center font-clash text-sm text-emerald-950 dark:text-emerald-200'>
                <Link
                  href={categoryHref}
                  className='group flex items-center h-6 rounded-md bg-emerald-500/10 px-3 touch-pan-y'>
                  View List
                </Link>
              </div>
            </div>
          </div>

          <p className='line-clamp-2 min-h-8 text-sm leading-5 text-neutral-600 dark:text-neutral-300'>
            {summary}
          </p>
        </div>

        <dl className='grid grid-cols-3 gap-2'>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className='rounded-sm border border-black/5 bg-neutral-50/80 px-2 py-1 dark:border-white/10 dark:bg-white/5 space-y-1'>
              <dt className='text-xs font-ios uppercase tracking-wider text-neutral-500'>
                {stat.label}
              </dt>
              <dd className='text-lg font-medium tracking-tight text-foreground'>
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className='hidden space-y-2'>
          <div className='flex flex-wrap gap-2'>
            {previewTags.length > 0 ? (
              previewTags.map((tag) => (
                <Chip
                  key={tag}
                  size='sm'
                  variant='tertiary'
                  className='bg-sky-400/10 rounded-md! h-6 text-xs text-sky-700 dark:text-sky-300'>
                  {tag}
                </Chip>
              ))
            ) : (
              <p className='text-xs text-neutral-500'>
                No category options configured yet.
              </p>
            )}
          </div>

          {warnings.length > 0 ? (
            <div className='flex flex-wrap gap-2'>
              {warnings.map((warning) => (
                <Chip
                  key={warning}
                  size='sm'
                  variant='tertiary'
                  className='bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300'>
                  {warning}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

const CategorySkeleton = () => {
  return (
    <div className='overflow-hidden rounded-3xl border border-black/5 bg-white/60 dark:border-white/10 dark:bg-dark-table/40'>
      <div className='h-36 animate-pulse bg-neutral-200/80 dark:bg-white/8' />
      <div className='space-y-3 p-4'>
        <div className='space-y-2'>
          <div className='h-5 w-2/3 animate-pulse rounded-full bg-neutral-200 dark:bg-white/8' />
          <div className='h-3 w-1/3 animate-pulse rounded-full bg-neutral-100 dark:bg-white/5' />
        </div>
        <div className='h-10 animate-pulse rounded-2xl bg-neutral-100 dark:bg-white/5' />
        <div className='grid grid-cols-2 gap-2'>
          {Array.from({length: 4}).map((_, index) => (
            <div
              key={index}
              className='h-16 animate-pulse rounded-2xl bg-neutral-100 dark:bg-white/5'
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export const CategoryList = ({categories}: CurrentCategoriesProps) => {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('active')
  const [dragHandleId, setDragHandleId] = useState<CategoryId | null>(null)
  const [draggedId, setDraggedId] = useState<CategoryId | null>(null)
  const [dropTargetId, setDropTargetId] = useState<CategoryId | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  const reorderCategories = useMutation(api.categories.m.reorder)
  const heroImages = categories?.map((category) => category.heroImage) ?? []
  const resolveUrl = useStorageUrls(heroImages)

  if (categories === undefined) {
    return (
      <section className='space-y-4 px-2 pb-6'>
        <div className='space-y-1'>
          <h3 className='text-2xl font-semibold tracking-tight'>Categories</h3>
          <p className='text-sm text-neutral-500'>
            Loading category health, imagery, and product counts.
          </p>
        </div>
        <div className='h-[90lvh] overflow-auto grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {Array.from({length: 6}).map((_, index) => (
            <CategorySkeleton key={index} />
          ))}
        </div>
      </section>
    )
  }

  const totalCategories = categories.length
  const activeCategories = categories.filter(isCategoryActive)
  const inactiveCategories = categories.filter(
    (category) => !isCategoryActive(category),
  )
  const liveCategories = activeCategories.length
  const filteredCategories =
    activeFilter === 'active' ? activeCategories : inactiveCategories
  const filteredCategoryIds = new Set(
    filteredCategories.map((category) => category._id),
  )

  const filterOptions: Array<{
    id: CategoryFilter
    label: string
    count: number
  }> = [
    {id: 'active', label: 'Active', count: activeCategories.length},
    {id: 'inactive', label: 'Inactive', count: inactiveCategories.length},
  ]

  return (
    <section className='space-y-3 pt-2 px-2 pb-6'>
      <div className='flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between'>
        <SectionHeader
          title={
            <div className='flex items-center space-x-2'>
              <Icon
                name='circ'
                className={cn('size-3 text-red-700 dark:text-red-300', {
                  'text-emerald-700 dark:text-emerald-300':
                    activeFilter === 'active',
                })}
              />
              <span>
                {activeFilter === 'active' ? 'Active' : 'Inactive'} Categories
              </span>
            </div>
          }
          description={``}>
          <div className='flex gap-2 text-xs'>
            <Chip
              size='sm'
              variant='tertiary'
              className='bg-emerald-500/10 font-okxs text-emerald-700 dark:text-emerald-300 rounded-sm'>
              {liveCategories} Live
            </Chip>
            <Chip
              size='sm'
              variant='tertiary'
              className='bg-orange-500/10 text-orange-700 dark:text-orange-200 rounded-sm'>
              {totalCategories - liveCategories} Hidden
            </Chip>
          </div>
        </SectionHeader>
      </div>

      <div className='flex flex-wrap gap-2'>
        {filterOptions.map((filter) => (
          <Button
            key={filter.id}
            size='sm'
            variant={activeFilter === filter.id ? 'primary' : 'tertiary'}
            className={cn(
              'text-sm h-6! gap-1.5 rounded-md pe-1.5',
              activeFilter === filter.id
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                : 'bg-black/5 text-neutral-700 dark:bg-white/8 dark:text-neutral-200',
            )}
            onPress={() => {
              startTransition(() => {
                setActiveFilter(filter.id)
              })
            }}>
            {filter.label} <span className='font-ios opacity-50'>(</span>
            <span>{filter.count}</span>
            <span className='font-ios opacity-50'>)</span>
          </Button>
        ))}
      </div>

      <p className='text-xs text-neutral-500'>
        Drag the handle on a card to change category order.
      </p>

      {categories.length === 0 ? (
        <p className='mt-3 text-sm text-neutral-500'>
          No categories yet. Create one above to get started.
        </p>
      ) : filteredCategories.length === 0 ? (
        <p className='mt-3 text-sm text-neutral-500'>
          No {activeFilter} categories found.
        </p>
      ) : (
        <ul className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {filteredCategories.map((category) => (
            <li
              key={category._id}
              draggable={
                !isReordering &&
                (dragHandleId === category._id || draggedId === category._id)
              }
              onDragStart={(event) => {
                if (dragHandleId !== category._id) {
                  event.preventDefault()
                  return
                }

                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', String(category._id))
                setDraggedId(category._id)
                setDropTargetId(category._id)
              }}
              onDragOver={(event) => {
                if (!draggedId || draggedId === category._id) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setDropTargetId(category._id)
              }}
              onDrop={(event) => {
                event.preventDefault()
                if (!categories || !draggedId || draggedId === category._id) {
                  setDragHandleId(null)
                  setDraggedId(null)
                  setDropTargetId(null)
                  return
                }

                const reordered = reorderFilteredCategories(
                  categories,
                  filteredCategoryIds,
                  draggedId,
                  category._id,
                )

                setIsReordering(true)
                startTransition(() => {
                  reorderCategories({
                    orderedIds: reordered.map((item) => item._id),
                  })
                    .catch(() => {})
                    .finally(() => {
                      setIsReordering(false)
                      setDragHandleId(null)
                      setDraggedId(null)
                      setDropTargetId(null)
                    })
                })
              }}
              onDragEnd={() => {
                setDragHandleId(null)
                setDraggedId(null)
                setDropTargetId(null)
              }}
              className='[content-visibility:auto] [contain-intrinsic-size:28rem]'>
              <CategoryCard
                category={category}
                heroImageUrl={
                  category.heroImage ? resolveUrl(category.heroImage) : null
                }
                isDragging={draggedId === category._id}
                isDropTarget={
                  dropTargetId === category._id && draggedId !== category._id
                }
                dragHandleDisabled={isReordering}
                onDragHandlePointerDown={() => setDragHandleId(category._id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
