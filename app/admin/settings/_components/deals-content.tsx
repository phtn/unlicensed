'use client'

import {mapNumericFractions} from '@/app/admin/(routes)/inventory/product/product-schema'
import {Input} from '@/components/hero-v3/input'
import {Select} from '@/components/hero-v3/select'
import {api} from '@/convex/_generated/api'
import type {AttributeEntry} from '@/convex/categories/d'
import type {Deal} from '@/convex/deals/d'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Card, Checkbox, Modal} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {
  startTransition,
  useCallback,
  useMemo,
  useState,
  ViewTransition,
} from 'react'
import {Toggle} from '../../_components/ui/toggle'
import {ContentHeader, LoadingHeader, PrimaryButton} from './components'

type VariationForm = {
  categorySlug: string
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

type DealCategory = {
  _id?: string
  name?: string
  slug?: string
  tiers?: AttributeEntry[]
  subcategories?: AttributeEntry[]
  productTypes?: AttributeEntry[]
  bases?: AttributeEntry[]
  brands?: AttributeEntry[]
  denominations?: number[]
  units?: string[]
}

type VariationAttributeOption = {
  label: string
  value: string
}

type CategoryVariationAttributes = {
  denominations: VariationAttributeOption[]
  units: VariationAttributeOption[]
}

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
  categories: DealCategory[],
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

function getCategoryAttributes(
  categories: DealCategory[],
): CategoryVariationAttributes {
  const denominationsMap = new Map<string, VariationAttributeOption>()
  const unitsMap = new Map<string, VariationAttributeOption>()

  categories.forEach((category) => {
    if (category.denominations) {
      category.denominations.forEach((value) => {
        const normalizedValue = String(value)
        if (!denominationsMap.has(normalizedValue)) {
          denominationsMap.set(normalizedValue, {
            value: normalizedValue,
            label: normalizedValue,
          })
        }
      })
    }

    if (category.units) {
      category.units.forEach((value) => {
        const normalizedValue = value.trim()
        if (!normalizedValue || unitsMap.has(normalizedValue)) return

        unitsMap.set(normalizedValue, {
          value: normalizedValue,
          label: normalizedValue,
        })
      })
    }
  })

  return {
    denominations: Array.from(denominationsMap.values()).toSorted(
      (a, b) => Number(a.value) - Number(b.value),
    ),
    units: Array.from(unitsMap.values()),
  }
}

function getDenominationLabel(
  denominationValue: string,
  unitValue: string,
): string {
  const normalizedDenomination = denominationValue.trim()
  if (!normalizedDenomination) return ''

  if (unitValue.trim().toLowerCase() === 'oz') {
    return mapNumericFractions[normalizedDenomination] ?? normalizedDenomination
  }

  const parsed = Number(normalizedDenomination)
  if (Number.isNaN(parsed)) return normalizedDenomination

  return String(parsed)
}

function findMatchingDenomination(
  value: string,
  options: VariationAttributeOption[],
): VariationAttributeOption | null {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return null

  return options.find((option) => Number(option.value) === parsed) ?? null
}

function findMatchingUnit(
  value: string,
  options: VariationAttributeOption[],
): VariationAttributeOption | null {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null

  return (
    options.find(
      (option) => option.value.trim().toLowerCase() === normalized,
    ) ?? null
  )
}

function syncVariationsWithCategoryAttributes(
  variations: VariationForm[],
  selectedCategories: DealCategory[],
): VariationForm[] {
  return variations.map((variation) => {
    const nextCategorySlug =
      selectedCategories.find(
        (category) => category.slug === variation.categorySlug,
      )?.slug ??
      selectedCategories[0]?.slug ??
      ''
    const categoryAttributes = getCategoryAttributes(
      nextCategorySlug
        ? selectedCategories.filter(
            (category) => category.slug === nextCategorySlug,
          )
        : [],
    )
    const matchingDenomination = findMatchingDenomination(
      variation.denominationPerUnit,
      categoryAttributes.denominations,
    )
    const matchingUnit = findMatchingUnit(
      variation.unitLabel,
      categoryAttributes.units,
    )

    const denominationValue =
      matchingDenomination?.value ??
      categoryAttributes.denominations[0]?.value ??
      variation.denominationPerUnit

    const unitValue =
      matchingUnit?.value ??
      categoryAttributes.units[0]?.value ??
      variation.unitLabel

    return {
      ...variation,
      categorySlug: nextCategorySlug,
      denominationPerUnit: denominationValue,
      denominationLabel: getDenominationLabel(denominationValue, unitValue),
      unitLabel: unitValue,
    }
  })
}

function syncDealFormWithCategoryAttributes(
  form: DealFormState,
  categories: DealCategory[],
): DealFormState {
  const selectedCategories = categories.filter((category) =>
    form.categorySlugs.includes(category.slug ?? ''),
  )

  return {
    ...pruneDealExclusions(form, categories),
    variations: syncVariationsWithCategoryAttributes(
      form.variations,
      selectedCategories,
    ),
  }
}

function getDenominationOptions(
  attributes: CategoryVariationAttributes,
  unitValue: string,
): VariationAttributeOption[] {
  return attributes.denominations.map((option) => ({
    value: option.value,
    label: getDenominationLabel(option.value, unitValue),
  }))
}

function getVariationCategoryOptions(
  categories: DealCategory[],
): VariationAttributeOption[] {
  return categories
    .filter((category) => (category.slug ?? '').length > 0)
    .map((category) => ({
      value: category.slug ?? '',
      label: category.name ?? category.slug ?? '',
    }))
}

function emptyVariation(categories?: DealCategory[]): VariationForm {
  const categorySlug = categories?.[0]?.slug ?? ''
  const categoryAttributes = getCategoryAttributes(
    categorySlug
      ? (categories ?? []).filter((category) => category.slug === categorySlug)
      : [],
  )
  const denominationValue =
    categoryAttributes?.denominations[0]?.value ?? '0.125'
  const unitValue = categoryAttributes?.units[0]?.value ?? 'oz'

  return {
    categorySlug,
    totalUnits: '1',
    denominationPerUnit: denominationValue,
    denominationLabel: getDenominationLabel(denominationValue, unitValue),
    unitLabel: unitValue,
  }
}

function pruneDealExclusions(
  form: DealFormState,
  categories: DealCategory[],
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

function variationFormToDoc(v: VariationForm): {
  categorySlug?: string
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
    categorySlug: v.categorySlug.trim() || undefined,
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
      categorySlug: v.categorySlug ?? deal.categorySlugs[0] ?? '',
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
    categorySlug?: string
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

  const selectedCategories = useMemo(
    () =>
      (categories ?? []).filter((category) =>
        form.categorySlugs.includes(category.slug ?? ''),
      ),
    [categories, form.categorySlugs],
  )

  const variationCategoryOptions = useMemo(
    () => getVariationCategoryOptions(selectedCategories),
    [selectedCategories],
  )

  const openAdd = useCallback(() => {
    setEditingId(null)
    setForm(emptyForm())
    setModalOpen(true)
    setSaveMessage(null)
  }, [])

  const openEdit = useCallback(
    (deal: Deal) => {
      setEditingId(deal.id)
      setForm(
        syncDealFormWithCategoryAttributes(dealToForm(deal), categories ?? []),
      )
      setModalOpen(true)
      setSaveMessage(null)
    },
    [categories],
  )

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
      setForm((current) =>
        syncDealFormWithCategoryAttributes(
          {
            ...current,
            categorySlugs: current.categorySlugs.includes(slug)
              ? current.categorySlugs.filter((s) => s !== slug)
              : [...current.categorySlugs, slug],
          },
          categories ?? [],
        ),
      )
    },
    [categories],
  )

  const updateVariation = useCallback(
    (index: number, updater: (variation: VariationForm) => VariationForm) => {
      setForm((current) => ({
        ...current,
        variations: current.variations.map((variation, variationIndex) =>
          variationIndex === index ? updater(variation) : variation,
        ),
      }))
    },
    [],
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
    <div className='flex h-[90lvh] min-w-0 w-full max-w-full flex-col space-y-2 overflow-y-auto pb-24'>
      <ContentHeader
        title='Deals & Bundles'
        description='Configure store deals and mix-and-match bundles. Only enabled deals appear on the Deals page.'>
        <div className='flex flex-wrap gap-2'>
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
      </ContentHeader>

      <section className='flex flex-col gap-4'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between'>
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
                className='border border-alum/30 rounded-xs overflow-hidden transition-colors hover:border-default-300/80'>
                <Card.Content className='p-0'>
                  <div className='flex flex-col gap-3 p-0 pb-3 sm:flex-row sm:items-start sm:justify-between'>
                    <div className='flex min-w-0 flex-1 items-start gap-3'>
                      <div className='min-w-0 flex-1'>
                        <h4 className='font-semibold text-foreground truncate'>
                          {deal.title}
                        </h4>
                        <div className='flex items-start'>
                          <div className='mt-0.5 flex min-w-0 items-start gap-2 text-xs text-foreground/50 md:text-sm'>
                            <Icon
                              name='book-open'
                              className='size-4.5 shrink-0'
                            />
                            <span className='min-w-0 wrap-break-word text-foreground/80'>
                              {deal.description}
                            </span>
                          </div>
                        </div>
                        <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                          <div className='flex items-center space-x-1'>
                            <span className='font-ios text-xs font-bold uppercase opacity-40'>
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
                      <Toggle
                        title={`${deal.enabled ? 'Disable' : 'Enable'} ${deal.title}`}
                        checked={deal.enabled}
                        onChange={handleToggleEnabled(deal)}
                      />
                    </div>
                  </div>
                  <div className='flex flex-col gap-2 border-t border-default-200/60 bg-alum/15 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex flex-wrap items-center gap-2 px-4 pt-2 sm:space-x-3 sm:pt-0'>
                      {deal.categorySlugs.map((s) => (
                        <span
                          key={s}
                          className='rounded-lg bg-terpenes/5 border border-foreground/25 px-2 py-0.5 text-[10px] text-foreground/60'>
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className='flex flex-wrap items-center justify-end gap-1 px-4 py-2 font-okxs '>
                      <Button
                        size='sm'
                        isIconOnly
                        variant='tertiary'
                        aria-label='Move up'
                        isDisabled={i === 0}
                        onPress={() => handleMove(i, -1)}
                        className='min-w-8 rounded-sm'>
                        <Icon name='arrow-up' className='size-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='tertiary'
                        isIconOnly
                        aria-label='Move down'
                        isDisabled={i === deals.length - 1}
                        onPress={() => handleMove(i, 1)}
                        className='min-w-8 rounded-sm'>
                        <Icon name='arrow-down' className='size-4' />
                      </Button>
                      <div className='md:mx-3 w-px my-2 md:self-stretch bg-default-200' />
                      <Button
                        size='sm'
                        variant='tertiary'
                        className='rounded-sm dark:bg-white/10 hover:bg-dark-table dark:hover:bg-white active:bg-dark-table dark:active:bg-white dark:active:text-dark-table hover:opacity-100! hover:text-white dark:hover:text-dark-table'
                        onPress={() => openEdit(deal)}>
                        Edit
                      </Button>
                      <Button
                        size='sm'
                        variant='danger-soft'
                        className='rounded-sm'
                        onPress={() => setDeleteConfirmId(deal.id)}>
                        <Icon name='trash' className='size-4 md:hidden' />
                        <span className='hidden md:flex'>Delete</span>
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Add/Edit modal */}
      <Modal
        isOpen={modalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal()
        }}>
        <Modal.Backdrop>
          <Modal.Container size='lg' scroll='inside'>
            <Modal.Dialog className='max-w-4xl overflow-hidden rounded-2xl'>
              <Modal.Header className='flex flex-col gap-1 pb-4'>
                <span className='text-xs font-semibold uppercase tracking-widest text-foreground/50'>
                  {editingId ? 'Edit deal' : 'New deal'}
                </span>
                <h2 className='text-xl font-semibold text-foreground'>
                  {editingId ? form.title || form.id : 'Deal details'}
                </h2>
              </Modal.Header>
              <Modal.Body className='flex flex-col gap-8 pb-6'>
                {/* Identity */}
                <div className='grid gap-4 sm:grid-cols-2'>
                  <Input
                    label='Deal ID (slug)'
                    placeholder='e.g. build-your-own-oz'
                    value={form.id}
                    onChange={(e) =>
                      setForm((f) => ({...f, id: e.target.value}))
                    }
                    required
                    readOnly={editingId != null}
                  />
                  <Input
                    label='Title'
                    placeholder='e.g. Build Your Own Oz'
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({...f, title: e.target.value}))
                    }
                    required
                  />
                </div>
                <Input
                  label='Description'
                  placeholder='Short description shown on the store Deals page'
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({...f, description: e.target.value}))
                  }
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
                    {(categories ?? []).map((c) => {
                      const isSelected = form.categorySlugs.includes(
                        c.slug ?? '',
                      )
                      return (
                        <Checkbox
                          key={c._id}
                          variant='secondary'
                          isSelected={isSelected}
                          onChange={() => toggleCategory(c.slug ?? '')}
                          className={cn(
                            'font-clash inline-flex text-foreground items-center gap-2 rounded-full border px-2.5 py-1.5 transition-colors',
                            isSelected
                              ? 'border-terpenes bg-terpenes text-white'
                              : 'border-foreground/25 bg-transparent',
                          )}>
                          <Checkbox.Control className='shrink-0'>
                            <Checkbox.Indicator className=''>
                              {({isSelected}) =>
                                isSelected ? (
                                  <Icon
                                    name='check'
                                    className='size-4 rounded-full bg-foreground/60 dark:bg-dark-table'
                                  />
                                ) : null
                              }
                            </Checkbox.Indicator>
                          </Checkbox.Control>
                          <Checkbox.Content className='py-0 pe-3 text-sm font-medium capitalize'>
                            {c.slug ?? c.name}
                          </Checkbox.Content>
                        </Checkbox>
                      )
                    })}
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
                      Exclude specific tiers, subcategories, product types,
                      bases, or brands from this deal.
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
                            {options.map((option) => {
                              const isSelected = form[field].includes(
                                option.slug,
                              )
                              return (
                                <Checkbox
                                  key={`${field}-${option.slug}`}
                                  variant='secondary'
                                  isSelected={isSelected}
                                  onChange={() =>
                                    toggleExclusion(field, option.slug)
                                  }
                                  className={cn(
                                    'inline-flex text-foreground items-center gap-2 rounded-full border px-2.5 py-1.5 transition-colors',
                                    isSelected
                                      ? 'border-rose-400 bg-rose-400 text-white'
                                      : 'border-foreground/25 bg-transparent',
                                  )}>
                                  <Checkbox.Control className='shrink-0'>
                                    <Checkbox.Indicator>
                                      {({isSelected}) =>
                                        isSelected ? (
                                          <Icon
                                            name='x'
                                            className='size-4 rounded-full bg-foreground/60 dark:bg-dark-table'
                                          />
                                        ) : null
                                      }
                                    </Checkbox.Indicator>
                                  </Checkbox.Control>
                                  <Checkbox.Content className='py-0 pe-3 text-sm font-medium'>
                                    {option.name}
                                  </Checkbox.Content>
                                </Checkbox>
                              )
                            })}
                          </div>
                        ) : (
                          <span className='text-xs text-foreground/55'>
                            Select categories with configured{' '}
                            {label.toLowerCase()}.
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
                      {`Each variation is one option (e.g. 8 × 3.5g or 4 × 7g). At least one
                  required.`}
                    </p>
                  </div>
                  <div className='space-y-5'>
                    {form.variations.map((v, idx) => {
                      const variationCategory = selectedCategories.find(
                        (category) => category.slug === v.categorySlug,
                      )
                      const variationCategoryAttributes = getCategoryAttributes(
                        variationCategory ? [variationCategory] : [],
                      )
                      const denominationOptions = getDenominationOptions(
                        variationCategoryAttributes,
                        v.unitLabel,
                      )
                      const hasCategoryDenominations =
                        variationCategoryAttributes.denominations.length > 0
                      const hasCategoryUnits =
                        variationCategoryAttributes.units.length > 0

                      return (
                        <div
                          key={idx}
                          className='relative rounded-lg border border-default-200/80 bg-default-50/30 dark:bg-default-100/5 p-4'>
                          <div className='grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-4'>
                            <Select
                              label='Category'
                              placeholder={
                                variationCategoryOptions.length > 0
                                  ? 'Select category'
                                  : 'Select categories first'
                              }
                              value={v.categorySlug || null}
                              onChange={(next) => {
                                if (!next) return
                                updateVariation(
                                  idx,
                                  (variation) =>
                                    syncVariationsWithCategoryAttributes(
                                      [{...variation, categorySlug: next}],
                                      selectedCategories,
                                    )[0],
                                )
                              }}
                              isDisabled={variationCategoryOptions.length === 0}
                              options={variationCategoryOptions.map(
                                (option) => ({
                                  value: option.value,
                                  label: option.label,
                                }),
                              )}
                            />
                            <Input
                              label='Total units'
                              type='number'
                              min={1}
                              value={String(v.totalUnits)}
                              onChange={(e) =>
                                updateVariation(idx, (variation) => ({
                                  ...variation,
                                  totalUnits: e.target.value,
                                }))
                              }
                            />
                            <Select
                              label='Size per unit'
                              placeholder={
                                hasCategoryDenominations
                                  ? 'Select denomination'
                                  : 'Select categories first'
                              }
                              value={
                                hasCategoryDenominations
                                  ? v.denominationPerUnit || null
                                  : null
                              }
                              onChange={(next) => {
                                if (!next) return
                                updateVariation(idx, (variation) => ({
                                  ...variation,
                                  denominationPerUnit: next,
                                  denominationLabel: getDenominationLabel(
                                    next,
                                    variation.unitLabel,
                                  ),
                                }))
                              }}
                              isDisabled={!hasCategoryDenominations}
                              options={denominationOptions.map((option) => ({
                                value: option.value,
                                label: option.label,
                              }))}
                            />
                            {/*<Input
                          label='Display label'
                          value={v.denominationLabel}
                          isReadOnly
                          description='Auto-derived from the selected size and unit.'
                          classNames={commonInputClassNames}
                        />*/}
                            <Select
                              label='Unit'
                              placeholder={
                                hasCategoryUnits
                                  ? 'Select unit'
                                  : 'Select categories first'
                              }
                              value={
                                hasCategoryUnits ? v.unitLabel || null : null
                              }
                              onChange={(nextValue) => {
                                if (!nextValue) return

                                updateVariation(idx, (variation) => ({
                                  ...variation,
                                  unitLabel: nextValue,
                                  denominationLabel: getDenominationLabel(
                                    variation.denominationPerUnit,
                                    nextValue,
                                  ),
                                }))
                              }}
                              isDisabled={!hasCategoryUnits}
                              options={variationCategoryAttributes.units.map(
                                (option) => ({
                                  value: option.value,
                                  label: option.label,
                                }),
                              )}
                            />
                          </div>
                          {variationCategoryOptions.length === 0 && (
                            <p className='mt-3 text-xs text-foreground/55'>
                              Choose at least one deal category before
                              configuring variation categories.
                            </p>
                          )}
                          {variationCategoryOptions.length > 0 &&
                            !hasCategoryDenominations &&
                            !hasCategoryUnits && (
                              <p className='mt-3 text-xs text-foreground/55'>
                                The selected variation category has no packaging
                                data yet. Add denominations and units in
                                Inventory first.
                              </p>
                            )}
                          <Button
                            size='sm'
                            variant='tertiary'
                            isIconOnly
                            className='absolute -top-4 -right-2 hover:text-danger'
                            isDisabled={form.variations.length <= 1}
                            onPress={() =>
                              setForm((f) => ({
                                ...f,
                                variations: f.variations.filter(
                                  (_, i) => i !== idx,
                                ),
                              }))
                            }>
                            <Icon name='x' />
                          </Button>
                        </div>
                      )
                    })}
                    <Button
                      size='sm'
                      variant='secondary'
                      onPress={() =>
                        setForm((f) => ({
                          ...f,
                          variations: [
                            ...f.variations,
                            emptyVariation(selectedCategories),
                          ],
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
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          defaultVariationIndex: e.target.value,
                        }))
                      }
                    />
                    <Input
                      label='Max per strain'
                      type='number'
                      min={1}
                      value={form.maxPerStrain}
                      onChange={(e) =>
                        setForm((f) => ({...f, maxPerStrain: e.target.value}))
                      }
                    />
                    <Input
                      label='Low stock limit'
                      type='number'
                      min={0}
                      placeholder='Optional'
                      value={form.lowStockThreshold}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          lowStockThreshold: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {editingId != null && (
                  <div className='rounded-lg border border-default-200/80 bg-default-50/30 dark:bg-default-100/5 p-3'>
                    <Checkbox
                      variant='secondary'
                      isSelected={form.enabled}
                      onChange={(isSelected) =>
                        setForm((f) => ({...f, enabled: isSelected}))
                      }
                      className='flex items-center gap-2'>
                      <Checkbox.Control>
                        <Checkbox.Indicator className='aspect-square' />
                      </Checkbox.Control>
                      <Checkbox.Content className='text-sm'>
                        Visible on store Deals page
                      </Checkbox.Content>
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
              </Modal.Body>
              <Modal.Footer className='gap-2 border-t border-default-200 pt-4'>
                <Button variant='tertiary' onPress={closeModal}>
                  Cancel
                </Button>
                <Button
                  variant='primary'
                  onPress={handleSave}
                  isDisabled={!formToDealPatch(form) || isSaving}
                  className='bg-dark-table dark:bg-white dark:text-dark-table'>
                  {isSaving
                    ? 'Saving...'
                    : editingId
                      ? 'Save changes'
                      : 'Add deal'}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={deleteConfirmId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null)
        }}>
        <Modal.Backdrop>
          <Modal.Container size='sm'>
            <Modal.Dialog className='rounded-2xl overflow-hidden'>
              <Modal.Header className='font-okxs font-semibold'>
                Delete deal
              </Modal.Header>
              <Modal.Body>
                <p className='text-sm text-foreground/80'>
                  Remove this deal? It will disappear from the store. Existing
                  cart bundles may still reference it until cleared.
                </p>
              </Modal.Body>
              <Modal.Footer className='gap-2'>
                <Button
                  variant='tertiary'
                  onPress={() => setDeleteConfirmId(null)}>
                  Cancel
                </Button>
                <Button
                  variant='danger'
                  onPress={handleDelete}
                  isDisabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}
