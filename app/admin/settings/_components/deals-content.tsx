'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {SectionHeader} from '@/components/ui/section-header'
import {api} from '@/convex/_generated/api'
import type {AttributeEntry} from '@/convex/categories/d'
import type {Deal} from '@/convex/deals/d'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {
  startTransition,
  useCallback,
  useMemo,
  useState,
  ViewTransition,
} from 'react'
import {LoadingHeader, PrimaryButton} from './components'

type VariationForm = {
  totalUnits: string
  denominationPerUnit: string
  denominationLabel: string
  unitLabel: string
}

type DealFormState = {
  id: string
  title: string
  description: string
  categorySlugs: string[]
  excludedTiers: string[]
  excludedSubcategories: string[]
  excludedProductTypes: string[]
  excludedBases: string[]
  excludedBrands: string[]
  variations: VariationForm[]
  defaultVariationIndex: string
  maxPerStrain: string
  lowStockThreshold: string
  enabled: boolean
}

type DealExclusionField =
  | 'excludedTiers'
  | 'excludedSubcategories'
  | 'excludedProductTypes'
  | 'excludedBases'
  | 'excludedBrands'

type CategoryAttributeKey =
  | 'tiers'
  | 'subcategories'
  | 'productTypes'
  | 'bases'
  | 'brands'

const DEAL_EXCLUSION_CONFIG: Array<{
  field: DealExclusionField
  categoryKey: CategoryAttributeKey
  label: string
}> = [
  {
    field: 'excludedTiers',
    categoryKey: 'tiers',
    label: 'Tier',
  },
  {
    field: 'excludedSubcategories',
    categoryKey: 'subcategories',
    label: 'Subcategory',
  },
  {
    field: 'excludedProductTypes',
    categoryKey: 'productTypes',
    label: 'Product Type',
  },
  {
    field: 'excludedBases',
    categoryKey: 'bases',
    label: 'Base',
  },
  {
    field: 'excludedBrands',
    categoryKey: 'brands',
    label: 'Brands',
  },
]

function collectAttributeOptions(
  categories: Array<{
    slug?: string
    tiers?: AttributeEntry[]
    subcategories?: AttributeEntry[]
    productTypes?: AttributeEntry[]
    bases?: AttributeEntry[]
    brands?: AttributeEntry[]
  }>,
  key: CategoryAttributeKey,
): AttributeEntry[] {
  const map = new Map<string, AttributeEntry>()
  categories.forEach((category) => {
    ;(category[key] ?? []).forEach((entry) => {
      if (!map.has(entry.slug)) {
        map.set(entry.slug, entry)
      }
    })
  })
  return Array.from(map.values())
}

function pruneDealExclusions(
  form: DealFormState,
  categories: Array<{
    slug?: string
    tiers?: AttributeEntry[]
    subcategories?: AttributeEntry[]
    productTypes?: AttributeEntry[]
    bases?: AttributeEntry[]
    brands?: AttributeEntry[]
  }>,
): DealFormState {
  const selectedCategories = categories.filter((category) =>
    form.categorySlugs.includes(category.slug ?? ''),
  )

  const allowedByField = {
    excludedTiers: new Set(
      collectAttributeOptions(selectedCategories, 'tiers').map(
        (entry) => entry.slug,
      ),
    ),
    excludedSubcategories: new Set(
      collectAttributeOptions(selectedCategories, 'subcategories').map(
        (entry) => entry.slug,
      ),
    ),
    excludedProductTypes: new Set(
      collectAttributeOptions(selectedCategories, 'productTypes').map(
        (entry) => entry.slug,
      ),
    ),
    excludedBases: new Set(
      collectAttributeOptions(selectedCategories, 'bases').map(
        (entry) => entry.slug,
      ),
    ),
    excludedBrands: new Set(
      collectAttributeOptions(selectedCategories, 'brands').map(
        (entry) => entry.slug,
      ),
    ),
  } satisfies Record<DealExclusionField, Set<string>>

  return {
    ...form,
    excludedTiers: form.excludedTiers.filter((value) =>
      allowedByField.excludedTiers.has(value),
    ),
    excludedSubcategories: form.excludedSubcategories.filter((value) =>
      allowedByField.excludedSubcategories.has(value),
    ),
    excludedProductTypes: form.excludedProductTypes.filter((value) =>
      allowedByField.excludedProductTypes.has(value),
    ),
    excludedBases: form.excludedBases.filter((value) =>
      allowedByField.excludedBases.has(value),
    ),
    excludedBrands: form.excludedBrands.filter((value) =>
      allowedByField.excludedBrands.has(value),
    ),
  }
}

function emptyVariation(): VariationForm {
  return {
    totalUnits: '1',
    denominationPerUnit: '1',
    denominationLabel: '',
    unitLabel: 'unit',
  }
}

function variationFormToDoc(v: VariationForm): {
  totalUnits: number
  denominationPerUnit: number
  denominationLabel?: string
  unitLabel: string
} | null {
  const totalUnits = parseInt(v.totalUnits, 10)
  const denominationPerUnit = parseFloat(v.denominationPerUnit)
  if (
    Number.isNaN(totalUnits) ||
    totalUnits < 1 ||
    Number.isNaN(denominationPerUnit) ||
    denominationPerUnit <= 0
  )
    return null
  return {
    totalUnits,
    denominationPerUnit,
    denominationLabel: v.denominationLabel.trim() || undefined,
    unitLabel: v.unitLabel.trim() || 'unit',
  }
}

function dealToForm(deal: Deal): DealFormState {
  return {
    id: deal.id,
    title: deal.title,
    description: deal.description,
    categorySlugs: [...deal.categorySlugs],
    excludedTiers: [...(deal.excludedTiers ?? [])],
    excludedSubcategories: [...(deal.excludedSubcategories ?? [])],
    excludedProductTypes: [...(deal.excludedProductTypes ?? [])],
    excludedBases: [...(deal.excludedBases ?? [])],
    excludedBrands: [...(deal.excludedBrands ?? [])],
    variations: deal.variations.map((v) => ({
      totalUnits: String(v.totalUnits),
      denominationPerUnit: String(v.denominationPerUnit),
      denominationLabel: v.denominationLabel ?? '',
      unitLabel: v.unitLabel,
    })),
    defaultVariationIndex: String(deal.defaultVariationIndex ?? 0),
    maxPerStrain: String(deal.maxPerStrain),
    lowStockThreshold:
      deal.lowStockThreshold != null ? String(deal.lowStockThreshold) : '',
    enabled: deal.enabled,
  }
}

function emptyForm(editId?: string): DealFormState {
  return {
    id: editId ?? '',
    title: '',
    description: '',
    categorySlugs: [],
    excludedTiers: [],
    excludedSubcategories: [],
    excludedProductTypes: [],
    excludedBases: [],
    excludedBrands: [],
    variations: [emptyVariation()],
    defaultVariationIndex: '0',
    maxPerStrain: '1',
    lowStockThreshold: '',
    enabled: true,
  }
}

type DealInsert = {
  id: string
  title: string
  description: string
  categorySlugs: string[]
  excludedTiers: string[]
  excludedSubcategories: string[]
  excludedProductTypes: string[]
  excludedBases: string[]
  excludedBrands: string[]
  variations: Array<{
    totalUnits: number
    denominationPerUnit: number
    denominationLabel?: string
    unitLabel: string
  }>
  defaultVariationIndex?: number
  maxPerStrain: number
  lowStockThreshold?: number
  order: number
  enabled: boolean
}

function formToDealPatch(form: DealFormState): DealInsert | null {
  const variations = form.variations
    .map(variationFormToDoc)
    .filter((v): v is NonNullable<typeof v> => v != null)
  if (variations.length === 0) return null

  const defaultVariationIndex = parseInt(form.defaultVariationIndex, 10)
  if (
    Number.isNaN(defaultVariationIndex) ||
    defaultVariationIndex < 0 ||
    defaultVariationIndex >= variations.length
  )
    return null

  const maxPerStrain = parseInt(form.maxPerStrain, 10)
  if (Number.isNaN(maxPerStrain) || maxPerStrain < 1) return null

  const lowStockThreshold = form.lowStockThreshold.trim()
    ? parseInt(form.lowStockThreshold, 10)
    : undefined
  if (
    form.lowStockThreshold.trim() &&
    (Number.isNaN(lowStockThreshold!) || lowStockThreshold! < 0)
  )
    return null

  const id = form.id.trim().toLowerCase().replace(/\s+/g, '-')
  if (!id) return null

  return {
    id,
    title: form.title.trim(),
    description: form.description.trim(),
    categorySlugs: form.categorySlugs.filter(Boolean),
    excludedTiers: form.excludedTiers.filter(Boolean),
    excludedSubcategories: form.excludedSubcategories.filter(Boolean),
    excludedProductTypes: form.excludedProductTypes.filter(Boolean),
    excludedBases: form.excludedBases.filter(Boolean),
    excludedBrands: form.excludedBrands.filter(Boolean),
    variations,
    defaultVariationIndex,
    maxPerStrain,
    lowStockThreshold,
    order: 0,
    enabled: form.enabled,
  }
}

export const DealsContent = () => {
  const {user} = useAuthCtx()
  const deals = useQuery(api.deals.q.listForAdmin)
  const categories = useQuery(api.categories.q.listCategories)
  const createDeal = useMutation(api.deals.m.create)
  const updateDeal = useMutation(api.deals.m.update)
  const toggleDealEnabled = useMutation(
    api.deals.m.update,
  ).withOptimisticUpdate((localStore, {id, patch}) => {
    if (patch.enabled === undefined) return

    const adminDeals = localStore.getQuery(api.deals.q.listForAdmin, {})
    const targetDeal = adminDeals?.find((deal) => deal.id === id)

    if (adminDeals) {
      localStore.setQuery(
        api.deals.q.listForAdmin,
        {},
        adminDeals.map((deal) =>
          deal.id === id ? {...deal, enabled: patch.enabled!} : deal,
        ),
      )
    }

    const storeDeals = localStore.getQuery(api.deals.q.listForStore, {})
    if (!storeDeals) return

    if (!patch.enabled) {
      localStore.setQuery(
        api.deals.q.listForStore,
        {},
        storeDeals.filter((deal) => deal.id !== id),
      )
      return
    }

    if (storeDeals.some((deal) => deal.id === id) || !targetDeal) return

    localStore.setQuery(
      api.deals.q.listForStore,
      {},
      [...storeDeals, {...targetDeal, enabled: true}].toSorted(
        (a, b) => a.order - b.order,
      ),
    )
  })
  const removeDeal = useMutation(api.deals.m.remove)
  const reorderDeals = useMutation(api.deals.m.reorder)
  const seedDefaults = useMutation(api.deals.m.seedDefaults)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DealFormState>(() => emptyForm())
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<null | 'saved' | 'error'>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

  const uid = user?.uid ?? 'admin'

  const openAdd = useCallback(() => {
    setEditingId(null)
    setForm(emptyForm())
    setModalOpen(true)
    setSaveMessage(null)
  }, [])

  const openEdit = useCallback((deal: Deal) => {
    setEditingId(deal.id)
    setForm(dealToForm(deal))
    setModalOpen(true)
    setSaveMessage(null)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingId(null)
    setSaveMessage(null)
  }, [])

  const handleSave = useCallback(() => {
    const patch = formToDealPatch(form)
    if (!patch) return

    setIsSaving(true)
    setSaveMessage(null)
    startTransition(() => {
      const run = async () => {
        try {
          if (editingId === null) {
            await createDeal({deal: patch, updatedBy: uid})
          } else {
            await updateDeal({
              id: editingId,
              patch: {
                title: patch.title,
                description: patch.description,
                categorySlugs: patch.categorySlugs,
                excludedTiers: patch.excludedTiers,
                excludedSubcategories: patch.excludedSubcategories,
                excludedProductTypes: patch.excludedProductTypes,
                excludedBases: patch.excludedBases,
                excludedBrands: patch.excludedBrands,
                variations: patch.variations,
                defaultVariationIndex: patch.defaultVariationIndex,
                maxPerStrain: patch.maxPerStrain,
                lowStockThreshold: patch.lowStockThreshold,
                enabled: patch.enabled,
              },
              updatedBy: uid,
            })
          }
          setIsSaving(false)
          setSaveMessage('saved')
          closeModal()
          setTimeout(() => setSaveMessage(null), 2000)
        } catch {
          setIsSaving(false)
          setSaveMessage('error')
        }
      }
      run()
    })
  }, [form, editingId, createDeal, updateDeal, uid, closeModal])

  const handleToggleEnabled = useCallback(
    (deal: Deal) => (enabled: boolean) => {
      startTransition(() => {
        toggleDealEnabled({
          id: deal.id,
          patch: {enabled},
          updatedBy: uid,
        }).catch(() => {})
      })
    },
    [toggleDealEnabled, uid],
  )

  const handleDelete = useCallback(() => {
    if (!deleteConfirmId) return
    setIsDeleting(true)
    startTransition(() => {
      removeDeal({id: deleteConfirmId})
        .then(() => setDeleteConfirmId(null))
        .finally(() => setIsDeleting(false))
    })
  }, [deleteConfirmId, removeDeal])

  const handleMove = useCallback(
    (index: number, direction: 1 | -1) => {
      if (!deals?.length) return
      const next = index + direction
      if (next < 0 || next >= deals.length) return
      const reordered = [...deals]
      const a = reordered[index]
      reordered[index] = reordered[next]
      reordered[next] = a
      reorderDeals({
        orderedIds: reordered.map((d) => d.id),
        updatedBy: uid,
      }).catch(() => {})
    },
    [deals, reorderDeals, uid],
  )

  const handleSeedDefaults = useCallback(() => {
    setIsSeeding(true)
    startTransition(() => {
      seedDefaults({updatedBy: uid}).finally(() => setIsSeeding(false))
    })
  }, [seedDefaults, uid])

  const toggleCategory = useCallback(
    (slug: string) => {
      setForm((current) => {
        const nextForm = {
          ...current,
          categorySlugs: current.categorySlugs.includes(slug)
            ? current.categorySlugs.filter((s) => s !== slug)
            : [...current.categorySlugs, slug],
        }
        return pruneDealExclusions(nextForm, categories ?? [])
      })
    },
    [categories],
  )

  const toggleExclusion = useCallback(
    (field: DealExclusionField, value: string) => {
      setForm((current) => ({
        ...current,
        [field]: current[field].includes(value)
          ? current[field].filter((item) => item !== value)
          : [...current[field], value],
      }))
    },
    [],
  )

  const selectedCategories = useMemo(
    () =>
      (categories ?? []).filter((category) =>
        form.categorySlugs.includes(category.slug ?? ''),
      ),
    [categories, form.categorySlugs],
  )

  const exclusionOptions = useMemo(
    () =>
      DEAL_EXCLUSION_CONFIG.map((config) => ({
        ...config,
        options: collectAttributeOptions(
          selectedCategories,
          config.categoryKey,
        ),
      })),
    [selectedCategories],
  )

  const isLoading = deals === undefined

  if (isLoading) {
    return <LoadingHeader title='Deals & Bundles' />
  }

  return (
    <div className='flex w-full flex-col space-y-2'>
      <div className='flex items-start w-full min-h-20'>
        <SectionHeader
          title='Deals & Bundles'
          description='Configure store deals and mix-and-match bundles. Only enabled deals appear on the Deals page.'>
          <div className='flex'>
            {deals.length === 0 && (
              <PrimaryButton
                onPress={handleSeedDefaults}
                icon={isSeeding ? 'spinners-ring' : 'arrow-up'}
                disabled={isSeeding}
                label='Seed Deals'
              />
            )}
            <PrimaryButton onPress={openAdd} icon='plus' label='Add Deal' />
          </div>
        </SectionHeader>
      </div>

      <section className='flex flex-col gap-4'>
        <div className='flex items-baseline justify-between'>
          <h3 className='text-sm font-polysans font-semibold uppercase tracking-widest px-2 text-terpenes'>
            Deals{' '}
            <span className='text-foreground font-okxs px-2'>
              {deals.length}
            </span>
          </h3>
          <span className='text-xs md:text-sm text-foreground/50'>
            Use <span className='text-foreground'>↑↓</span> to change order
          </span>
        </div>
        {deals.length === 0 ? (
          <div className='rounded-xl border border-dashed border-default-200 bg-default-50/50 dark:bg-default-100/5 py-12 text-center'>
            <p className='text-sm text-foreground/60'>
              No deals yet. Add one or seed default deals.
            </p>
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-1 lg:grid-cols-2'>
            {deals.map((deal, i) => (
              <Card
                key={deal.id}
                radius='none'
                shadow='none'
                className='border border-alum/30 rounded-xs overflow-hidden transition-colors hover:border-default-300/80'>
                <CardBody className='p-0'>
                  <div className='flex items-start justify-between gap-3 p-4 pb-3'>
                    <div className='flex min-w-0 flex-1 items-start gap-3'>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center space-x-2'>
                          <h4 className='font-semibold text-foreground truncate'>
                            {deal.title}
                          </h4>
                          <div className='flex items-center space-x-1 ml-3 mt-0.5 text-xs md:text-sm text-foreground/50 line-clamp-2'>
                            <Icon name='book-open' className='size-4.5' />
                            <span className='text-foreground/80'>
                              {deal.description}
                            </span>
                          </div>
                        </div>
                        <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                          <div className='flex items-center space-x-1'>
                            <span className='font-ios text-xs uppercase opacity-40'>
                              ID:
                            </span>
                            <span className='rounded py-1 font-mono text-[10px] text-terpenes'>
                              {deal.id}
                            </span>
                          </div>
                          <span className='ml-3 text-[10px] text-foreground/60 tracking-wide'>
                            max {deal.maxPerStrain} per strain
                          </span>
                        </div>
                      </div>
                      <Switch
                        size='sm'
                        classNames={{
                          wrapper: [
                            'mt-0.5',
                            deal.enabled ? 'bg-terpenes!' : '',
                          ],
                        }}
                        isSelected={deal.enabled}
                        onValueChange={handleToggleEnabled(deal)}
                        aria-label={`${deal.enabled ? 'Disable' : 'Enable'} ${deal.title}`}
                      />
                    </div>
                  </div>
                  <div className='flex items-center justify-between border-t border-default-200/60 bg-alum/15'>
                    <div className='flex items-center space-x-3 px-4'>
                      {deal.categorySlugs.map((s) => (
                        <span
                          key={s}
                          className='rounded-lg bg-terpenes/5 border border-foreground/25 px-2 py-0.5 text-[10px] text-foreground/60'>
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className='flex items-center justify-end gap-1 px-4 py-2 font-okxs '>
                      <Button
                        size='sm'
                        isIconOnly
                        radius='none'
                        variant='light'
                        aria-label='Move up'
                        isDisabled={i === 0}
                        onPress={() => handleMove(i, -1)}
                        className='min-w-8 rounded-sm'>
                        <Icon name='arrow-up' className='size-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='light'
                        radius='none'
                        isIconOnly
                        aria-label='Move down'
                        isDisabled={i === deals.length - 1}
                        onPress={() => handleMove(i, 1)}
                        className='min-w-8 rounded-sm'>
                        <Icon name='arrow-down' className='size-4' />
                      </Button>
                      <div className='mx-3 w-px my-2 self-stretch bg-default-200' />
                      <Button
                        size='sm'
                        radius='none'
                        variant='flat'
                        className='rounded-sm dark:bg-white/10 hover:bg-dark-table dark:hover:bg-white active:bg-dark-table dark:active:bg-white dark:active:text-dark-table hover:opacity-100! hover:text-white dark:hover:text-dark-table'
                        onPress={() => openEdit(deal)}>
                        Edit
                      </Button>
                      <Button
                        size='sm'
                        radius='none'
                        variant='light'
                        className='rounded-sm text-red-400 dark:text-red-300 hover:bg-red-600/10! dark:hover:bg-red-500/10'
                        onPress={() => setDeleteConfirmId(deal.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Add/Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        size='2xl'
        scrollBehavior='inside'
        classNames={{
          base: 'rounded-2xl',
          header: 'border-b border-default-200 pb-4',
          body: 'py-6',
          footer: 'border-t border-default-200 pt-4',
        }}>
        <ModalContent>
          <ModalHeader className='flex flex-col gap-1'>
            <span className='text-xs font-semibold uppercase tracking-widest text-foreground/50'>
              {editingId ? 'Edit deal' : 'New deal'}
            </span>
            <h2 className='text-xl font-semibold text-foreground'>
              {editingId ? form.title || form.id : 'Deal details'}
            </h2>
          </ModalHeader>
          <ModalBody className='flex flex-col gap-8'>
            {/* Identity */}
            <div className='grid gap-4 sm:grid-cols-2'>
              <Input
                label='Deal ID (slug)'
                placeholder='e.g. build-your-own-oz'
                value={form.id}
                onValueChange={(v) => setForm((f) => ({...f, id: v}))}
                classNames={commonInputClassNames}
                isRequired
                isReadOnly={editingId != null}
                description={
                  editingId
                    ? 'Cannot be changed when editing.'
                    : 'Lowercase, hyphens. Used in cart and URLs.'
                }
              />
              <Input
                label='Title'
                placeholder='e.g. Build Your Own Oz'
                value={form.title}
                onValueChange={(v) => setForm((f) => ({...f, title: v}))}
                classNames={commonInputClassNames}
                isRequired
              />
            </div>
            <Input
              label='Description'
              placeholder='Short description shown on the store Deals page'
              value={form.description}
              onValueChange={(v) => setForm((f) => ({...f, description: v}))}
              classNames={commonInputClassNames}
            />

            {/* Categories */}
            <div className='space-y-5'>
              <div>
                <p className='text-base font-medium text-foreground'>
                  Product Categories
                </p>
                <p className='text-xs text-foreground/55'>
                  Which category slugs this deal applies to.
                </p>
              </div>
              <div className='flex flex-wrap gap-5'>
                {(categories ?? []).map((c) => (
                  <Checkbox
                    key={c._id}
                    color='default'
                    classNames={{
                      label: 'text-sm py-0 pe-3 font-medium capitalize',
                      base:
                        form.categorySlugs.includes(c.slug ?? '') &&
                        'bg-terpenes rounded-full',
                      wrapper:
                        form.categorySlugs.includes(c.slug ?? '') &&
                        'bg-terpenes! rounded-full',
                    }}
                    isSelected={form.categorySlugs.includes(c.slug ?? '')}
                    onValueChange={() => toggleCategory(c.slug ?? '')}>
                    {c.slug ?? c.name}
                  </Checkbox>
                ))}
                {(!categories || categories.length === 0) && (
                  <span className='text-xs text-foreground/55'>
                    No categories yet. Add them in Inventory first.
                  </span>
                )}
              </div>
            </div>

            {/* Exclusions */}
            <div className='space-y-3 p-4 dark:bg-dark-table/40'>
              <div>
                <p className='text-base font-medium text-foreground'>
                  Exclusions
                </p>
                <p className='text-xs text-foreground/55'>
                  Exclude specific tiers, subcategories, product types, bases,
                  or brands from this deal.
                </p>
              </div>
              <div className='space-y-6'>
                {exclusionOptions.map(({field, label, options}) => (
                  <div key={field} className='space-y-2'>
                    <p className='text-xs font-bold uppercase tracking-wide text-foreground/60'>
                      {label}
                    </p>
                    {options.length > 0 ? (
                      <div className={cn('flex flex-wrap gap-5')}>
                        {options.map((option) => (
                          <Checkbox
                            key={`${field}-${option.slug}`}
                            color='default'
                            classNames={{
                              label: 'text-sm py-0 pe-3 font-medium',
                              base:
                                form[field].includes(option.slug) &&
                                'bg-terpenes rounded-full',
                              wrapper:
                                form[field].includes(option.slug) &&
                                'bg-terpenes! rounded-full',
                            }}
                            isSelected={form[field].includes(option.slug)}
                            onValueChange={() =>
                              toggleExclusion(field, option.slug)
                            }>
                            {option.name}
                          </Checkbox>
                        ))}
                      </div>
                    ) : (
                      <span className='text-xs text-foreground/55'>
                        Select categories with configured {label.toLowerCase()}.
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Variations */}
            <div className='space-y-5'>
              <div>
                <p className='text-base font-medium text-foreground'>
                  Variations
                </p>
                <p className='text-xs text-foreground/55'>
                  Each row is one option (e.g. 8×⅛ oz or 4×¼ oz). At least one
                  required.
                </p>
              </div>
              <div className='space-y-5'>
                {form.variations.map((v, idx) => (
                  <div
                    key={idx}
                    className='relative rounded-lg border border-default-200/80 bg-default-50/30 dark:bg-default-100/5 p-4'>
                    <div className='grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4'>
                      <Input
                        label='Total units'
                        type='number'
                        min={1}
                        value={v.totalUnits}
                        onValueChange={(val) =>
                          setForm((f) => {
                            const vars = [...f.variations]
                            vars[idx] = {...vars[idx], totalUnits: val}
                            return {...f, variations: vars}
                          })
                        }
                        classNames={commonInputClassNames}
                      />
                      <Input
                        label='Size per unit'
                        type='number'
                        min={0.001}
                        step={0.125}
                        value={v.denominationPerUnit}
                        onValueChange={(val) =>
                          setForm((f) => {
                            const vars = [...f.variations]
                            vars[idx] = {...vars[idx], denominationPerUnit: val}
                            return {...f, variations: vars}
                          })
                        }
                        classNames={commonInputClassNames}
                      />
                      <Input
                        label='Label'
                        placeholder='⅛'
                        value={v.denominationLabel}
                        onValueChange={(val) =>
                          setForm((f) => {
                            const vars = [...f.variations]
                            vars[idx] = {...vars[idx], denominationLabel: val}
                            return {...f, variations: vars}
                          })
                        }
                        classNames={commonInputClassNames}
                      />
                      <Input
                        label='Unit'
                        placeholder='oz'
                        value={v.unitLabel}
                        onValueChange={(val) =>
                          setForm((f) => {
                            const vars = [...f.variations]
                            vars[idx] = {...vars[idx], unitLabel: val}
                            return {...f, variations: vars}
                          })
                        }
                        classNames={commonInputClassNames}
                      />
                    </div>
                    <Button
                      size='sm'
                      color='default'
                      variant='flat'
                      isIconOnly
                      className='absolute -top-4 -right-2 hover:text-danger'
                      isDisabled={form.variations.length <= 1}
                      onPress={() =>
                        setForm((f) => ({
                          ...f,
                          variations: f.variations.filter((_, i) => i !== idx),
                        }))
                      }>
                      <Icon name='x' />
                    </Button>
                  </div>
                ))}
                <Button
                  size='sm'
                  variant='bordered'
                  onPress={() =>
                    setForm((f) => ({
                      ...f,
                      variations: [...f.variations, emptyVariation()],
                    }))
                  }>
                  Add variation
                </Button>
              </div>
            </div>

            {/* Rules */}
            <div className='space-y-3'>
              <p className='text-base font-medium text-foreground'>Rules</p>
              <div className='grid gap-4 sm:grid-cols-3'>
                <Input
                  label='Default variation'
                  type='number'
                  min={0}
                  value={form.defaultVariationIndex}
                  onValueChange={(v) =>
                    setForm((f) => ({...f, defaultVariationIndex: v}))
                  }
                  classNames={commonInputClassNames}
                  description='Index (0 = first)'
                />
                <Input
                  label='Max per strain'
                  type='number'
                  min={1}
                  value={form.maxPerStrain}
                  onValueChange={(v) =>
                    setForm((f) => ({...f, maxPerStrain: v}))
                  }
                  classNames={commonInputClassNames}
                  description='Same product per bundle'
                />
                <Input
                  label='Low stock limit'
                  type='number'
                  min={0}
                  placeholder='Optional'
                  value={form.lowStockThreshold}
                  onValueChange={(v) =>
                    setForm((f) => ({...f, lowStockThreshold: v}))
                  }
                  classNames={commonInputClassNames}
                  description='When stock ≤ this, 1 per strain'
                />
              </div>
            </div>

            {editingId != null && (
              <div className='rounded-lg border border-default-200/80 bg-default-50/30 dark:bg-default-100/5 p-3'>
                <Checkbox
                  classNames={{label: 'text-sm'}}
                  isSelected={form.enabled}
                  onValueChange={(v) => setForm((f) => ({...f, enabled: v}))}>
                  Visible on store Deals page
                </Checkbox>
              </div>
            )}

            <ViewTransition>
              {saveMessage === 'error' && (
                <p className='text-sm text-destructive'>
                  Save failed. Try again.
                </p>
              )}
            </ViewTransition>
          </ModalBody>
          <ModalFooter className='gap-2'>
            <Button variant='flat' onPress={closeModal}>
              Cancel
            </Button>
            <Button
              color='primary'
              onPress={handleSave}
              isLoading={isSaving}
              isDisabled={!formToDealPatch(form)}
              className='bg-dark-table dark:bg-white dark:text-dark-table'>
              {editingId ? 'Save changes' : 'Add deal'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={deleteConfirmId != null}
        onClose={() => setDeleteConfirmId(null)}
        size='sm'>
        <ModalContent>
          <ModalHeader className='font-okxs font-semibold'>
            Delete deal
          </ModalHeader>
          <ModalBody>
            <p className='text-sm text-foreground/80'>
              Remove this deal? It will disappear from the store. Existing cart
              bundles may still reference it until cleared.
            </p>
          </ModalBody>
          <ModalFooter className='gap-2'>
            <Button variant='flat' onPress={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              color='danger'
              onPress={handleDelete}
              isLoading={isDeleting}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
