'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import type {
  BundleBonus,
  RewardsConfig,
  RewardsTier,
} from '@/app/lobby/(store)/cart/checkout/lib/rewards'
import {SectionHeader} from '@/components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {startTransition, useCallback, useState, ViewTransition} from 'react'

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
  isSaving,
  saveMessage,
  onSave,
}: {
  config: RewardsConfig
  isSaving: boolean
  saveMessage: null | 'saved' | 'error'
  onSave: (next: RewardsConfig) => void
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

  const hasGlobalChange =
    bundleForm.enabled !== config.bundleBonus.enabled ||
    bundleForm.bonusPct !== config.bundleBonus.bonusPct ||
    bundleForm.minCategories !== config.bundleBonus.minCategories ||
    freeShipFirst !== String(config.freeShippingFirstOrder) ||
    minRedemption !== String(config.minRedemption) ||
    topUpThreshold !== String(config.topUpProximityThreshold)

  const handleSaveGlobal = useCallback(() => {
    const freeShippingFirstOrder = parseFloat(freeShipFirst)
    const minRedemptionVal = parseFloat(minRedemption)
    const topUpProximityThreshold = parseFloat(topUpThreshold)
    if (
      Number.isNaN(freeShippingFirstOrder) ||
      Number.isNaN(minRedemptionVal) ||
      Number.isNaN(topUpProximityThreshold)
    )
      return

    onSave({
      ...config,
      bundleBonus: bundleForm,
      freeShippingFirstOrder,
      minRedemption: minRedemptionVal,
      topUpProximityThreshold,
    })
  }, [config, bundleForm, freeShipFirst, minRedemption, topUpThreshold, onSave])

  return (
    <section className='flex flex-col gap-4 mt-6'>
      <h3 className='text-sm font-semibold uppercase tracking-wider text-foreground/70'>
        Bundle Bonus & Thresholds
      </h3>
      <Checkbox
        isSelected={bundleForm.enabled}
        className='font-clash font-normal'
        onValueChange={(v) => setBundleForm((f) => ({...f, enabled: v}))}>
        Bonus Enabled
      </Checkbox>
      <div className='max-w-4xl grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3'>
        <div className='flex flex-col gap-2'>
          <Input
            label='Bundle bonus %'
            type='number'
            min={0}
            max={100}
            step={0.1}
            value={String(bundleForm.bonusPct)}
            onValueChange={(v) =>
              setBundleForm((f) => ({
                ...f,
                bonusPct: parseFloat(v) || 0,
              }))
            }
            classNames={commonInputClassNames}
            isDisabled={!bundleForm.enabled}
          />
          <Input
            label='Min categories for bundle'
            type='number'
            min={2}
            value={String(bundleForm.minCategories)}
            onValueChange={(v) =>
              setBundleForm((f) => ({
                ...f,
                minCategories: parseInt(v, 10) || 2,
              }))
            }
            classNames={commonInputClassNames}
            isDisabled={!bundleForm.enabled}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Input
            label='Free shipping first order ($)'
            type='number'
            min={0}
            step={1}
            value={freeShipFirst}
            onValueChange={setFreeShipFirst}
            classNames={commonInputClassNames}
            description='Subtotal threshold for first-order free shipping'
          />
          <Input
            label='Min redemption ($)'
            type='number'
            min={0}
            step={0.5}
            value={minRedemption}
            onValueChange={setMinRedemption}
            classNames={commonInputClassNames}
          />
          <Input
            label='Top-up proximity ($)'
            type='number'
            min={0}
            value={topUpThreshold}
            onValueChange={setTopUpThreshold}
            classNames={commonInputClassNames}
            description='Show top-up suggestions when within this amount'
          />
        </div>
      </div>
      <ViewTransition>
        <div className='flex items-center gap-3'>
          <Button
            size='sm'
            color='primary'
            onPress={handleSaveGlobal}
            isLoading={isSaving}
            isDisabled={!hasGlobalChange}
            className='bg-dark-table dark:bg-white dark:text-dark-table'>
            Save Changes
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
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<null | 'saved' | 'error'>(null)
  const [deleteTierIndex, setDeleteTierIndex] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const openAddTier = useCallback(() => {
    setEditingTierIndex(null)
    setTierForm(emptyTierForm())
    setTierModalOpen(true)
    setSaveMessage(null)
  }, [])

  const openEditTier = useCallback(
    (index: number) => {
      const tier = config?.tiers[index]
      setEditingTierIndex(index)
      setTierForm(tier ? tierToForm(tier) : emptyTierForm())
      setTierModalOpen(true)
      setSaveMessage(null)
    },
    [config?.tiers],
  )

  const closeTierModal = useCallback(() => {
    setTierModalOpen(false)
    setEditingTierIndex(null)
    setTierForm(emptyTierForm())
    setSaveMessage(null)
  }, [])

  const saveConfig = useCallback(
    (next: RewardsConfig) => {
      setIsSaving(true)
      setSaveMessage(null)
      startTransition(() => {
        updateAdmin({
          identifier: 'rewards_config',
          value: next,
          uid: user?.uid ?? 'anonymous',
        })
          .then(() => {
            setIsSaving(false)
            setSaveMessage('saved')
            closeTierModal()
            setDeleteTierIndex(null)
            setTimeout(() => setSaveMessage(null), 2000)
          })
          .catch(() => {
            setIsSaving(false)
            setSaveMessage('error')
          })
      })
    },
    [updateAdmin, user?.uid, closeTierModal],
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

    saveConfig({
      ...config,
      tiers,
    })
  }, [config, tierForm, editingTierIndex, saveConfig])

  const handleDeleteTier = useCallback(() => {
    if (deleteTierIndex === null || !config) return
    const tiers = config.tiers.filter((_, i) => i !== deleteTierIndex)
    if (tiers.length === 0) return
    setIsDeleting(true)
    startTransition(() => {
      updateAdmin({
        identifier: 'rewards_config',
        value: {...config, tiers},
        uid: user?.uid ?? 'anonymous',
      })
        .then(() => {
          setDeleteTierIndex(null)
          setIsDeleting(false)
        })
        .catch(() => setIsDeleting(false))
    })
  }, [deleteTierIndex, config, updateAdmin, user?.uid])

  const isLoading = config === undefined

  if (isLoading) {
    return (
      <div className='flex w-full'>
        <SectionHeader title='Rewards Manager'>
          <Button disabled variant='light'>
            <Icon name='spinner-dots' className='mr-1 size-5 opacity-80' />
          </Button>
        </SectionHeader>
      </div>
    )
  }

  return (
    <div className='flex w-full flex-col space-y-2'>
      <div className='flex items-start w-full min-h-20'>
        <SectionHeader
          title='Rewards Manager'
          description='Configure tier-based shipping, cash back, and bundle bonus. Matches the structure used in checkout.'>
          <Button
            size='md'
            radius='none'
            color='primary'
            onPress={openAddTier}
            className='bg-dark-table dark:bg-white dark:text-dark-table rounded-lg'>
            <Icon name='plus' className='mr-1 size-5' />
            <span>Add Tier</span>
          </Button>
        </SectionHeader>
      </div>

      <section className='flex flex-col gap-4 mt-2'>
        <h3 className='text-sm font-semibold uppercase tracking-wider text-foreground/70'>
          Shipping & Cash Back Tiers
        </h3>
        <div className='grid md:grid-cols-2 gap-3'>
          {config.tiers.map((tier, i) => (
            <Card
              key={i}
              shadow='none'
              radius='none'
              className='border border-alum/30 rounded-xs overflow-hidden transition-colors bg-alum/20 dark:bg-dark-table/40'>
              <CardBody className='flex flex-row flex-wrap items-center justify-between gap-4 p-4'>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{tier.label}</span>
                    <Chip
                      size='sm'
                      variant='flat'
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
                    radius='none'
                    variant='flat'
                    className='rounded-sm'
                    onPress={() => openEditTier(i)}>
                    Edit
                  </Button>
                  <Button
                    size='sm'
                    variant='light'
                    onPress={() => setDeleteTierIndex(i)}
                    className='rounded-sm text-red-400 dark:text-red-300 hover:bg-red-600/10! dark:hover:bg-red-500/10'
                    isDisabled={config.tiers.length <= 1}>
                    Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <BundleAndThresholdsSection
        key={JSON.stringify({
          b: config.bundleBonus,
          f: config.freeShippingFirstOrder,
          m: config.minRedemption,
          t: config.topUpProximityThreshold,
        })}
        config={config}
        isSaving={isSaving}
        saveMessage={saveMessage}
        onSave={saveConfig}
      />

      <Modal
        isOpen={tierModalOpen}
        onClose={closeTierModal}
        size='lg'
        scrollBehavior='inside'>
        <ModalContent>
          <ModalHeader className='font-okxs font-semibold'>
            {editingTierIndex !== null ? 'Edit Tier' : 'Add Tier'}
          </ModalHeader>
          <ModalBody className='gap-4'>
            <Input
              label='Label'
              placeholder='e.g. Starter, Silver, Gold'
              value={tierForm.label}
              onValueChange={(v) => setTierForm((f) => ({...f, label: v}))}
              classNames={commonInputClassNames}
              isRequired
            />
            <div className='grid grid-cols-2 gap-4'>
              <Input
                label='Min subtotal ($)'
                type='number'
                min={0}
                step={0.01}
                value={tierForm.minSubtotal}
                onValueChange={(v) =>
                  setTierForm((f) => ({...f, minSubtotal: v}))
                }
                classNames={commonInputClassNames}
              />
              <Input
                label='Max subtotal ($)'
                type='number'
                min={0}
                step={0.01}
                placeholder='Blank = no max'
                value={tierForm.maxSubtotal}
                onValueChange={(v) =>
                  setTierForm((f) => ({...f, maxSubtotal: v}))
                }
                classNames={commonInputClassNames}
              />
              <Input
                label='Shipping cost ($)'
                type='number'
                min={0}
                step={0.01}
                value={tierForm.shippingCost}
                onValueChange={(v) =>
                  setTierForm((f) => ({...f, shippingCost: v}))
                }
                classNames={commonInputClassNames}
              />
              <Input
                label='Cash back %'
                type='number'
                min={0}
                max={100}
                step={0.5}
                value={tierForm.cashBackPct}
                onValueChange={(v) =>
                  setTierForm((f) => ({...f, cashBackPct: v}))
                }
                classNames={commonInputClassNames}
              />
            </div>
            <ViewTransition>
              {saveMessage === 'error' && (
                <span className='text-sm text-destructive'>Save failed</span>
              )}
            </ViewTransition>
          </ModalBody>
          <ModalFooter className='gap-2'>
            <Button variant='flat' onPress={closeTierModal}>
              Cancel
            </Button>
            <Button
              color='primary'
              onPress={handleSaveTier}
              isLoading={isSaving}
              isDisabled={!formToTier(tierForm)}
              className='bg-dark-table dark:bg-white dark:text-dark-table'>
              {editingTierIndex !== null ? 'Save Changes' : 'Add'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={deleteTierIndex !== null}
        onClose={() => setDeleteTierIndex(null)}
        size='sm'>
        <ModalContent>
          <ModalHeader className='font-okxs font-semibold'>
            Delete Tier
          </ModalHeader>
          <ModalBody>
            <p className='text-sm text-foreground/80'>
              Remove this tier? You must have at least one tier.
            </p>
          </ModalBody>
          <ModalFooter className='gap-2'>
            <Button variant='flat' onPress={() => setDeleteTierIndex(null)}>
              Cancel
            </Button>
            <Button
              color='danger'
              onPress={handleDeleteTier}
              isLoading={isDeleting}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
