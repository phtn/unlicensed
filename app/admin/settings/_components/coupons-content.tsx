'use client'

import {Input} from '@/components/hero-v3/input'
import {Select} from '@/components/hero-v3/select'
import {api} from '@/convex/_generated/api'
import type {Coupon, CouponDiscountType} from '@/convex/coupons/d'
import {useAuthCtx} from '@/ctx/auth'
import {Button, Card, Chip, Modal, Switch, TextArea} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {startTransition, useEffect, useMemo, useState} from 'react'
import {ContentHeader, PrimaryButton} from './components'

type CouponFormState = {
  code: string
  name: string
  description: string
  enabled: boolean
  discountType: CouponDiscountType
  discountValue: string
  minimumSubtotalDollars: string
  maximumDiscountDollars: string
  startsAt: string
  expiresAt: string
  usageLimit: string
  perUserLimit: string
  stackable: boolean
  notes: string
}

const discountTypeOptions: Array<{
  key: CouponDiscountType
  label: string
}> = [
  {key: 'percentage', label: 'Percentage'},
  {key: 'fixed_amount', label: 'USD amount'},
]

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function toDateTimeLocal(value: number | undefined) {
  if (value === undefined) return ''
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDateTimeLocal(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const ms = new Date(trimmed).getTime()
  return Number.isNaN(ms) ? null : ms
}

function emptyCouponForm(): CouponFormState {
  return {
    code: '',
    name: '',
    description: '',
    enabled: true,
    discountType: 'percentage',
    discountValue: '10',
    minimumSubtotalDollars: '',
    maximumDiscountDollars: '',
    startsAt: '',
    expiresAt: '',
    usageLimit: '',
    perUserLimit: '',
    stackable: false,
    notes: '',
  }
}

function couponToForm(coupon: Coupon): CouponFormState {
  return {
    code: coupon.code,
    name: coupon.name,
    description: coupon.description ?? '',
    enabled: coupon.enabled,
    discountType: coupon.discountType,
    discountValue:
      coupon.discountType === 'fixed_amount'
        ? String(coupon.discountValue / 100)
        : String(coupon.discountValue),
    minimumSubtotalDollars:
      coupon.minimumSubtotalCents !== undefined
        ? String(coupon.minimumSubtotalCents / 100)
        : '',
    maximumDiscountDollars:
      coupon.maximumDiscountCents !== undefined
        ? String(coupon.maximumDiscountCents / 100)
        : '',
    startsAt: toDateTimeLocal(coupon.startsAt),
    expiresAt: toDateTimeLocal(coupon.expiresAt),
    usageLimit:
      coupon.usageLimit !== undefined ? String(coupon.usageLimit) : '',
    perUserLimit:
      coupon.perUserLimit !== undefined ? String(coupon.perUserLimit) : '',
    stackable: coupon.stackable ?? false,
    notes: coupon.notes ?? '',
  }
}

function getCouponDiscountLabel(coupon: Coupon) {
  return coupon.discountType === 'percentage'
    ? `${coupon.discountValue}% off`
    : `${formatCurrency(coupon.discountValue)} off`
}

function getCouponStatus(coupon: Coupon, now: number) {
  if (!coupon.enabled) {
    return {label: 'Disabled', color: 'default' as const}
  }
  if (coupon.startsAt !== undefined && coupon.startsAt > now) {
    return {label: 'Scheduled', color: 'accent' as const}
  }
  if (coupon.expiresAt !== undefined && coupon.expiresAt <= now) {
    return {label: 'Expired', color: 'danger' as const}
  }
  return {label: 'Active', color: 'success' as const}
}

function closeCouponModal(
  setModalOpen: (value: boolean) => void,
  setEditingCouponId: (value: string | null) => void,
  setForm: (value: CouponFormState) => void,
  setFormError: (value: string | null) => void,
) {
  setModalOpen(false)
  setEditingCouponId(null)
  setForm(emptyCouponForm())
  setFormError(null)
}

function buildCouponPayload(form: CouponFormState) {
  const code = form.code.trim().toUpperCase()
  const name = form.name.trim()
  const rawDiscountValue = parseFloat(form.discountValue || '0')
  const minimumSubtotal =
    form.minimumSubtotalDollars.trim() === ''
      ? undefined
      : Math.round(parseFloat(form.minimumSubtotalDollars) * 100)
  const maximumDiscount =
    form.maximumDiscountDollars.trim() === ''
      ? undefined
      : Math.round(parseFloat(form.maximumDiscountDollars) * 100)
  const usageLimit =
    form.usageLimit.trim() === '' ? undefined : parseInt(form.usageLimit, 10)
  const perUserLimit =
    form.perUserLimit.trim() === ''
      ? undefined
      : parseInt(form.perUserLimit, 10)
  const startsAt = fromDateTimeLocal(form.startsAt)
  const expiresAt = fromDateTimeLocal(form.expiresAt)

  if (!code) return {error: 'Coupon code is required'} as const
  if (!name) return {error: 'Coupon name is required'} as const
  if (Number.isNaN(rawDiscountValue) || rawDiscountValue <= 0) {
    return {error: 'Discount value must be greater than 0'} as const
  }
  if (
    form.discountType === 'percentage' &&
    (rawDiscountValue <= 0 || rawDiscountValue > 100)
  ) {
    return {error: 'Percentage discounts must be between 0 and 100'} as const
  }
  if (minimumSubtotal !== undefined && Number.isNaN(minimumSubtotal)) {
    return {error: 'Minimum subtotal is invalid'} as const
  }
  if (maximumDiscount !== undefined && Number.isNaN(maximumDiscount)) {
    return {error: 'Maximum discount is invalid'} as const
  }
  if (usageLimit !== undefined && Number.isNaN(usageLimit)) {
    return {error: 'Usage limit is invalid'} as const
  }
  if (perUserLimit !== undefined && Number.isNaN(perUserLimit)) {
    return {error: 'Per-user limit is invalid'} as const
  }
  if (startsAt === null || expiresAt === null) {
    return {error: 'One of the schedule dates is invalid'} as const
  }
  if (
    startsAt !== undefined &&
    expiresAt !== undefined &&
    expiresAt <= startsAt
  ) {
    return {error: 'Expiry must be later than start date'} as const
  }

  return {
    coupon: {
      code,
      name,
      description: form.description.trim() || undefined,
      enabled: form.enabled,
      discountType: form.discountType,
      discountValue:
        form.discountType === 'fixed_amount'
          ? Math.round(rawDiscountValue * 100)
          : rawDiscountValue,
      minimumSubtotalCents: minimumSubtotal,
      maximumDiscountCents:
        form.discountType === 'percentage' ? maximumDiscount : undefined,
      startsAt,
      expiresAt,
      usageLimit,
      perUserLimit,
      stackable: form.stackable,
      notes: form.notes.trim() || undefined,
    },
  } as const
}

export const CouponsContent = () => {
  const {user} = useAuthCtx()
  const coupons = useQuery(api.coupons.q.listCoupons)
  const createCoupon = useMutation(api.coupons.m.createCoupon)
  const updateCoupon = useMutation(api.coupons.m.updateCoupon)
  const deleteCoupon = useMutation(api.coupons.m.deleteCoupon)
  const setCouponEnabled = useMutation(api.coupons.m.setCouponEnabled)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null)
  const [form, setForm] = useState<CouponFormState>(emptyCouponForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [busyCouponId, setBusyCouponId] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const counts = useMemo(() => {
    const data = coupons ?? []
    return {
      total: data.length,
      active: data.filter(
        (coupon) =>
          coupon.enabled &&
          (coupon.startsAt === undefined || coupon.startsAt <= now) &&
          (coupon.expiresAt === undefined || coupon.expiresAt > now),
      ).length,
      scheduled: data.filter(
        (coupon) =>
          coupon.enabled &&
          coupon.startsAt !== undefined &&
          coupon.startsAt > now,
      ).length,
      expired: data.filter(
        (coupon) => coupon.expiresAt !== undefined && coupon.expiresAt <= now,
      ).length,
    }
  }, [coupons, now])

  const openCreateModal = () => {
    setEditingCouponId(null)
    setForm(emptyCouponForm())
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (coupon: Coupon & {_id: string}) => {
    setEditingCouponId(coupon._id)
    setForm(couponToForm(coupon))
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () =>
    closeCouponModal(setModalOpen, setEditingCouponId, setForm, setFormError)

  const handleSave = () => {
    const payload = buildCouponPayload(form)
    if ('error' in payload) {
      setFormError(payload.error ?? 'Invalid coupon form')
      return
    }

    setIsSaving(true)
    setFormError(null)
    startTransition(() => {
      const action = editingCouponId
        ? updateCoupon({
            id: editingCouponId as never,
            coupon: payload.coupon,
            updatedBy: user?.uid,
          })
        : createCoupon({
            coupon: payload.coupon,
            updatedBy: user?.uid,
          })

      action
        .then(() => {
          setIsSaving(false)
          closeModal()
        })
        .catch((error: unknown) => {
          setIsSaving(false)
          setFormError(
            error instanceof Error ? error.message : 'Failed to save coupon',
          )
        })
    })
  }

  const handleToggleEnabled = (coupon: Coupon & {_id: string}) => {
    setBusyCouponId(coupon._id)
    startTransition(() => {
      setCouponEnabled({
        id: coupon._id as never,
        enabled: !coupon.enabled,
        updatedBy: user?.uid,
      })
        .catch(() => {})
        .finally(() => setBusyCouponId(null))
    })
  }

  const handleDelete = (coupon: Coupon & {_id: string}) => {
    const confirmed = window.confirm(`Delete coupon "${coupon.code}"?`)
    if (!confirmed) return

    setBusyCouponId(coupon._id)
    startTransition(() => {
      deleteCoupon({id: coupon._id as never})
        .catch(() => {})
        .finally(() => setBusyCouponId(null))
    })
  }

  return (
    <div className='flex w-full flex-col gap-4'>
      <ContentHeader
        title='Coupon Code Manager'
        description='Create and control promo codes, timing windows, and discount rules from one place.'>
        <div className='flex items-center justify-end gap-2'>
          <PrimaryButton
            onPress={openCreateModal}
            label='Add coupon'
            icon='plus'
          />
        </div>
      </ContentHeader>

      <div className='flex flex-wrap gap-2'>
        <Chip variant='tertiary'>Total {counts.total}</Chip>
        <Chip variant='tertiary' color='default'>
          Active {counts.active}
        </Chip>
        <Chip variant='tertiary' color='accent'>
          Scheduled {counts.scheduled}
        </Chip>
        <Chip variant='tertiary' color='default'>
          Expired {counts.expired}
        </Chip>
      </div>

      {coupons === undefined ? (
        <div className='text-sm text-foreground/60'>Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <Card className='border border-border/50 bg-default-100/40 shadow-none'>
          <Card.Content className='flex flex-col gap-3 p-6'>
            <div className='text-lg font-clash'>No coupon codes yet</div>
            <p className='text-sm text-foreground/60'>
              Start with a simple percentage or dollar-off offer, then layer in
              limits and expiry when you need them.
            </p>
            <div>
              <Button
                variant='secondary'
                onPress={openCreateModal}
                className='rounded-sm bg-black text-white dark:bg-white dark:text-dark-table'>
                Create first coupon
              </Button>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <div className='grid gap-4 xl:grid-cols-2'>
          {coupons.map((coupon) => {
            const status = getCouponStatus(coupon, now)
            const isBusy = busyCouponId === coupon._id
            return (
              <Card
                key={coupon._id}
                className='border border-border/50 bg-default-100/40 shadow-none'>
                <Card.Content className='flex flex-col gap-4 p-5'>
                  <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div className='space-y-1'>
                      <div className='font-mono text-lg font-semibold tracking-[0.18em]'>
                        {coupon.code}
                      </div>
                      <div className='text-base font-medium'>{coupon.name}</div>
                      {coupon.description && (
                        <p className='text-sm text-foreground/60'>
                          {coupon.description}
                        </p>
                      )}
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      <Chip color={status.color} variant='secondary'>
                        {status.label}
                      </Chip>
                    </div>
                  </div>

                  <div className='grid gap-3 text-sm text-foreground/75 sm:grid-cols-2'>
                    <div>
                      <div className='text-xs uppercase tracking-[0.18em] text-foreground/45'>
                        Discount
                      </div>
                      <div>{getCouponDiscountLabel(coupon)}</div>
                    </div>
                    <div>
                      <div className='text-xs uppercase tracking-[0.18em] text-foreground/45'>
                        Min subtotal
                      </div>
                      <div>
                        {coupon.minimumSubtotalCents !== undefined
                          ? formatCurrency(coupon.minimumSubtotalCents)
                          : 'None'}
                      </div>
                    </div>
                    <div>
                      <div className='text-xs uppercase tracking-[0.18em] text-foreground/45'>
                        Max discount
                      </div>
                      <div>
                        {coupon.maximumDiscountCents !== undefined
                          ? formatCurrency(coupon.maximumDiscountCents)
                          : coupon.discountType === 'percentage'
                            ? 'Unlimited'
                            : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className='text-xs uppercase tracking-[0.18em] text-foreground/45'>
                        Usage
                      </div>
                      <div>
                        {coupon.timesRedeemed}
                        {coupon.usageLimit !== undefined
                          ? ` / ${coupon.usageLimit}`
                          : ' / unlimited'}
                      </div>
                    </div>
                    <div>
                      <div className='text-xs uppercase tracking-[0.18em] text-foreground/45'>
                        Starts
                      </div>
                      <div>
                        {coupon.startsAt !== undefined
                          ? new Date(coupon.startsAt).toLocaleString()
                          : 'Immediately'}
                      </div>
                    </div>
                    <div>
                      <div className='text-xs uppercase tracking-[0.18em] text-foreground/45'>
                        Expires
                      </div>
                      <div>
                        {coupon.expiresAt !== undefined
                          ? new Date(coupon.expiresAt).toLocaleString()
                          : 'Never'}
                      </div>
                    </div>
                    <div>
                      <div className='text-xs uppercase tracking-[0.18em] text-foreground/45'>
                        Per user limit
                      </div>
                      <div>{coupon.perUserLimit ?? 'Unlimited'}</div>
                    </div>
                    <div>
                      <div className='text-xs uppercase tracking-[0.18em] text-foreground/45'>
                        Stackable
                      </div>
                      <div>{coupon.stackable ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  {coupon.notes && (
                    <div className='rounded-xl bg-background/50 px-3 py-2 text-sm text-foreground/65'>
                      {coupon.notes}
                    </div>
                  )}

                  <div className='flex flex-wrap gap-2'>
                    <Button
                      size='sm'
                      variant='tertiary'
                      className='rounded-sm'
                      isDisabled={isBusy}
                      onPress={() =>
                        openEditModal(coupon as Coupon & {_id: string})
                      }>
                      Edit
                    </Button>
                    <Button
                      size='sm'
                      variant={coupon.enabled ? 'secondary' : 'primary'}
                      className='rounded-sm'
                      isDisabled={isBusy}
                      onPress={() =>
                        handleToggleEnabled(coupon as Coupon & {_id: string})
                      }>
                      {isBusy
                        ? 'Working...'
                        : coupon.enabled
                          ? 'Disable'
                          : 'Enable'}
                    </Button>
                    <Button
                      size='sm'
                      variant='danger'
                      className='rounded-sm'
                      isDisabled={isBusy}
                      onPress={() =>
                        handleDelete(coupon as Coupon & {_id: string})
                      }>
                      {isBusy ? 'Working...' : 'Delete'}
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onOpenChange={(open) => {
          if (open) {
            setModalOpen(true)
            return
          }

          closeModal()
        }}>
        <Modal.Backdrop>
          <Modal.Container size='lg' scroll='inside'>
            <Modal.Dialog className='max-w-4xl overflow-hidden rounded-2xl'>
              <Modal.Header className='border-b border-default-200 pb-4'>
                {editingCouponId ? 'Edit coupon' : 'Create coupon'}
              </Modal.Header>
              <Modal.Body className='gap-4 py-6'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <Input
                    label='Coupon code'
                    value={form.code}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                  <Input
                    label='Internal name'
                    value={form.name}
                    onChange={(e) =>
                      setForm((current) => ({...current, name: e.target.value}))
                    }
                  />
                  <Select
                    label='Discount type'
                    value={form.discountType}
                    onChange={(next) => {
                      if (!next) return
                      setForm((current) => ({
                        ...current,
                        discountType: next as CouponDiscountType,
                      }))
                    }}
                    options={discountTypeOptions.map((option) => ({
                      value: option.key,
                      label: option.label,
                    }))}
                  />
                  <Input
                    label={
                      form.discountType === 'percentage'
                        ? 'Discount percent'
                        : 'Discount amount ($)'
                    }
                    type='number'
                    step={form.discountType === 'percentage' ? 0.1 : 0.01}
                    value={form.discountValue}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        discountValue: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label='Minimum subtotal ($)'
                    type='number'
                    step={0.01}
                    value={form.minimumSubtotalDollars}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        minimumSubtotalDollars: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label='Max discount ($)'
                    type='number'
                    step={0.01}
                    value={form.maximumDiscountDollars}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        maximumDiscountDollars: e.target.value,
                      }))
                    }
                    disabled={form.discountType !== 'percentage'}
                  />
                  <Input
                    label='Starts at'
                    type='datetime-local'
                    value={form.startsAt}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        startsAt: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label='Expires at'
                    type='datetime-local'
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        expiresAt: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label='Usage limit'
                    type='number'
                    min={1}
                    step={1}
                    value={form.usageLimit}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        usageLimit: e.target.value,
                      }))
                    }
                  />
                  <Input
                    label='Per-user limit'
                    type='number'
                    min={1}
                    step={1}
                    value={form.perUserLimit}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        perUserLimit: e.target.value,
                      }))
                    }
                  />
                </div>

                <TextArea
                  value={form.description}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                  placeholder='Description (optional)'
                />
                <TextArea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((current) => ({...current, notes: e.target.value}))
                  }
                  rows={2}
                  placeholder='Internal notes (optional)'
                />

                <div className='flex flex-wrap gap-6'>
                  <Switch
                    isSelected={form.enabled}
                    onChange={(value) =>
                      setForm((current) => ({...current, enabled: value}))
                    }>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Switch.Content>Enabled</Switch.Content>
                  </Switch>
                  <Switch
                    isSelected={form.stackable}
                    onChange={(value) =>
                      setForm((current) => ({...current, stackable: value}))
                    }>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Switch.Content>
                      Stackable with other discounts
                    </Switch.Content>
                  </Switch>
                </div>

                {formError && (
                  <div className='text-sm text-danger'>{formError}</div>
                )}
              </Modal.Body>
              <Modal.Footer className='border-t border-default-200 pt-4'>
                <Button variant='tertiary' onPress={closeModal}>
                  Cancel
                </Button>
                <Button
                  variant='primary'
                  onPress={handleSave}
                  isDisabled={isSaving}>
                  {isSaving
                    ? 'Saving...'
                    : editingCouponId
                      ? 'Save changes'
                      : 'Create coupon'}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}
