'use client'

import {Input, TextArea} from '@/components/hero-v3/input'
import {Select} from '@/components/hero-v3/select'
import {api} from '@/convex/_generated/api'
import type {Doc, Id} from '@/convex/_generated/dataModel'
import type {Coupon, CouponDiscountType} from '@/convex/coupons/d'
import {useAuthCtx} from '@/ctx/auth'
import {cn} from '@/lib/utils'
import {Button, Card, Chip, Label, Modal} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {Toggle} from '../../_components/ui/toggle'
import {ContentHeader, PrimaryButton} from './components'

type CouponDoc = Doc<'coupons'>

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

function formatDateTime(value: number | undefined, fallback: string) {
  if (value === undefined) return fallback
  return new Date(value).toLocaleString()
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
  setEditingCouponId: (value: Id<'coupons'> | null) => void,
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

function CouponTitleButton({
  coupon,
  isSelected,
  now,
  onSelect,
}: {
  coupon: CouponDoc
  isSelected: boolean
  now: number
  onSelect: (id: Id<'coupons'>) => void
}) {
  const status = getCouponStatus(coupon, now)

  return (
    <button
      type='button'
      role='option'
      aria-selected={isSelected}
      onClick={() => onSelect(coupon._id)}
      className={cn(
        'flex w-full min-w-0 flex-col gap-2 rounded-sm border px-3 py-3 text-left transition-colors',
        isSelected
          ? 'border-foreground/40 bg-foreground text-background shadow-sm'
          : 'border-transparent bg-transparent hover:border-default-300 hover:bg-default-100/70',
      )}
    >
      <span className='flex min-w-0 items-start justify-between gap-3'>
        <span className='min-w-0'>
          <span className='block truncate text-sm font-semibold'>
            {coupon.name}
          </span>
          <span
            className={cn(
              'mt-1 block truncate font-mono text-[11px] uppercase tracking-[0.14em]',
              isSelected ? 'text-background/70' : 'text-foreground/50',
            )}
          >
            {coupon.code}
          </span>
        </span>
        <Chip
          size='sm'
          color={status.color}
          variant={isSelected ? 'secondary' : 'tertiary'}
          className='shrink-0'
        >
          {status.label}
        </Chip>
      </span>
      <span
        className={cn(
          'text-xs',
          isSelected ? 'text-background/70' : 'text-foreground/55',
        )}
      >
        {getCouponDiscountLabel(coupon)}
      </span>
    </button>
  )
}

function CouponDetailItem({label, value}: {label: string; value: ReactNode}) {
  return (
    <div className='min-w-0 border-b border-default-200/70 pb-3'>
      <div className='text-xs uppercase tracking-[0.18em] text-foreground/45'>
        {label}
      </div>
      <div className='mt-1 wrap-break-word text-sm text-foreground/80'>
        {value}
      </div>
    </div>
  )
}

function CouponDetailsPanel({
  coupon,
  isBusy,
  now,
  onDelete,
  onEdit,
  onToggleEnabled,
}: {
  coupon: CouponDoc
  isBusy: boolean
  now: number
  onDelete: (coupon: CouponDoc) => void
  onEdit: (coupon: CouponDoc) => void
  onToggleEnabled: (coupon: CouponDoc) => void
}) {
  const status = getCouponStatus(coupon, now)

  return (
    <Card className='min-w-0 overflow-hidden rounded-sm border border-border/50 bg-default-100/40 shadow-none'>
      <Card.Content className='p-0'>
        <div className='flex flex-col gap-4 border-b border-default-200/70 p-5 lg:flex-row lg:items-start lg:justify-between'>
          <div className='min-w-0 space-y-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <Chip color={status.color} variant='secondary'>
                {status.label}
              </Chip>
              <Chip variant='tertiary'>{getCouponDiscountLabel(coupon)}</Chip>
            </div>
            <div>
              <h3 className='wrap-break-word text-xl font-semibold text-foreground'>
                {coupon.name}
              </h3>
              <div className='mt-1 wrap-break-word font-mono text-sm uppercase tracking-[0.16em] text-foreground/55'>
                {coupon.code}
              </div>
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Button
              size='sm'
              variant='tertiary'
              className='rounded-sm'
              isDisabled={isBusy}
              onPress={() => onEdit(coupon)}
            >
              Edit
            </Button>
            <Button
              size='sm'
              variant={coupon.enabled ? 'tertiary' : 'ghost'}
              className='rounded-sm'
              isDisabled={isBusy}
              onPress={() => onToggleEnabled(coupon)}
            >
              {isBusy ? 'Working...' : coupon.enabled ? 'Disable' : 'Enable'}
            </Button>
            <Button
              size='sm'
              variant='danger'
              className='rounded-sm'
              isDisabled={isBusy}
              onPress={() => onDelete(coupon)}
            >
              {isBusy ? 'Working...' : 'Delete'}
            </Button>
          </div>
        </div>

        <div className='flex flex-col gap-5 p-5'>
          {coupon.description && (
            <div className='border-l-2 border-default-300 pl-3 text-sm text-foreground/70'>
              <div className='mb-1 text-xs uppercase tracking-[0.18em] text-foreground/45'>
                Description
              </div>
              {coupon.description}
            </div>
          )}

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            <CouponDetailItem
              label='Discount type'
              value={
                coupon.discountType === 'percentage'
                  ? 'Percentage'
                  : 'USD amount'
              }
            />
            <CouponDetailItem
              label='Discount value'
              value={getCouponDiscountLabel(coupon)}
            />
            <CouponDetailItem
              label='Minimum subtotal'
              value={
                coupon.minimumSubtotalCents !== undefined
                  ? formatCurrency(coupon.minimumSubtotalCents)
                  : 'None'
              }
            />
            <CouponDetailItem
              label='Maximum discount'
              value={
                coupon.maximumDiscountCents !== undefined
                  ? formatCurrency(coupon.maximumDiscountCents)
                  : coupon.discountType === 'percentage'
                    ? 'Unlimited'
                    : 'N/A'
              }
            />
            <CouponDetailItem
              label='Times redeemed'
              value={coupon.timesRedeemed}
            />
            <CouponDetailItem
              label='Usage limit'
              value={coupon.usageLimit ?? 'Unlimited'}
            />
            <CouponDetailItem
              label='Per-user limit'
              value={coupon.perUserLimit ?? 'Unlimited'}
            />
            <CouponDetailItem
              label='Starts'
              value={formatDateTime(coupon.startsAt, 'Immediately')}
            />
            <CouponDetailItem
              label='Expires'
              value={formatDateTime(coupon.expiresAt, 'Never')}
            />
            <CouponDetailItem
              label='Enabled'
              value={coupon.enabled ? 'Yes' : 'No'}
            />
            <CouponDetailItem
              label='Stackable'
              value={coupon.stackable ? 'Yes' : 'No'}
            />
            <CouponDetailItem
              label='Created'
              value={formatDateTime(coupon.createdAt, 'Unknown')}
            />
            <CouponDetailItem
              label='Updated'
              value={formatDateTime(coupon.updatedAt, 'Unknown')}
            />
            <CouponDetailItem
              label='Updated by'
              value={coupon.updatedBy ?? 'Not recorded'}
            />
          </div>

          {coupon.notes && (
            <div className='border-l-2 border-default-300 pl-3 text-sm text-foreground/70'>
              <div className='mb-1 text-xs uppercase tracking-[0.18em] text-foreground/45'>
                Internal notes
              </div>
              {coupon.notes}
            </div>
          )}
        </div>
      </Card.Content>
    </Card>
  )
}

export const CouponsContent = () => {
  const {user} = useAuthCtx()
  const coupons = useQuery(api.coupons.q.listCoupons)
  const createCoupon = useMutation(api.coupons.m.createCoupon)
  const updateCoupon = useMutation(api.coupons.m.updateCoupon)
  const deleteCoupon = useMutation(api.coupons.m.deleteCoupon)
  const setCouponEnabled = useMutation(api.coupons.m.setCouponEnabled)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCouponId, setEditingCouponId] = useState<Id<'coupons'> | null>(
    null,
  )
  const [selectedCouponId, setSelectedCouponId] =
    useState<Id<'coupons'> | null>(null)
  const [form, setForm] = useState<CouponFormState>(emptyCouponForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [busyCouponId, setBusyCouponId] = useState<Id<'coupons'> | null>(null)
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

  const selectedCoupon = useMemo(() => {
    if (coupons === undefined || coupons.length === 0) return null
    return (
      coupons.find((coupon) => coupon._id === selectedCouponId) ?? coupons[0]
    )
  }, [coupons, selectedCouponId])

  const openCreateModal = () => {
    setEditingCouponId(null)
    setForm(emptyCouponForm())
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (coupon: CouponDoc) => {
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
    if (editingCouponId) {
      const id = editingCouponId
      startTransition(() => {
        updateCoupon({
          id,
          coupon: payload.coupon,
          updatedBy: user?.uid,
        })
          .then(() => {
            setSelectedCouponId(id)
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
      return
    }

    startTransition(() => {
      createCoupon({
        coupon: payload.coupon,
        updatedBy: user?.uid,
      })
        .then((createdId) => {
          setSelectedCouponId(createdId)
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

  const handleToggleEnabled = (coupon: CouponDoc) => {
    setBusyCouponId(coupon._id)
    startTransition(() => {
      setCouponEnabled({
        id: coupon._id,
        enabled: !coupon.enabled,
        updatedBy: user?.uid,
      })
        .catch(() => {})
        .finally(() => setBusyCouponId(null))
    })
  }

  const handleDelete = (coupon: CouponDoc) => {
    const confirmed = window.confirm(`Delete coupon "${coupon.code}"?`)
    if (!confirmed) return

    setBusyCouponId(coupon._id)
    startTransition(() => {
      deleteCoupon({id: coupon._id})
        .then(() => {
          setSelectedCouponId((current) =>
            current === coupon._id ? null : current,
          )
        })
        .catch(() => {})
        .finally(() => setBusyCouponId(null))
    })
  }

  return (
    <div className='flex w-full flex-col gap-4'>
      <ContentHeader
        title='Coupon Code Manager'
        description='Create and control promo codes, timing windows, and discount rules from one place.'
      >
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
        <Card className='rounded-sm border border-border/50 bg-default-100/40 shadow-none'>
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
                className='rounded-sm bg-black text-white dark:bg-white dark:text-dark-table'
              >
                Create first coupon
              </Button>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <div className='grid min-h-128 gap-4 lg:grid-cols-[minmax(14rem,19rem)_minmax(0,1fr)]'>
          <Card className='min-w-0 overflow-hidden rounded-sm border border-border/50 bg-default-100/40 shadow-none'>
            <Card.Content className='p-0'>
              <div className='border-b border-default-200/70 px-4 py-3'>
                <div className='text-sm font-semibold text-foreground'>
                  Coupons
                </div>
                <div className='mt-1 text-xs text-foreground/50'>
                  Select a coupon to view its settings.
                </div>
              </div>
              <div
                role='listbox'
                aria-label='Coupon titles'
                className='flex max-h-[min(68vh,44rem)] flex-col gap-2 overflow-y-auto p-2'
              >
                {coupons.map((coupon) => (
                  <CouponTitleButton
                    key={coupon._id}
                    coupon={coupon}
                    isSelected={coupon._id === selectedCoupon?._id}
                    now={now}
                    onSelect={setSelectedCouponId}
                  />
                ))}
              </div>
            </Card.Content>
          </Card>

          {selectedCoupon && (
            <CouponDetailsPanel
              coupon={selectedCoupon}
              isBusy={busyCouponId === selectedCoupon._id}
              now={now}
              onDelete={handleDelete}
              onEdit={openEditModal}
              onToggleEnabled={handleToggleEnabled}
            />
          )}
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
        }}
      >
        <Modal.Backdrop>
          <Modal.Container size='lg' scroll='inside'>
            <Modal.Dialog className='max-w-4xl overflow-hidden rounded-2xl'>
              <Modal.Header>
                {editingCouponId ? 'Edit coupon' : 'Create coupon'}
              </Modal.Header>
              <Modal.Body className='gap-4 py-4'>
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

                <div className='flex flex-col justify-start gap-4 py-4 md:flex-row md:items-center'>
                  <div className='flex w-full flex-col space-y-2 text-left'>
                    <TextArea
                      id='description'
                      label='Description (optional)'
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
                  </div>
                  <div className='flex w-full flex-col space-y-2'>
                    <TextArea
                      id='notes'
                      label='Internal notes (optional)'
                      value={form.notes}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          notes: e.target.value,
                        }))
                      }
                      rows={2}
                      placeholder='Internal notes (optional)'
                    />
                  </div>
                </div>
                <div className='flex flex-wrap gap-6'>
                  <div className='flex items-center space-x-2'>
                    <Label htmlFor='enabled'>Enabled</Label>
                    <Toggle
                      id='enabled'
                      title='Enabled'
                      checked={form.enabled}
                      onChange={(value) =>
                        setForm((current) => ({...current, enabled: value}))
                      }
                    />
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Label htmlFor='stackable'>Stackable</Label>
                    <Toggle
                      title='Stackable'
                      checked={form.stackable}
                      onChange={(value) =>
                        setForm((current) => ({...current, stackable: value}))
                      }
                    />
                  </div>
                </div>

                {formError && (
                  <div className='text-sm text-danger'>{formError}</div>
                )}
              </Modal.Body>
              <Modal.Footer className='border-t border-default-200 pt-4'>
                <Button variant='ghost' onPress={closeModal}>
                  Cancel
                </Button>
                <Button
                  variant='primary'
                  onPress={handleSave}
                  isDisabled={isSaving}
                  className='bg-dark-table dark:bg-white text-background rounded-md'
                >
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
