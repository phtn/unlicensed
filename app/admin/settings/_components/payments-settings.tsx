'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Icon, type IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Input, Switch} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {
  startTransition,
  useCallback,
  useMemo,
  useState,
  ViewTransition,
} from 'react'
import {ContentHeader} from './components'

export type PaymentMethodStatus = 'active' | 'inactive'

export interface PaymentMethodRow {
  id: string
  name: string
  label: string
  icon: IconName
  description: string
  status: PaymentMethodStatus
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

function getInitialFeeEnabled(setting: unknown) {
  if (
    setting &&
    typeof setting === 'object' &&
    !('error' in setting) &&
    'enabled' in setting &&
    typeof setting.enabled === 'boolean'
  ) {
    return setting.enabled
  }

  return false
}

interface CardsProcessingFeeFieldProps {
  value: string
  onChange: (value: string) => void
  enabled: boolean
  onEnabledChange: (value: boolean) => void
  onSave: VoidFunction
  isDisabled: boolean
  isSaving: boolean
  saveMessage: null | 'saved' | 'error'
}

function CardsProcessingFeeField({
  value,
  onChange,
  enabled,
  onEnabledChange,
  onSave,
  isDisabled,
  isSaving,
  saveMessage,
}: CardsProcessingFeeFieldProps) {
  return (
    <div className='flex min-w-0 flex-col gap-4 md:min-w-64 md:max-w-72'>
      <Input
        label='Processing fee (%)'
        type='number'
        min={0}
        step={0.01}
        value={value}
        onValueChange={onChange}
        classNames={commonInputClassNames}
        isDisabled={isDisabled || !enabled}
      />
      <div className='flex items-center gap-4'>
        <Switch
          isSelected={enabled}
          onValueChange={onEnabledChange}
          isDisabled={isDisabled}
          size='sm'>
          Enable
        </Switch>
        <Button
          radius='none'
          color='default'
          variant='flat'
          fullWidth
          onPress={onSave}
          isDisabled={isDisabled}
          className='rounded-sm'
          isLoading={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
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
    </div>
  )
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
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [cardsFeeDraft, setCardsFeeDraft] = useState<string | null>(null)
  const [cardsFeeEnabledDraft, setCardsFeeEnabledDraft] = useState<
    boolean | null
  >(null)
  const [isSavingCardsFee, setIsSavingCardsFee] = useState(false)
  const [cardsFeeMessage, setCardsFeeMessage] = useState<
    null | 'saved' | 'error'
  >(null)

  const paymentMethods = useMemo(() => {
    const methods = ((setting && setting)?.methods as PaymentMethodRow[]) ?? []
    if (methods && methods.length > 0) {
      return methods.map((m) => ({
        id: m.id,
        name: m.name ?? m.label ?? m.id,
        label: m.label ?? m.name ?? m.id,
        icon: (m.icon ?? 'credit-card') as IconName,
        description: m.description ?? '',
        status:
          m.status === 'active' || m.status === 'inactive'
            ? m.status
            : 'inactive',
      }))
    }
    return []
  }, [setting])
  const hasCardsMethod = useMemo(
    () => paymentMethods.some((method) => method.id === 'cards'),
    [paymentMethods],
  )
  const cardsFeePercent =
    cardsFeeDraft ?? getInitialFeeValue(cardsProcessingFeeSetting)
  const cardsFeeEnabled =
    cardsFeeEnabledDraft ?? getInitialFeeEnabled(cardsProcessingFeeSetting)

  const handleToggle = useCallback(
    (methodId: string, nextStatus: PaymentMethodStatus) => {
      setTogglingId(methodId)
      const nextMethods: PaymentMethodRow[] = paymentMethods.map((m) =>
        m.id === methodId ? {...m, status: nextStatus} : m,
      )
      startTransition(() => {
        updateAdmin({
          identifier: 'payment_methods',
          value: {methods: nextMethods},
          uid: user?.uid ?? 'anonymous',
        })
          .then(() => setTogglingId(null))
          .catch(() => setTogglingId(null))
      })
    },
    [paymentMethods, updateAdmin, user?.uid],
  )

  const handleSaveCardsFee = useCallback(() => {
    const percent = parseFloat(cardsFeePercent || '0')
    if (Number.isNaN(percent) || percent < 0) return

    setIsSavingCardsFee(true)
    setCardsFeeMessage(null)
    startTransition(() => {
      updateAdmin({
        identifier: 'cards_processing_fee',
        value: {percent, enabled: cardsFeeEnabled},
        uid: user?.uid ?? 'anonymous',
      })
        .then(() => {
          setIsSavingCardsFee(false)
          setCardsFeeDraft(String(percent))
          setCardsFeeEnabledDraft(cardsFeeEnabled)
          setCardsFeeMessage('saved')
          setTimeout(() => setCardsFeeMessage(null), 2000)
        })
        .catch(() => {
          setIsSavingCardsFee(false)
          setCardsFeeMessage('error')
        })
    })
  }, [cardsFeeEnabled, cardsFeePercent, updateAdmin, user?.uid])

  return (
    <div className='flex w-full flex-col gap-4'>
      <ContentHeader title='Payments Methods' />

      <section className='grid gap-6 md:grid-cols-3'>
        <div className='space-y-3 min-w-0'>
          <ul className='flex flex-col gap-1 rounded-3xl' role='list'>
            {paymentMethods.map((method) => (
              <ViewTransition key={method.id}>
                <li
                  className={cn(
                    'flex items-center gap-4 rounded-2xl border border-border/50 bg-default-100/50 px-4 py-3 transition-colors dark:bg-default-100/30',
                    'hover:border-border/80 dark:hover:border-border/60',
                  )}
                  role='listitem'>
                  <div className='flex min-w-0 flex-1 items-start gap-4'>
                    <div
                      className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/10 dark:bg-foreground/15'
                      aria-hidden>
                      <Icon
                        name={method.icon}
                        className='size-5 text-foreground/80'
                        aria-hidden
                      />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='font-okxs font-medium text-foreground'>
                        {method.name}
                      </div>
                      {method.description && (
                        <div className='font-okxs text-xs text-foreground/60'>
                          {method.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <span
                      className={cn(
                        'font-okxs text-xs tabular-nums',
                        method.status === 'active'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-foreground/50',
                      )}
                      aria-hidden>
                      {method.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    <Switch
                      size='sm'
                      isSelected={method.status === 'active'}
                      isDisabled={togglingId === method.id}
                      onValueChange={(checked) =>
                        handleToggle(method.id, checked ? 'active' : 'inactive')
                      }
                      color={method.status === 'active' ? 'success' : 'default'}
                      classNames={{
                        base: 'shrink-0',
                        wrapper:
                          'group-data-[selected=true]:bg-emerald-500 dark:group-data-[selected=true]:bg-emerald-500',
                      }}
                      aria-label={`Toggle ${method.name} to ${method.status === 'active' ? 'inactive' : 'active'}`}
                    />
                  </div>
                </li>
              </ViewTransition>
            ))}
          </ul>
        </div>

        {hasCardsMethod ? (
          <div className='rounded-2xl border border-border/50 bg-default-100/50 p-4 dark:bg-default-100/30 h-fit'>
            <div className='mb-4'>
              <div className='font-okxs font-medium text-foreground'>
                Cards Processing Fee
              </div>
              <div className='font-okxs text-xs text-foreground/60'>
                Applied to card payments at checkout.
              </div>
            </div>
            <CardsProcessingFeeField
              value={cardsFeePercent}
              onChange={setCardsFeeDraft}
              enabled={cardsFeeEnabled}
              onEnabledChange={setCardsFeeEnabledDraft}
              onSave={handleSaveCardsFee}
              isDisabled={
                isSavingCardsFee ||
                cardsProcessingFeeSetting === undefined ||
                !user?.uid
              }
              isSaving={isSavingCardsFee}
              saveMessage={cardsFeeMessage}
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}
