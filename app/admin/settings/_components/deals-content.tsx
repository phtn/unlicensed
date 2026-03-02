'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {SectionHeader} from '@/components/ui/section-header'
import {api} from '@/convex/_generated/api'
import type {Deal} from '@/convex/deals/d'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
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
import {startTransition, useCallback, useState, ViewTransition} from 'react'

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
  variations: VariationForm[]
  defaultVariationIndex: string
  maxPerStrain: string
  lowStockThreshold: string
  enabled: boolean
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
    (deal: Deal, enabled: boolean) => {
      startTransition(() => {
        updateDeal({id: deal.id, patch: {enabled}, updatedBy: uid}).catch(
          () => {},
        )
      })
    },
    [updateDeal, uid],
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

  const toggleCategory = useCallback((slug: string) => {
    setForm((f) => ({
      ...f,
      categorySlugs: f.categorySlugs.includes(slug)
        ? f.categorySlugs.filter((s) => s !== slug)
        : [...f.categorySlugs, slug],
    }))
  }, [])

  const isLoading = deals === undefined

  if (isLoading) {
    return (
      <div className='flex w-full flex-col gap-4'>
        <SectionHeader title='Deals & Bundles' />
        <p className='text-sm text-foreground/60'>Loading…</p>
      </div>
    )
  }

  return (
    <div className='flex w-full flex-col gap-6'>
      <SectionHeader
        title='Deals & Bundles'
        description='Configure store deals and mix-and-match bundles. Only enabled deals appear on the Deals page.'>
        <div className='flex gap-2'>
          {deals.length === 0 && (
            <Button
              size='sm'
              variant='flat'
              onPress={handleSeedDefaults}
              isLoading={isSeeding}
              color='secondary'>
              Seed default deals
            </Button>
          )}
          <Button
            size='md'
            radius='none'
            color='primary'
            onPress={openAdd}
            className='bg-dark-table dark:bg-white dark:text-dark-table rounded-lg'>
            Add Deal
          </Button>
        </div>
      </SectionHeader>

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
                shadow='none'
                className='border border-default-200/80 rounded-xl overflow-hidden transition-colors hover:border-default-300/80'>
                <CardBody className='p-0'>
                  <div className='flex items-start justify-between gap-3 p-4 pb-3'>
                    <div className='flex min-w-0 flex-1 items-start gap-3'>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center space-x-2'>
                          <h4 className='font-semibold text-foreground truncate'>
                            {deal.title}
                          </h4>
                          <p className='mt-0.5 text-xs md:text-sm text-foreground/60 line-clamp-2'>
                            {deal.description}
                          </p>
                        </div>
                        <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                          <span className='rounded bg-default-200/50 px-1.5 py-0.5 font-mono text-[10px] text-foreground/70'>
                            {deal.id}
                          </span>
                          <span className='text-[10px] text-foreground/50'>
                            max {deal.maxPerStrain} per strain
                          </span>
                        </div>
                      </div>
                      <Switch
                        size='sm'
                        classNames={{wrapper: 'mt-0.5'}}
                        isSelected={deal.enabled}
                        onValueChange={(v) => handleToggleEnabled(deal, v)}
                        aria-label={`${deal.enabled ? 'Disable' : 'Enable'} ${deal.title}`}
                      />
                    </div>
                  </div>
                  <div className='flex items-center justify-between border-t border-default-200/60'>
                    <div className='flex items-center space-x-3 px-4'>
                      {deal.categorySlugs.map((s) => (
                        <span
                          key={s}
                          className='rounded bg-blue-400/10 px-1.5 py-0.5 text-[10px] text-blue-200'>
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className='flex items-center justify-end gap-1 bg-default-100/30 dark:bg-default-50/20 px-4 py-2'>
                      <Button
                        size='sm'
                        isIconOnly
                        radius='none'
                        variant='light'
                        aria-label='Move up'
                        isDisabled={i === 0}
                        onPress={() => handleMove(i, -1)}
                        className='min-w-8 rounded-md'>
                        <Icon name='arrow-up' className='size-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='light'
                        isIconOnly
                        aria-label='Move down'
                        isDisabled={i === deals.length - 1}
                        onPress={() => handleMove(i, 1)}
                        className='min-w-8'>
                        <Icon name='arrow-down' className='size-4' />
                      </Button>
                      <div className='mx-3 w-px my-2 self-stretch bg-default-200' />
                      <Button
                        size='sm'
                        radius='none'
                        variant='flat'
                        className='rounded-md'
                        onPress={() => openEdit(deal)}>
                        Edit
                      </Button>
                      <Button
                        size='sm'
                        radius='none'
                        variant='light'
                        className='rounded-md text-red-300 hover:bg-red-600/20 dark:hover:bg-red-500/10'
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
            <div className='space-y-3'>
              <div>
                <p className='text-sm font-medium text-foreground'>
                  Product categories
                </p>
                <p className='text-xs text-foreground/55'>
                  Which category slugs this deal applies to.
                </p>
              </div>
              <div className='flex flex-wrap gap-3'>
                {(categories ?? []).map((c) => (
                  <Checkbox
                    key={c._id}
                    classNames={{label: 'text-sm'}}
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

            {/* Variations */}
            <div className='space-y-3'>
              <div>
                <p className='text-sm font-medium text-foreground'>
                  Variations
                </p>
                <p className='text-xs text-foreground/55'>
                  Each row is one option (e.g. 8×⅛ oz or 4×¼ oz). At least one
                  required.
                </p>
              </div>
              <div className='space-y-3'>
                {form.variations.map((v, idx) => (
                  <div
                    key={idx}
                    className='rounded-lg border border-default-200/80 bg-default-50/30 dark:bg-default-100/5 p-4'>
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
                    <div className='mt-3 flex justify-end'>
                      <Button
                        size='sm'
                        color='danger'
                        variant='light'
                        isDisabled={form.variations.length <= 1}
                        onPress={() =>
                          setForm((f) => ({
                            ...f,
                            variations: f.variations.filter(
                              (_, i) => i !== idx,
                            ),
                          }))
                        }>
                        Remove variation
                      </Button>
                    </div>
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
              <p className='text-sm font-medium text-foreground'>Rules</p>
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
