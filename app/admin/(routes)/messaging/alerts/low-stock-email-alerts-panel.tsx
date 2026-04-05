'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {onError, onSuccess} from '@/ctx/toast'
import {useSaveAdminProductFormReturn} from '@/hooks/use-save-admin-product-form-return'
import {Icon} from '@/lib/icons'
import {
  LOW_STOCK_ALERTS_IDENTIFIER,
  type LowStockAlertRecipient,
  normalizeLowStockAlertsConfig,
  serializeLowStockAlertsConfig,
} from '@/lib/low-stock-alerts'
import {Input, Textarea as TextArea} from '@heroui/input'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Switch,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {
  type ClipboardEvent,
  startTransition,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'

type RecipientDraft = LowStockAlertRecipient & {rowId: number}
type LowStockAlertsConfig = ReturnType<typeof normalizeLowStockAlertsConfig>
type LowStockProductPreview = {
  _id: string
  name: string
  slug: string
  currentStock: number
  stockUnit?: string | null
  lowStockThreshold: number
  lowStockAlertActive: boolean
  lowStockAlertTriggeredAt: number | null
  lowStockAlertLastSentAt: number | null
  lowStockAlertLastNotifiedStock: number | null
  lowStockAlertLastError: string | null
}
type LowStockOverview = {
  summary: {
    monitoredProductCount: number
    lowStockProductCount: number
    activeAlertCount: number
    failedAlertCount: number
  }
  products: LowStockProductPreview[]
}

interface LowStockEmailAlertsEditorProps {
  config: LowStockAlertsConfig
  lowStockOverview: LowStockOverview | undefined
  onSaveConfig: (config: LowStockAlertsConfig) => Promise<unknown>
  userUid: string | null
}

interface AlertStatCardProps {
  label: string
  value: string
  hint: string
}

const formatQuantity = (value: number, unit?: string | null) => {
  const formatted = Number.isInteger(value)
    ? value.toLocaleString('en-US')
    : value.toLocaleString('en-US', {maximumFractionDigits: 6})

  return unit ? `${formatted} ${unit}` : formatted
}

const formatTimestamp = (value: number | null) =>
  typeof value === 'number' ? new Date(value).toLocaleString() : null

const AlertStatCard = ({label, value, hint}: AlertStatCardProps) => {
  return (
    <div className='rounded-xl border border-sidebar bg-default-50/80 p-4 dark:border-default-100/10 dark:bg-default-50/5'>
      <p className='text-[11px] uppercase tracking-[0.18em] text-default-400'>
        {label}
      </p>
      <p className='mt-2 text-xl font-semibold text-foreground'>{value}</p>
      <p className='mt-1 text-xs text-default-500'>{hint}</p>
    </div>
  )
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

const toRecipientDrafts = (
  recipients: LowStockAlertRecipient[],
): RecipientDraft[] =>
  recipients.map((recipient, index) => withRowId(recipient, index))

const LowStockEmailAlertsEditor = ({
  config,
  lowStockOverview,
  onSaveConfig,
  userUid,
}: LowStockEmailAlertsEditorProps) => {
  const saveAdminProductFormReturn = useSaveAdminProductFormReturn()
  const nextRowIdRef = useRef(config.recipients.length)
  const allocateRowId = useCallback(() => {
    const rowId = nextRowIdRef.current
    nextRowIdRef.current += 1
    return rowId
  }, [])

  const [enabled, setEnabled] = useState(config.enabled)
  const [isSaving, setIsSaving] = useState(false)
  const [recipients, setRecipients] = useState<RecipientDraft[]>(() =>
    toRecipientDrafts(config.recipients),
  )

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

  const lowStockProducts = lowStockOverview?.products ?? []
  const summary = lowStockOverview?.summary
  const recipientCount = recipients.length

  const configurationWarnings = [
    enabled && recipientCount === 0
      ? 'Alerts are enabled, but no recipients are configured yet.'
      : null,
    enabled && summary && summary.monitoredProductCount === 0
      ? 'No product currently has a low stock threshold configured in Inventory.'
      : null,
    !enabled && summary && summary.lowStockProductCount > 0
      ? 'Some products are already below threshold, but alerts are currently disabled.'
      : null,
  ].filter((warning): warning is string => warning !== null)

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
    if (!userUid) return

    setIsSaving(true)

    startTransition(() => {
      onSaveConfig(normalizedDraftConfig)
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
  }, [normalizedDraftConfig, onSaveConfig, userUid])

  return (
    <Card
            className='h-full rounded-lg border border-sidebar bg-default-100/60 dark:border-default-100/70'>
      <CardHeader className='flex flex-col items-start gap-4 p-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-3'>
            <h3 className='text-base font-semibold'>Low Stock Email Alerts</h3>
            <Switch isSelected={enabled} onChange={(isSelected) => setEnabled(isSelected)}>
              Enabled
            </Switch>
          </div>
          <p className='text-sm text-default-500'>
            Configure global delivery, monitor active alert state, and review
            which products are already below their threshold.
          </p>
        </div>

        <Button
          variant='primary'
          onPress={handleSave}
          isDisabled={isSaving || !userUid || !isDirty}
          className='rounded-md bg-dark-table text-white dark:bg-white dark:text-dark-table'>
          Save Alert Settings
        </Button>
      </CardHeader>

      <CardContent className='space-y-4 p-4 pt-0'>
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          <AlertStatCard
            label='Global Status'
            value={enabled ? 'Enabled' : 'Disabled'}
            hint={
              enabled
                ? 'New low-stock events can send email notifications.'
                : 'No low-stock emails will be sent until enabled.'
            }
          />
          <AlertStatCard
            label='Recipients'
            value={recipientCount.toString()}
            hint='Configured recipients receive each low-stock email alert.'
          />
          <AlertStatCard
            label='Monitored Products'
            value={
              summary ? summary.monitoredProductCount.toLocaleString() : '--'
            }
            hint='Products with a per-product low-stock threshold configured.'
          />
          <AlertStatCard
            label='Below Threshold'
            value={
              summary ? summary.lowStockProductCount.toLocaleString() : '--'
            }
            hint={
              summary
                ? `${summary.activeAlertCount} active alerts · ${summary.failedAlertCount} with recent failures`
                : 'Loading alert activity...'
            }
          />
        </div>

        <div className='rounded-xl border border-sidebar bg-default-50/80 p-4 dark:border-default-100/10 dark:bg-default-50/5'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
            <div className='space-y-1'>
              <h4 className='text-sm font-semibold'>Low Stock Configuration</h4>
              <p className='text-sm text-default-500'>
                This panel controls global delivery. Per-product thresholds are
                configured in Inventory and alerts trigger when stock reaches a
                product&apos;s threshold or lower.
              </p>
            </div>
            <Link
              href='/admin/inventory'
              className='text-sm font-medium text-brand hover:opacity-80'>
              Review Inventory Thresholds
            </Link>
          </div>

          <div className='mt-4 grid gap-3 lg:grid-cols-2'>
            <div className='rounded-lg border border-foreground/10 bg-background/40 p-4'>
              <p className='text-[11px] uppercase tracking-[0.18em] text-default-400'>
                Alert Flow
              </p>
              <div className='mt-3 space-y-2 text-sm text-default-500'>
                <p>
                  1. Add a low stock threshold on each product in Inventory.
                </p>
                <p>
                  2. When current stock reaches that threshold, an alert is
                  scheduled.
                </p>
                <p>
                  3. Alerts clear automatically after stock rises above
                  threshold.
                </p>
              </div>
            </div>

            <div className='rounded-lg border border-foreground/10 bg-background/40 p-4'>
              <p className='text-[11px] uppercase tracking-[0.18em] text-default-400'>
                Current Readiness
              </p>
              <div className='mt-3 space-y-2 text-sm'>
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-default-500'>Global toggle</span>
                  <span className='font-medium'>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-default-500'>Recipient list</span>
                  <span className='font-medium'>
                    {recipientCount > 0
                      ? `${recipientCount} configured`
                      : 'Needs recipients'}
                  </span>
                </div>
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-default-500'>Threshold coverage</span>
                  <span className='font-medium'>
                    {summary
                      ? `${summary.monitoredProductCount} monitored`
                      : 'Loading...'}
                  </span>
                </div>
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-default-500'>Alert activity</span>
                  <span className='font-medium'>
                    {summary
                      ? `${summary.activeAlertCount} active / ${summary.failedAlertCount} failed`
                      : 'Loading...'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {configurationWarnings.length > 0 ? (
            <div className='mt-4 space-y-2 rounded-lg border border-amber-300/40 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/20 dark:text-amber-100'>
              {configurationWarnings.map((warning) => (
                <div key={warning} className='flex items-start gap-2'>
                  <Icon
                    name='alert-triangle'
                    className='mt-0.5 size-4 shrink-0'
                  />
                  <p>{warning}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className='grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)]'>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <div className='space-y-1'>
                <h4 className='text-sm font-semibold'>Recipients</h4>
                <p className='text-xs text-default-500'>
                  Paste multiple lines or manage each recipient individually.
                </p>
              </div>
              <TextArea
                minRows={2}
                placeholder='Paste Name and Email in any of these formats: Alice=alice@example.com | Bob: bob@example.com | Carol, carol@example.com'
                classNames={commonInputClassNames}
                onPaste={handlePasteRecipients}
              />
              <div className='flex items-center gap-3'>
                <Button
                  size='sm'
                  variant='tertiary'
                  onPress={addRecipientRow}
                  className='gap-1'>
                  <Icon name='plus' className='size-4' />
                  Add recipient
                </Button>
                <span className='text-xs text-default-400'>
                  Emails are normalized, deduplicated, and saved in lowercase.
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
                      className='grid gap-3 px-3 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]'>
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
                          variant='tertiary'
                          onPress={() => removeRecipientRow(recipient.rowId)}
                          isIconOnly
                          aria-label={`Remove recipient ${index + 1}`}>
                          <Icon
                            name='trash-fill'
                            className='size-4 opacity-80'
                          />
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
                  Products already at or below their configured alert threshold.
                </p>
              </div>
              <span className='text-sm text-default-500'>
                {summary ? summary.lowStockProductCount : '--'}
              </span>
            </div>

            <div className='space-y-2'>
              {lowStockOverview === undefined ? (
                <p className='text-sm text-default-400'>
                  Loading low stock products...
                </p>
              ) : lowStockProducts.length === 0 ? (
                <p className='text-sm text-default-400'>
                  No products are currently under their threshold.
                </p>
              ) : (
                lowStockProducts.map((product) => {
                  const triggeredAt = formatTimestamp(
                    product.lowStockAlertTriggeredAt,
                  )
                  const lastSentAt = formatTimestamp(
                    product.lowStockAlertLastSentAt,
                  )

                  return (
                    <Link
                      key={product._id}
                      href={`/admin/inventory/product/${product._id}`}
                      onClick={saveAdminProductFormReturn}
                      className='block rounded-lg border border-transparent bg-white px-3 py-3 transition-colors hover:border-foreground/10 hover:bg-default-100 dark:bg-default-50/10 dark:hover:bg-default-50/20'>
                      <div className='space-y-3'>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='space-y-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <p className='text-sm font-medium'>
                                {product.name}
                              </p>
                              <span
                                className={
                                  product.lowStockAlertActive
                                    ? 'rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-100'
                                    : 'rounded-full bg-default-200 px-2 py-1 text-[11px] font-medium text-default-700 dark:bg-default-50/10 dark:text-default-300'
                                }>
                                {product.lowStockAlertActive
                                  ? 'Alert active'
                                  : 'Awaiting next evaluation'}
                              </span>
                            </div>
                            {product.slug ? (
                              <p className='text-[11px] text-default-400'>
                                /{product.slug}
                              </p>
                            ) : null}
                          </div>
                          <Icon
                            name='arrow-right'
                            className='mt-0.5 size-4 text-default-400'
                          />
                        </div>

                        <div className='space-y-1'>
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
                          <div className='flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-default-400'>
                            {triggeredAt ? (
                              <span>Triggered {triggeredAt}</span>
                            ) : null}
                            {lastSentAt ? (
                              <span>Last email {lastSentAt}</span>
                            ) : null}
                            {product.lowStockAlertLastNotifiedStock != null ? (
                              <span>
                                Last notified at{' '}
                                {formatQuantity(
                                  product.lowStockAlertLastNotifiedStock,
                                  product.stockUnit,
                                )}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {product.lowStockAlertLastError ? (
                          <p className='rounded-md bg-rose-50 px-2 py-2 text-xs text-rose-700 dark:bg-rose-950/20 dark:text-rose-200'>
                            Last send error: {product.lowStockAlertLastError}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  )
                })
              )}
            </div>

            {summary &&
            summary.lowStockProductCount > lowStockProducts.length ? (
              <p className='text-xs text-default-400'>
                Showing {lowStockProducts.length} of{' '}
                {summary.lowStockProductCount} products currently below
                threshold.
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const LowStockEmailAlertsPanel = () => {
  const {user} = useAuthCtx()
  const setting = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: LOW_STOCK_ALERTS_IDENTIFIER,
  })
  const lowStockOverview = useQuery(api.products.q.listLowStockProducts, {
    limit: 12,
  })
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)
  const config = useMemo(
    () => normalizeLowStockAlertsConfig(setting?.value),
    [setting?.value],
  )
  const configKey = useMemo(
    () => JSON.stringify(serializeLowStockAlertsConfig(config)),
    [config],
  )
  const userUid = user?.uid ?? null

  const saveConfig = useCallback(
    (nextConfig: LowStockAlertsConfig) => {
      if (!userUid) {
        return Promise.reject(new Error('Missing authenticated user'))
      }

      return updateAdmin({
        identifier: LOW_STOCK_ALERTS_IDENTIFIER,
        value: serializeLowStockAlertsConfig(nextConfig),
        uid: userUid,
      })
    },
    [updateAdmin, userUid],
  )

  return (
    <LowStockEmailAlertsEditor
      key={configKey}
      config={config}
      lowStockOverview={lowStockOverview}
      onSaveConfig={saveConfig}
      userUid={userUid}
    />
  )
}
