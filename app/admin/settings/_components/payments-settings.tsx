'use client'

import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Icon, type IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Input, Modal, TextArea} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useEffect, useMemo, useState} from 'react'
import {Toggle} from '../../_components/ui/toggle'
import {ContentHeader} from './components'

export type PaymentMethodStatus = 'active' | 'inactive'

export interface PaymentMethodRow {
  id: string
  name: string
  label: string
  icon: IconName
  description: string
  status: PaymentMethodStatus
  transactionFee?: number
}

type PaymentMethodDraft = {
  active: boolean
  description: string
  label: string
  transactionFee: string
}

const DEFAULT_CARDS_PROCESSING_FEE = '0'

function getInitialFeeValue(setting: unknown) {
  if (setting && typeof setting === 'object' && 'error' in setting) {
    return DEFAULT_CARDS_PROCESSING_FEE
  }

  if (typeof setting === 'number' && Number.isFinite(setting)) {
    return String(setting)
  }

  if (setting && typeof setting === 'object') {
    const value = setting as {percent?: unknown; feePercent?: unknown}
    if (typeof value.percent === 'number' && Number.isFinite(value.percent)) {
      return String(value.percent)
    }
    if (
      typeof value.feePercent === 'number' &&
      Number.isFinite(value.feePercent)
    ) {
      return String(value.feePercent)
    }
  }

  return DEFAULT_CARDS_PROCESSING_FEE
}

function getPaymentMethodFee(method: PaymentMethodRow, cardsSetting: unknown) {
  if (
    typeof method.transactionFee === 'number' &&
    Number.isFinite(method.transactionFee)
  ) {
    return String(method.transactionFee)
  }

  if (method.id === 'cards') {
    return getInitialFeeValue(cardsSetting)
  }

  return ''
}

function formatFeeLabel(fee: number | undefined) {
  if (typeof fee !== 'number' || !Number.isFinite(fee)) {
    return null
  }

  return `${fee.toFixed(fee % 1 === 0 ? 0 : 2)}% fee`
}

export const PaymentsSettings = () => {
  const {user} = useAuthCtx()
  const setting = useQuery(api.admin.q.getAdminByIdentStrict, {
    identifier: 'payment_methods',
  })
  const cardsProcessingFeeSetting = useQuery(
    api.admin.q.getAdminByIdentStrict,
    {
      identifier: 'cards_processing_fee',
    },
  )
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PaymentMethodDraft | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const paymentMethods = useMemo(() => {
    const methods = ((setting && setting)?.methods as PaymentMethodRow[]) ?? []

    return methods.map((method) => ({
      id: method.id,
      name: method.name ?? method.label ?? method.id,
      label: method.label ?? method.name ?? method.id,
      icon: (method.icon ?? 'credit-card') as IconName,
      description: method.description ?? '',
      status:
        method.status === 'active' || method.status === 'inactive'
          ? method.status
          : 'inactive',
      transactionFee:
        typeof method.transactionFee === 'number' &&
        Number.isFinite(method.transactionFee)
          ? method.transactionFee
          : undefined,
    }))
  }, [setting])

  const editingMethod = useMemo(
    () =>
      paymentMethods.find((method) => method.id === editingMethodId) ?? null,
    [editingMethodId, paymentMethods],
  )

  useEffect(() => {
    if (!editingMethod) {
      setDraft(null)
      setErrorMessage(null)
      setIsSaving(false)
      return
    }

    setDraft({
      label: editingMethod.label,
      description: editingMethod.description,
      transactionFee: getPaymentMethodFee(
        editingMethod,
        cardsProcessingFeeSetting,
      ),
      active: editingMethod.status === 'active',
    })
    setErrorMessage(null)
    setIsSaving(false)
  }, [cardsProcessingFeeSetting, editingMethod])

  const openEditor = (methodId: string) => {
    setEditingMethodId(methodId)
  }

  const closeEditor = () => {
    setEditingMethodId(null)
  }

  const handleSaveMethod = async () => {
    if (!editingMethod || !draft) return

    const normalizedLabel = draft.label.trim()
    if (!normalizedLabel) {
      setErrorMessage('Label is required.')
      return
    }

    const normalizedDescription = draft.description.trim()
    const feeInput = draft.transactionFee.trim()
    const feeValue = feeInput.length > 0 ? Number(feeInput) : 0

    if (!Number.isFinite(feeValue) || feeValue < 0) {
      setErrorMessage(
        'Transaction fee must be a valid number greater than or equal to 0.',
      )
      return
    }

    const nextMethods = paymentMethods.map((method) =>
      method.id === editingMethod.id
        ? {
            ...method,
            label: normalizedLabel,
            description: normalizedDescription,
            status: draft.active ? 'active' : 'inactive',
            ...(feeInput.length > 0 || method.id === 'cards'
              ? {transactionFee: feeValue}
              : {}),
          }
        : method,
    )

    setIsSaving(true)
    setErrorMessage(null)

    try {
      await updateAdmin({
        identifier: 'payment_methods',
        value: {methods: nextMethods},
        uid: user?.uid ?? 'anonymous',
      })

      if (editingMethod.id === 'cards') {
        await updateAdmin({
          identifier: 'cards_processing_fee',
          value: {percent: feeValue, enabled: draft.active},
          uid: user?.uid ?? 'anonymous',
        })
      }

      closeEditor()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to save payment method.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const hasMethods = paymentMethods.length > 0

  return (
    <div className='flex w-full flex-col gap-4 px-4 md:px-0'>
      <ContentHeader title='Payment Methods' />

      <section className='grid gap-6 md:grid-cols-3'>
        <div className='space-y-3 min-w-0 md:col-span-2'>
          <ul className='flex flex-col gap-3' role='list'>
            {hasMethods ? (
              paymentMethods.map((method) => (
                <li
                  key={method.id}
                  className={cn(
                    'rounded-lg border border-sidebar bg-default-100/50 px-4 py-4 transition-colors dark:bg-default-100/30',
                    'hover:border-border/80 dark:hover:border-border/60',
                  )}
                  role='listitem'
                >
                  <div className='flex flex-col gap-4 sm:flex-row sm:items-start'>
                    <div
                      className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/10 dark:bg-foreground/15'
                      aria-hidden
                    >
                      <Icon
                        name={method.icon}
                        className='size-5 text-foreground/80'
                        aria-hidden
                      />
                    </div>
                    <div className='min-w-0 flex-1 space-y-2'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='font-okxs text-base font-medium text-foreground'>
                          {method.label}
                        </span>
                        {formatFeeLabel(method.transactionFee) ? (
                          <span className='rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-foreground/60'>
                            {formatFeeLabel(method.transactionFee)}
                          </span>
                        ) : null}
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.2em]',
                            method.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                              : 'bg-foreground/5 text-foreground/50',
                          )}
                        >
                          {method.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className='text-sm leading-6 text-foreground/60'>
                        {method.description || 'No description set.'}
                      </p>
                      <p className='text-xs uppercase tracking-[0.22em] text-foreground/35'>
                        Identifier: {method.name}
                      </p>
                    </div>
                    <div className='shrink-0'>
                      <Button
                        size='sm'
                        variant='secondary'
                        onPress={() => openEditor(method.id)}
                        className='bg-brand text-white px-4 h-7 rounded-md'
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className='rounded-2xl border border-border/50 bg-default-100/50 px-4 py-6 text-sm text-foreground/60 dark:bg-default-100/30'>
                No payment methods are configured yet.
              </li>
            )}
          </ul>
        </div>
      </section>

      <Modal
        isOpen={editingMethodId !== null}
        onOpenChange={(open) => {
          if (!open) closeEditor()
        }}
      >
        <Modal.Backdrop variant='blur'>
          <Modal.Container placement='center'>
            <Modal.Dialog className='rounded-2xl border border-sidebar bg-background/95 shadow-2xl'>
              <Modal.Header className='items-start'>
                {editingMethod ? (
                  <div className='flex items-center gap-3'>
                    <div
                      className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-foreground/10 dark:bg-foreground/15'
                      aria-hidden
                    >
                      <Icon
                        name={editingMethod.icon}
                        className='size-5 text-foreground/80'
                        aria-hidden
                      />
                    </div>
                    <div className='min-w-0'>
                      <div className='text-xs uppercase tracking-[0.22em] text-foreground/45'>
                        Edit payment method
                      </div>
                      <div className='text-lg font-semibold text-foreground'>
                        {editingMethod.label}
                      </div>
                      <div className='text-sm text-foreground/55'>
                        Identifier: {editingMethod.name}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='text-lg font-semibold text-foreground'>
                    Edit payment method
                  </div>
                )}
              </Modal.Header>

              <Modal.Body className='space-y-4 p-1'>
                <div className='space-y-2'>
                  <div className='text-xs uppercase tracking-[0.22em] text-foreground/45'>
                    Label
                  </div>
                  <Input
                    value={draft?.label ?? ''}
                    onChange={(e) =>
                      setDraft((current) =>
                        current ? {...current, label: e.target.value} : current,
                      )
                    }
                    className='w-full shadow-none rounded-sm border border-sidebar'
                  />
                </div>

                <div className='space-y-2'>
                  <div className='text-xs uppercase tracking-[0.22em] text-foreground/45'>
                    Description
                  </div>
                  <TextArea
                    value={draft?.description ?? ''}
                    onChange={(e) =>
                      setDraft((current) =>
                        current
                          ? {...current, description: e.target.value}
                          : current,
                      )
                    }
                    rows={4}
                    placeholder='Describe how this payment method should appear to customers.'
                    className='w-full shadow-none rounded-sm border border-sidebar'
                  />
                </div>

                <div className='space-y-2'>
                  <div className='text-xs uppercase tracking-[0.22em] text-foreground/45'>
                    Transaction fee (%)
                  </div>
                  <Input
                    type='number'
                    min={0}
                    step={0.01}
                    value={draft?.transactionFee ?? ''}
                    onChange={(e) =>
                      setDraft((current) =>
                        current
                          ? {...current, transactionFee: e.target.value}
                          : current,
                      )
                    }
                    className='rounded-sm shadow-none border border-sidebar'
                  />
                  <div className='text-xs text-foreground/45'>
                    Set the fee percentage shown for this payment method.
                  </div>
                </div>

                <div className='flex flex-col gap-4 rounded-2xl border border-sidebar bg-default-100/60 px-4 py-3 dark:bg-default-100/30 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='min-w-0'>
                    <div className='font-medium text-foreground'>Active</div>
                    <div className='text-sm text-foreground/55'>
                      {draft?.active
                        ? 'Visible and selectable at checkout.'
                        : 'Hidden from checkout until re-enabled.'}
                    </div>
                  </div>
                  <Toggle
                    title='Active'
                    checked={draft?.active ?? false}
                    onChange={(value) =>
                      setDraft((current) =>
                        current ? {...current, active: value} : current,
                      )
                    }
                    // isDisabled={isSaving}
                  />
                </div>

                {errorMessage ? (
                  <div className='text-sm text-danger'>{errorMessage}</div>
                ) : null}

                {editingMethod?.id === 'cards' ? (
                  <div className='rounded-2xl border border-amber-400/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground/65'>
                    Card fee changes also update the existing checkout
                    processing fee setting so payment totals stay in sync.
                  </div>
                ) : null}
              </Modal.Body>

              <Modal.Footer className='pt-4'>
                <Button
                  variant='tertiary'
                  onPress={closeEditor}
                  isDisabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant='primary'
                  onPress={handleSaveMethod}
                  isDisabled={isSaving}
                  className='bg-brand'
                >
                  {isSaving ? 'Saving…' : 'Save changes'}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}
