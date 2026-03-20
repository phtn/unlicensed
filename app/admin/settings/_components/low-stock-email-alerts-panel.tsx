'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {onError, onSuccess} from '@/ctx/toast'
import {
  LOW_STOCK_ALERTS_IDENTIFIER,
  type LowStockAlertRecipient,
  normalizeLowStockAlertsConfig,
  serializeLowStockAlertsConfig,
} from '@/lib/low-stock-alerts'
import {Icon} from '@/lib/icons'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Switch,
  Textarea,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {
  startTransition,
  type ClipboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type RecipientDraft = LowStockAlertRecipient & {rowId: number}

const formatQuantity = (value: number, unit?: string | null) => {
  const formatted = Number.isInteger(value)
    ? value.toLocaleString('en-US')
    : value.toLocaleString('en-US', {maximumFractionDigits: 6})

  return unit ? `${formatted} ${unit}` : formatted
}

const parsePastedRecipients = (text: string): LowStockAlertRecipient[] => {
  const lines = text
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean)

  return lines.map((line) => {
    const separator = line.match(/[=,:]/)
    const separatorIndex = separator ? line.indexOf(separator[0]!) : -1

    if (separatorIndex === -1) {
      if (line.includes('@')) return {name: '', email: line}
      return {name: line, email: ''}
    }

    const left = line.slice(0, separatorIndex).trim()
    const right = line.slice(separatorIndex + 1).trim()
    const hasEmailLeft = left.includes('@')
    const hasEmailRight = right.includes('@')

    if (hasEmailRight && !hasEmailLeft) return {name: left, email: right}
    if (hasEmailLeft && !hasEmailRight) return {name: right, email: left}

    return {name: left, email: right}
  })
}

const withRowId = (
  recipient: LowStockAlertRecipient,
  rowId: number,
): RecipientDraft => ({
  ...recipient,
  rowId,
})

export const LowStockEmailAlertsPanel = () => {
  const {user} = useAuthCtx()
  const setting = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: LOW_STOCK_ALERTS_IDENTIFIER,
  })
  const lowStockProducts = useQuery(api.products.q.listLowStockProducts, {
    limit: 12,
  })
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)
  const nextRowIdRef = useRef(0)
  const allocateRowId = useCallback(() => {
    const rowId = nextRowIdRef.current
    nextRowIdRef.current += 1
    return rowId
  }, [])

  const config = useMemo(
    () => normalizeLowStockAlertsConfig(setting?.value),
    [setting?.value],
  )
  const [enabled, setEnabled] = useState(config.enabled)
  const [isSaving, setIsSaving] = useState(false)
  const [recipients, setRecipients] = useState<RecipientDraft[]>(() =>
    config.recipients.map((recipient) => withRowId(recipient, allocateRowId())),
  )

  useEffect(() => {
    setEnabled(config.enabled)
    setRecipients(
      config.recipients.map((recipient) =>
        withRowId(recipient, allocateRowId()),
      ),
    )
  }, [allocateRowId, config.enabled, config.recipients])

  const normalizedDraftConfig = useMemo(
    () =>
      normalizeLowStockAlertsConfig({
        enabled,
        recipients: recipients.map((recipient) => ({
          name: recipient.name,
          email: recipient.email,
        })),
      }),
    [enabled, recipients],
  )

  const isDirty =
    JSON.stringify(serializeLowStockAlertsConfig(normalizedDraftConfig)) !==
    JSON.stringify(serializeLowStockAlertsConfig(config))

  const setRecipient = useCallback(
    (rowId: number, field: keyof LowStockAlertRecipient, value: string) => {
      setRecipients((current) =>
        current.map((recipient) =>
          recipient.rowId === rowId
            ? {...recipient, [field]: value}
            : recipient,
        ),
      )
    },
    [],
  )

  const addRecipientRow = useCallback(() => {
    setRecipients((current) => [
      ...current,
      withRowId({name: '', email: ''}, allocateRowId()),
    ])
  }, [allocateRowId])

  const removeRecipientRow = useCallback((rowId: number) => {
    setRecipients((current) =>
      current.filter((recipient) => recipient.rowId !== rowId),
    )
  }, [])

  const handlePasteRecipients = useCallback(
    (event: ClipboardEvent) => {
      const text = event.clipboardData.getData('text')
      if (!text.trim()) return

      event.preventDefault()

      const parsedRecipients = parsePastedRecipients(text)
      if (parsedRecipients.length > 0) {
        setRecipients((current) => [
          ...current,
          ...parsedRecipients.map((recipient) =>
            withRowId(recipient, allocateRowId()),
          ),
        ])
      }
    },
    [allocateRowId],
  )

  const handleSave = useCallback(() => {
    if (!user?.uid) return

    setIsSaving(true)

    startTransition(() => {
      updateAdmin({
        identifier: LOW_STOCK_ALERTS_IDENTIFIER,
        value: serializeLowStockAlertsConfig(normalizedDraftConfig),
        uid: user.uid,
      })
        .then(() => {
          onSuccess('Low stock email alerts saved')
          setIsSaving(false)
        })
        .catch((error) => {
          onError(
            error instanceof Error
              ? error.message
              : 'Failed to save low stock email alerts',
          )
          setIsSaving(false)
        })
    })
  }, [normalizedDraftConfig, updateAdmin, user?.uid])

  return (
    <Card
      shadow='none'
      className='rounded-2xl border border-divider bg-default-100/30'
    >
      <CardHeader className='flex flex-col items-start gap-4 p-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-3'>
            <h3 className='text-base font-semibold'>Low Stock Email Alerts</h3>
            <Switch isSelected={enabled} onValueChange={setEnabled} size='sm'>
              Enabled
            </Switch>
          </div>
          <p className='text-sm text-default-500'>
            Manage the internal recipients who should receive Resend alerts when
            a product reaches its configured low stock threshold.
          </p>
        </div>

        <Button
          color='primary'
          variant='solid'
          onPress={handleSave}
          isLoading={isSaving}
          isDisabled={!user?.uid || isSaving || !isDirty}
          className='rounded-md bg-dark-table text-white dark:bg-white dark:text-dark-table'
        >
          Save Email Alerts
        </Button>
      </CardHeader>

      <CardBody className='grid gap-4 p-4 pt-0 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)]'>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Textarea
              minRows={2}
              placeholder='Paste Name and Email in any of these formats: Alice=alice@example.com | Bob: bob@example.com | Carol, carol@example.com'
              classNames={commonInputClassNames}
              onPaste={handlePasteRecipients}
            />
            <div className='flex items-center gap-3'>
              <Button
                size='sm'
                variant='flat'
                onPress={addRecipientRow}
                className='gap-1'
              >
                <Icon name='plus' className='size-4' />
                Add recipient
              </Button>
              <span className='text-xs text-default-400'>
                Paste multiple rows above or manage them individually below.
              </span>
            </div>
          </div>

          <div className='overflow-hidden rounded-xl border border-foreground/10 bg-default-50 dark:bg-sidebar'>
            <div className='divide-y divide-greyed/10'>
              {recipients.length === 0 ? (
                <div className='px-4 py-8 text-center text-sm text-default-400'>
                  No recipients configured yet.
                </div>
              ) : (
                recipients.map((recipient, index) => (
                  <div
                    key={recipient.rowId}
                    className='grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]'
                  >
                    <Input
                      label={index === 0 ? 'Name' : undefined}
                      placeholder='Name'
                      value={recipient.name}
                      onValueChange={(value) =>
                        setRecipient(recipient.rowId, 'name', value)
                      }
                      classNames={commonInputClassNames}
                    />
                    <Input
                      label={index === 0 ? 'Email' : undefined}
                      type='email'
                      placeholder='email@example.com'
                      value={recipient.email}
                      onValueChange={(value) =>
                        setRecipient(recipient.rowId, 'email', value)
                      }
                      classNames={commonInputClassNames}
                    />
                    <div className='flex items-end'>
                      <Button
                        variant='light'
                        onPress={() => removeRecipientRow(recipient.rowId)}
                        isIconOnly
                        aria-label={`Remove recipient ${index + 1}`}
                      >
                        <Icon name='trash-fill' className='size-4 opacity-80' />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className='space-y-3 rounded-xl border border-foreground/10 bg-default-50/70 p-4 dark:bg-sidebar/70'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <h4 className='text-sm font-semibold'>Currently Low Stock</h4>
              <p className='text-xs text-default-500'>
                Products already at or below their alert threshold.
              </p>
            </div>
            <span className='text-sm text-default-500'>
              {(lowStockProducts ?? []).length}
            </span>
          </div>

          <div className='space-y-2'>
            {lowStockProducts === undefined ? (
              <p className='text-sm text-default-400'>
                Loading low stock products...
              </p>
            ) : lowStockProducts.length === 0 ? (
              <p className='text-sm text-default-400'>
                No products are currently under their threshold.
              </p>
            ) : (
              lowStockProducts.map((product) => (
                <Link
                  key={product._id}
                  href={`/admin/inventory/product/${product._id}`}
                  className='block rounded-lg border border-transparent bg-white px-3 py-3 transition-colors hover:border-foreground/10 hover:bg-default-100 dark:bg-default-50/10 dark:hover:bg-default-50/20'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='space-y-1'>
                      <p className='text-sm font-medium'>{product.name}</p>
                      <p className='text-xs text-default-500'>
                        {formatQuantity(
                          product.currentStock,
                          product.stockUnit,
                        )}{' '}
                        left
                        {' · '}
                        threshold{' '}
                        {formatQuantity(
                          product.lowStockThreshold,
                          product.stockUnit,
                        )}
                      </p>
                    </div>
                    <span className='rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-100'>
                      {product.lowStockAlertActive ? 'Alert active' : 'Waiting'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
