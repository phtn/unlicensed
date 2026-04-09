'use client'

import type {
  BundleBonus,
  RewardsConfig,
  RewardsTier,
} from '@/app/lobby/(store)/cart/checkout/lib/rewards'
import {Input} from '@/components/hero-v3/input'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Button, Card, Checkbox, Chip, Modal} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useEffect, useMemo, useState, ViewTransition} from 'react'
import {ContentHeader, LoadingHeader, PrimaryButton} from './components'

type TierFormState = {
  minSubtotal: string
  maxSubtotal: string
  shippingCost: string
  cashBackPct: string
  label: string
}

function emptyTierForm(): TierFormState {
  return {
    minSubtotal: '0',
    maxSubtotal: '',
    shippingCost: '0',
    cashBackPct: '0',
    label: '',
  }
}

function tierToForm(t: RewardsTier): TierFormState {
  return {
    minSubtotal: String(t.minSubtotal),
    maxSubtotal: t.maxSubtotal === null ? '' : String(t.maxSubtotal),
    shippingCost: String(t.shippingCost),
    cashBackPct: String(t.cashBackPct),
    label: t.label,
  }
}

function BundleAndThresholdsSection({
  config,
  onSave,
}: {
  config: RewardsConfig
  onSave: (next: RewardsConfig) => Promise<void>
}) {
  const [bundleForm, setBundleForm] = useState<BundleBonus>(config.bundleBonus)
  const [freeShipFirst, setFreeShipFirst] = useState(
    String(config.freeShippingFirstOrder),
  )
  const [minRedemption, setMinRedemption] = useState(
    String(config.minRedemption),
  )
  const [topUpThreshold, setTopUpThreshold] = useState(
    String(config.topUpProximityThreshold),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<null | 'saved' | 'error'>(null)

  useEffect(() => {
    setBundleForm(config.bundleBonus)
    setFreeShipFirst(String(config.freeShippingFirstOrder))
    setMinRedemption(String(config.minRedemption))
    setTopUpThreshold(String(config.topUpProximityThreshold))
  }, [config])

  const freeShippingFirstOrder = parseFloat(freeShipFirst)
  const minRedemptionVal = parseFloat(minRedemption)
  const topUpProximityThreshold = parseFloat(topUpThreshold)
  const isGlobalFormValid =
    !Number.isNaN(freeShippingFirstOrder) &&
    !Number.isNaN(minRedemptionVal) &&
    !Number.isNaN(topUpProximityThreshold) &&
    freeShippingFirstOrder >= 0 &&
    minRedemptionVal >= 0 &&
    topUpProximityThreshold >= 0 &&
    (!bundleForm.enabled ||
      (bundleForm.bonusPct >= 0 &&
        bundleForm.bonusPct <= 100 &&
        bundleForm.minCategories >= 2))

  const hasGlobalChange =
    bundleForm.enabled !== config.bundleBonus.enabled ||
    bundleForm.bonusPct !== config.bundleBonus.bonusPct ||
    bundleForm.minCategories !== config.bundleBonus.minCategories ||
    freeShipFirst !== String(config.freeShippingFirstOrder) ||
    minRedemption !== String(config.minRedemption) ||
    topUpThreshold !== String(config.topUpProximityThreshold)

  const handleSaveGlobal = useCallback(() => {
    if (!isGlobalFormValid) return

    setIsSaving(true)
    setSaveMessage(null)

    void onSave({
      ...config,
      bundleBonus: bundleForm,
      freeShippingFirstOrder,
      minRedemption: minRedemptionVal,
      topUpProximityThreshold,
    })
      .then(() => {
        setIsSaving(false)
        setSaveMessage('saved')
        window.setTimeout(() => setSaveMessage(null), 2000)
      })
      .catch(() => {
        setIsSaving(false)
        setSaveMessage('error')
      })
  }, [
    bundleForm,
    config,
    freeShippingFirstOrder,
    isGlobalFormValid,
    minRedemptionVal,
    onSave,
    topUpProximityThreshold,
  ])

  return (
    <section className='flex flex-col gap-4 mt-6'>
      <h3 className='text-sm font-semibold uppercase tracking-wider text-foreground/70'>
        Bundle Bonus & Thresholds
      </h3>
      <Checkbox
        isSelected={bundleForm.enabled}
        className='font-clash font-normal'
        onChange={(v) => setBundleForm((f) => ({...f, enabled: v}))}>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>Bonus Enabled</Checkbox.Content>
      </Checkbox>
      <div className='max-w-4xl md:max-w-7xl grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3'>
        <div className='flex flex-col gap-2'>
          <Input
            id='bundle-bonus'
            label='Bundle bonus %'
            type='number'
            min={0}
            max={100}
            step={0.1}
            value={String(bundleForm.bonusPct)}
            onChange={(v) =>
              setBundleForm((f) => ({
                ...f,
                bonusPct: parseFloat(v.target.value) || 0,
              }))
            }
            // classNames={commonInputClassNames}
            disabled={!bundleForm.enabled}
          />

          <Input
            id='min-cat'
            label='Min categories for bundle'
            type='number'
            min={2}
            value={String(bundleForm.minCategories)}
            onChange={(v) =>
              setBundleForm((f) => ({
                ...f,
                minCategories: parseInt(v.target.value, 10) || 2,
              }))
            }
            // classNames={commonInputClassNames}
            disabled={!bundleForm.enabled}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Input
            id='first-order'
            label='Free shipping first order ($)'
            type='number'
            min={0}
            step={1}
            value={freeShipFirst}
            onChange={(e) => setFreeShipFirst(e.target.value)}
          />
          <Input
            id='min-redemption'
            label='Min redemption ($)'
            type='number'
            min={0}
            step={0.5}
            value={minRedemption}
            onChange={(e) => setMinRedemption(e.target.value)}
          />

          <Input
            id='top-up-proximity'
            label='Top-up proximity ($)'
            type='number'
            min={0}
            value={topUpThreshold}
            onChange={(e) => setTopUpThreshold(e.target.value)}
          />
        </div>
      </div>
      <ViewTransition>
        <div className='flex items-center gap-3'>
          <Button
            size='sm'
            variant='primary'
            onPress={handleSaveGlobal}
            isDisabled={!hasGlobalChange || !isGlobalFormValid || isSaving}
            className='bg-dark-table dark:bg-white dark:text-dark-table'>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          {saveMessage === 'saved' && (
            <span className='text-sm text-emerald-600 dark:text-emerald-400'>
              Saved
            </span>
          )}
          {saveMessage === 'error' && (
            <span className='text-sm text-destructive'>Save failed</span>
          )}
        </div>
      </ViewTransition>
    </section>
  )
}

function formToTier(f: TierFormState): RewardsTier | null {
  const minSubtotal = parseFloat(f.minSubtotal)
  const shippingCost = parseFloat(f.shippingCost)
  const cashBackPct = parseFloat(f.cashBackPct)
  const label = f.label.trim()
  if (
    Number.isNaN(minSubtotal) ||
    Number.isNaN(shippingCost) ||
    Number.isNaN(cashBackPct) ||
    !label
  )
    return null
  const maxSubtotal = f.maxSubtotal.trim() ? parseFloat(f.maxSubtotal) : null
  if (
    f.maxSubtotal.trim() &&
    (Number.isNaN(maxSubtotal!) || maxSubtotal! < minSubtotal)
  )
    return null
  return {
    minSubtotal,
    maxSubtotal,
    shippingCost,
    cashBackPct,
    label,
  }
}

export const RewardsContent = () => {
  const {user} = useAuthCtx()
  const config = useQuery(api.admin.q.getRewardsConfig)
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)

  const [tierModalOpen, setTierModalOpen] = useState(false)
  const [editingTierIndex, setEditingTierIndex] = useState<number | null>(null)
  const [tierForm, setTierForm] = useState<TierFormState>(emptyTierForm())
  const [isTierSaving, setIsTierSaving] = useState(false)
  const [tierSaveMessage, setTierSaveMessage] = useState<
    null | 'saved' | 'error'
  >(null)
  const [deleteTierIndex, setDeleteTierIndex] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<null | 'error'>(null)

  const openAddTier = useCallback(() => {
    setEditingTierIndex(null)
    setTierForm(emptyTierForm())
    setTierModalOpen(true)
    setTierSaveMessage(null)
  }, [])

  const openEditTier = useCallback(
    (index: number) => {
      const tier = config?.tiers[index]
      setEditingTierIndex(index)
      setTierForm(tier ? tierToForm(tier) : emptyTierForm())
      setTierModalOpen(true)
      setTierSaveMessage(null)
    },
    [config?.tiers],
  )

  const closeTierModal = useCallback(() => {
    setTierModalOpen(false)
    setEditingTierIndex(null)
    setTierForm(emptyTierForm())
    setTierSaveMessage(null)
  }, [])

  const persistConfig = useCallback(
    async (next: RewardsConfig) => {
      await updateAdmin({
        identifier: 'rewards_config',
        value: next,
        uid: user?.uid ?? 'anonymous',
      })
    },
    [updateAdmin, user?.uid],
  )

  const handleSaveTier = useCallback(() => {
    if (!config) return
    const tier = formToTier(tierForm)
    if (!tier) return

    const tiers = [...config.tiers]
    if (editingTierIndex !== null) {
      tiers[editingTierIndex] = tier
    } else {
      tiers.push(tier)
    }
    tiers.sort((a, b) => a.minSubtotal - b.minSubtotal)

    setIsTierSaving(true)
    setTierSaveMessage(null)

    void persistConfig({
      ...config,
      tiers,
    })
      .then(() => {
        setIsTierSaving(false)
        setTierSaveMessage('saved')
        closeTierModal()
      })
      .catch(() => {
        setIsTierSaving(false)
        setTierSaveMessage('error')
      })
  }, [closeTierModal, config, editingTierIndex, persistConfig, tierForm])

  const handleDeleteTier = useCallback(() => {
    if (deleteTierIndex === null || !config) return
    const tiers = config.tiers.filter((_, i) => i !== deleteTierIndex)
    if (tiers.length === 0) return

    setIsDeleting(true)
    setDeleteMessage(null)

    void persistConfig({
      ...config,
      tiers,
    })
      .then(() => {
        setDeleteTierIndex(null)
        setIsDeleting(false)
      })
      .catch(() => {
        setIsDeleting(false)
        setDeleteMessage('error')
      })
  }, [config, deleteTierIndex, persistConfig])

  const isLoading = config === undefined
  const sortedTiers = useMemo(
    () =>
      (config?.tiers ?? [])
        .map((tier, index) => ({index, tier}))
        .sort((a, b) => a.tier.minSubtotal - b.tier.minSubtotal),
    [config],
  )

  if (isLoading) {
    return <LoadingHeader title='Rewards Manager' />
  }

  return (
    <div className='flex h-[90lvh] min-w-0 w-full max-w-full flex-col space-y-2 overflow-y-auto pb-24'>
      <ContentHeader
        title='Rewards Manager'
        description='Configure tier-based shipping, cash back, and bundle bonus. Matches the structure used in checkout.'>
        <PrimaryButton onPress={openAddTier} icon='plus' label='Add Tier' />
      </ContentHeader>

      <section className='flex flex-col gap-4 mt-2'>
        <h3 className='text-sm font-semibold uppercase tracking-wider text-foreground/70'>
          Shipping & Cash Back Tiers
        </h3>
        <div className='grid md:grid-cols-2 gap-3'>
          {sortedTiers.map(({index, tier}) => (
            <Card
              key={`${tier.label}-${tier.minSubtotal}-${tier.maxSubtotal ?? 'max'}`}
              className='border border-alum/30 rounded-xs overflow-hidden transition-colors bg-alum/20 dark:bg-dark-table/40'>
              <Card.Content className='flex flex-row flex-wrap items-center justify-between gap-4 p-4'>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{tier.label}</span>
                    <Chip
                      size='sm'
                      variant='tertiary'
                      className='bg-sidebar/80 dark:bg-white/5'>
                      ${tier.minSubtotal}
                      {tier.maxSubtotal !== null
                        ? ` – $${tier.maxSubtotal}`
                        : '+'}
                    </Chip>
                  </div>
                  <div className='mt-1 flex flex-wrap gap-2 text-xs text-foreground/70'>
                    <span>
                      {tier.shippingCost === 0
                        ? 'Free shipping'
                        : `$${tier.shippingCost} shipping`}
                    </span>
                    <span>{tier.cashBackPct}% cash back</span>
                  </div>
                </div>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='tertiary'
                    className='rounded-sm'
                    onPress={() => openEditTier(index)}>
                    Edit
                  </Button>
                  <Button
                    size='sm'
                    variant='tertiary'
                    onPress={() => setDeleteTierIndex(index)}
                    className='rounded-sm text-red-400 dark:text-red-300 hover:bg-red-600/10! dark:hover:bg-red-500/10'
                    isDisabled={config.tiers.length <= 1}>
                    Delete
                  </Button>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      </section>

      <BundleAndThresholdsSection config={config} onSave={persistConfig} />

      <Modal
        isOpen={tierModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            closeTierModal()
          }
        }}>
        <Modal.Backdrop>
          <Modal.Container scroll='inside' size='lg'>
            <Modal.Dialog>
              <Modal.Header className='font-okxs font-semibold'>
                <Modal.Heading>
                  {editingTierIndex !== null ? 'Edit Tier' : 'Add Tier'}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className='space-y-4'>
                <Input
                  id='tier'
                  label='Label'
                  placeholder='e.g. Starter, Silver, Gold'
                  value={tierForm.label}
                  onChange={(v) =>
                    setTierForm((f) => ({...f, label: v.target.value}))
                  }
                  required
                />
                <div className='grid grid-cols-2 gap-4'>
                  <Input
                    id='min-subtotal'
                    label='Min subtotal ($)'
                    type='number'
                    min={0}
                    step={0.01}
                    value={tierForm.minSubtotal}
                    onChange={(v) =>
                      setTierForm((f) => ({...f, minSubtotal: v.target.value}))
                    }
                  />
                  <Input
                    id='max-subtotal'
                    label='Max subtotal ($)'
                    type='number'
                    min={0}
                    step={0.01}
                    placeholder='Blank = no max'
                    value={tierForm.maxSubtotal}
                    onChange={(v) =>
                      setTierForm((f) => ({...f, maxSubtotal: v.target.value}))
                    }
                  />
                  <Input
                    id='shipping-cost'
                    label='Shipping cost ($)'
                    type='number'
                    min={0}
                    step={0.01}
                    value={tierForm.shippingCost}
                    onChange={(v) =>
                      setTierForm((f) => ({...f, shippingCost: v.target.value}))
                    }
                  />
                  <Input
                    id='cash-back'
                    label='Cash back %'
                    type='number'
                    min={0}
                    max={100}
                    step={0.5}
                    value={tierForm.cashBackPct}
                    onChange={(v) =>
                      setTierForm((f) => ({...f, cashBackPct: v.target.value}))
                    }
                  />
                </div>
                <ViewTransition>
                  {tierSaveMessage === 'error' && (
                    <span className='text-sm text-destructive'>
                      Save failed
                    </span>
                  )}
                </ViewTransition>
              </Modal.Body>
              <Modal.Footer className='gap-2'>
                <Button variant='tertiary' onPress={closeTierModal}>
                  Cancel
                </Button>
                <Button
                  variant='primary'
                  onPress={handleSaveTier}
                  isDisabled={!formToTier(tierForm) || isTierSaving}
                  className='bg-dark-table dark:bg-white dark:text-dark-table'>
                  {isTierSaving
                    ? 'Saving...'
                    : editingTierIndex !== null
                      ? 'Save Changes'
                      : 'Add'}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal
        isOpen={deleteTierIndex !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleteTierIndex(null)
            setDeleteMessage(null)
          }
        }}>
        <Modal.Backdrop>
          <Modal.Container size='sm'>
            <Modal.Dialog>
              <Modal.Header className='font-okxs font-semibold'>
                <Modal.Heading>Delete Tier</Modal.Heading>
              </Modal.Header>
              <Modal.Body className='gap-3'>
                <p className='text-sm text-foreground/80'>
                  Remove this tier? You must have at least one tier.
                </p>
                {deleteMessage === 'error' && (
                  <p className='text-sm text-destructive'>Delete failed</p>
                )}
              </Modal.Body>
              <Modal.Footer className='gap-2'>
                <Button
                  variant='tertiary'
                  onPress={() => {
                    setDeleteTierIndex(null)
                    setDeleteMessage(null)
                  }}>
                  Cancel
                </Button>
                <Button
                  variant='danger'
                  onPress={handleDeleteTier}
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
