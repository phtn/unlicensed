'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {SectionHeader} from '@/components/ui/section-header'
import {api} from '@/convex/_generated/api'
import type {Coupon, CouponDiscountType} from '@/convex/coupons/d'
import {useAuthCtx} from '@/ctx/auth'
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Switch,
  Textarea,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {startTransition, useEffect, useMemo, useState} from 'react'

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
    return {label: 'Scheduled', color: 'secondary' as const}
  }
  if (coupon.expiresAt !== undefined && coupon.expiresAt <= now) {
    return {label: 'Expired', color: 'danger' as const}
  }
  return {label: 'Active', color: 'success' as const}
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
          setModalOpen(false)
          setEditingCouponId(null)
          setForm(emptyCouponForm())
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
      <SectionHeader
        title='Coupon Code Manager'
        description='Create and control promo codes, timing windows, and discount rules from one place.'>
        <div className='flex items-center justify-end gap-2'>
          <Button
            color='primary'
            onPress={openCreateModal}
            className='rounded-sm bg-black text-white dark:bg-white dark:text-dark-table'>
            Add coupon
          </Button>
        </div>
      </SectionHeader>

      <div className='flex flex-wrap gap-2'>
        <Chip variant='flat'>Total {counts.total}</Chip>
        <Chip variant='flat' color='default'>
          Active {counts.active}
        </Chip>
        <Chip variant='flat' color='primary'>
          Scheduled {counts.scheduled}
        </Chip>
        <Chip variant='flat' color='default'>
          Expired {counts.expired}
        </Chip>
      </div>

      {coupons === undefined ? (
        <div className='text-sm text-foreground/60'>Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <Card className='border border-border/50 bg-default-100/40 shadow-none'>
          <CardBody className='flex flex-col gap-3 p-6'>
            <div className='text-lg font-clash'>No coupon codes yet</div>
            <p className='text-sm text-foreground/60'>
              Start with a simple percentage or dollar-off offer, then layer in
              limits and expiry when you need them.
            </p>
            <div>
              <Button
                color='default'
                radius='none'
                onPress={openCreateModal}
                className='rounded-sm bg-black text-white dark:bg-white dark:text-dark-table'>
                Create first coupon
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className='grid gap-4 xl:grid-cols-2'>
          {coupons.map((coupon) => {
            const status = getCouponStatus(coupon, now)
            return (
              <Card
                key={coupon._id}
                className='border border-border/50 bg-default-100/40 shadow-none'>
                <CardBody className='flex flex-col gap-4 p-5'>
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
                      <Chip
                        color={coupon.enabled ? 'success' : 'default'}
                        variant='bordered'>
                        {status.label ? 'Enabled' : 'Disabled'}
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
                      variant='flat'
                      className='rounded-sm'
                      onPress={() =>
                        openEditModal(coupon as Coupon & {_id: string})
                      }>
                      Edit
                    </Button>
                    <Button
                      size='sm'
                      variant='flat'
                      className='rounded-sm'
                      color={coupon.enabled ? 'default' : 'success'}
                      isLoading={busyCouponId === coupon._id}
                      onPress={() =>
                        handleToggleEnabled(coupon as Coupon & {_id: string})
                      }>
                      {coupon.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      size='sm'
                      variant='flat'
                      radius='none'
                      color='danger'
                      className='rounded-sm'
                      isLoading={busyCouponId === coupon._id}
                      onPress={() =>
                        handleDelete(coupon as Coupon & {_id: string})
                      }>
                      Delete
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onOpenChange={setModalOpen} size='4xl'>
        <ModalContent>
          <ModalHeader>
            {editingCouponId ? 'Edit coupon' : 'Create coupon'}
          </ModalHeader>
          <ModalBody className='gap-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <Input
                label='Coupon code'
                value={form.code}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    code: value.toUpperCase(),
                  }))
                }
                classNames={commonInputClassNames}
                description='Example: SPRING20'
              />
              <Input
                label='Internal name'
                value={form.name}
                onValueChange={(value) =>
                  setForm((current) => ({...current, name: value}))
                }
                classNames={commonInputClassNames}
                description='How admins will recognize this offer'
              />
              <Select
                label='Discount type'
                selectedKeys={[form.discountType]}
                onSelectionChange={(keys) => {
                  const next = Array.from(keys)[0] as CouponDiscountType
                  if (!next) return
                  setForm((current) => ({...current, discountType: next}))
                }}
                classNames={{
                  label: commonInputClassNames.label,
                  trigger: commonInputClassNames.inputWrapper,
                  value: commonInputClassNames.input,
                }}>
                {discountTypeOptions.map((option) => (
                  <SelectItem key={option.key}>{option.label}</SelectItem>
                ))}
              </Select>
              <Input
                label={
                  form.discountType === 'percentage'
                    ? 'Discount percent'
                    : 'Discount amount ($)'
                }
                type='number'
                min={0}
                step={form.discountType === 'percentage' ? 0.1 : 0.01}
                value={form.discountValue}
                onValueChange={(value) =>
                  setForm((current) => ({...current, discountValue: value}))
                }
                classNames={commonInputClassNames}
              />
              <Input
                label='Minimum subtotal ($)'
                type='number'
                min={0}
                step={0.01}
                value={form.minimumSubtotalDollars}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    minimumSubtotalDollars: value,
                  }))
                }
                classNames={commonInputClassNames}
              />
              <Input
                label='Max discount ($)'
                type='number'
                min={0}
                step={0.01}
                value={form.maximumDiscountDollars}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    maximumDiscountDollars: value,
                  }))
                }
                classNames={commonInputClassNames}
                isDisabled={form.discountType !== 'percentage'}
                description='Optional cap for percentage discounts'
              />
              <Input
                label='Starts at'
                type='datetime-local'
                value={form.startsAt}
                onValueChange={(value) =>
                  setForm((current) => ({...current, startsAt: value}))
                }
                classNames={commonInputClassNames}
              />
              <Input
                label='Expires at'
                type='datetime-local'
                value={form.expiresAt}
                onValueChange={(value) =>
                  setForm((current) => ({...current, expiresAt: value}))
                }
                classNames={commonInputClassNames}
              />
              <Input
                label='Usage limit'
                type='number'
                min={1}
                step={1}
                value={form.usageLimit}
                onValueChange={(value) =>
                  setForm((current) => ({...current, usageLimit: value}))
                }
                classNames={commonInputClassNames}
                description='Leave blank for unlimited'
              />
              <Input
                label='Per-user limit'
                type='number'
                min={1}
                step={1}
                value={form.perUserLimit}
                onValueChange={(value) =>
                  setForm((current) => ({...current, perUserLimit: value}))
                }
                classNames={commonInputClassNames}
                description='Leave blank for unlimited'
              />
            </div>

            <Textarea
              label='Description'
              value={form.description}
              onValueChange={(value) =>
                setForm((current) => ({...current, description: value}))
              }
              minRows={2}
              classNames={commonInputClassNames}
            />
            <Textarea
              label='Internal notes'
              value={form.notes}
              onValueChange={(value) =>
                setForm((current) => ({...current, notes: value}))
              }
              minRows={2}
              classNames={commonInputClassNames}
            />

            <div className='flex flex-wrap gap-6'>
              <Switch
                isSelected={form.enabled}
                onValueChange={(value) =>
                  setForm((current) => ({...current, enabled: value}))
                }>
                Enabled
              </Switch>
              <Switch
                isSelected={form.stackable}
                onValueChange={(value) =>
                  setForm((current) => ({...current, stackable: value}))
                }>
                Stackable with other discounts
              </Switch>
            </div>

            {formError && (
              <div className='text-sm text-danger'>{formError}</div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant='light' onPress={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button color='primary' onPress={handleSave} isLoading={isSaving}>
              {editingCouponId ? 'Save changes' : 'Create coupon'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
