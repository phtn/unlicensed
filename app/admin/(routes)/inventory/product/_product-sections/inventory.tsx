'use client'

import {
  commonInputClassNames,
  commonSelectClassNames,
} from '@/app/admin/_components/ui/fields'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {InventoryMode} from '@/convex/products/d'
import {Icon} from '@/lib/icons'
import {getStockDisplayUnit, getTotalStock} from '@/lib/productStock'
import {formatPrice} from '@/utils/formatPrice'
import {
  Button,
  Chip,
  Input,
  Select,
  SelectItem,
  SelectedItems,
} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useQuery} from 'convex/react'
import {useMemo, useState} from 'react'
import {ProductFormApi, mapFractions} from '../product-schema'
import {FormSection, Header} from './components'
import {
  InventoryAdjustmentModal,
  buildInventoryInputs,
  formatQuantity,
} from './inventory-adjustment-modal'

interface InventoryProps {
  form: ProductFormApi
  isEditMode?: boolean
  product?: Doc<'products'>
}

const MASTER_STOCK_UNIT_OPTIONS = [
  'mg',
  'g',
  'kg',
  'oz',
  'lb',
  'units',
] as const

const extractDenomination = (label: string): number | null => {
  const match = label.match(/^(\d+\.?\d*)/)
  if (!match) return null

  const num = Number.parseFloat(match[1])
  return Number.isNaN(num) ? null : num
}

const movementTypeStyles = {
  restock:
    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/60',
  manual_override:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/60',
  order_deduction:
    'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-950/40 dark:text-slate-200 dark:border-slate-800',
} as const

const movementTypeLabels = {
  restock: 'Restock',
  manual_override: 'Manual Override',
  order_deduction: 'Order Deduction',
} as const

const formatAlertQuantity = (value: number) =>
  Number.isInteger(value)
    ? value.toLocaleString('en-US')
    : value.toLocaleString('en-US', {maximumFractionDigits: 6})

const formatAlertQuantityLabel = (value: number, unit: string | null) =>
  unit ? `${formatAlertQuantity(value)} ${unit}` : formatAlertQuantity(value)

const formatMovementQuantityLabel = (value: number, unit?: string) => {
  const normalizedUnit = unit?.trim()
  return normalizedUnit
    ? `${formatQuantity(value)} ${normalizedUnit}`
    : formatQuantity(value)
}

const getMovementLineLabel = (
  product: Doc<'products'>,
  inventoryMode: InventoryMode,
  line: {
    denomination?: number
    nextQuantity: number
    unit?: string
  },
) => {
  const unit = line.unit?.trim()
  if (line.denomination !== undefined) {
    return (
      buildInventoryInputs({
        ...product,
        availableDenominations: [line.denomination],
        stockByDenomination: {[String(line.denomination)]: line.nextQuantity},
      })[0]?.label ?? String(line.denomination)
    )
  }

  return inventoryMode === 'shared'
    ? `Master stock${unit ? ` (${unit})` : ''}`
    : 'Stock'
}

const getMovementDeltaLabel = (value: number, unit?: string) => {
  if (value === 0) return 'No change'

  const prefix = value > 0 ? '+' : ''
  return `${prefix}${formatMovementQuantityLabel(value, unit)}`
}

export const Inventory = ({
  form,
  isEditMode = false,
  product,
}: InventoryProps) => {
  const variants = useStore(form.store, (state) => {
    const values = state.values as {
      variants?: Array<{label: string; price: number}>
    }
    return values.variants ?? []
  })

  const availableDenominationsRaw = useStore(form.store, (state) => {
    const values = state.values as {
      availableDenominationsRaw?: string | string[]
    }
    return values.availableDenominationsRaw
  })

  const inventoryMode = useStore(form.store, (state) => {
    const values = state.values as {inventoryMode?: InventoryMode}
    return values.inventoryMode ?? 'by_denomination'
  })

  const productUnit = useStore(form.store, (state) => {
    const values = state.values as {unit?: string}
    return values.unit ?? ''
  })
  const lowStockThreshold = useStore(form.store, (state) => {
    const values = state.values as {lowStockThreshold?: string}
    return values.lowStockThreshold ?? ''
  })

  const currentDenominations = useMemo(() => {
    if (!availableDenominationsRaw) return new Set<string>()
    if (typeof availableDenominationsRaw === 'string') {
      const nums = availableDenominationsRaw
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
      return new Set(nums)
    }
    if (Array.isArray(availableDenominationsRaw)) {
      return new Set(availableDenominationsRaw.map(String))
    }
    return new Set<string>()
  }, [availableDenominationsRaw])

  const variantOptions = useMemo(() => {
    return variants
      .filter(
        (variant) =>
          variant.label && extractDenomination(variant.label) !== null,
      )
      .map((variant) => {
        const denomination = extractDenomination(variant.label)
        const denominationKey = denomination?.toString() ?? variant.label
        return {
          key: denominationKey,
          label: variant.label,
          displayLabel: mapFractions[variant.label] ?? variant.label,
          price: variant.price,
          denomination,
        }
      })
      .sort((a, b) => {
        const aNum = a.denomination ?? 0
        const bNum = b.denomination ?? 0
        return aNum - bNum
      })
  }, [variants])

  const inventoryMovements = useQuery(
    api.inventoryMovements.q.getProductInventoryMovements,
    product ? {productId: product._id, limit: 8} : 'skip',
  )

  const [isRestockOpen, setIsRestockOpen] = useState(false)
  const [isManualOverrideOpen, setIsManualOverrideOpen] = useState(false)

  const syncInventoryStateToForm = (nextInventoryState: {
    inventoryMode: InventoryMode
    masterStockQuantity?: number
    masterStockUnit?: string
    stock: number
    stockByDenomination: Record<string, number>
  }) => {
    form.setFieldValue('inventoryMode', nextInventoryState.inventoryMode)
    form.setFieldValue('stock', nextInventoryState.stock)
    form.setFieldValue(
      'masterStockQuantity',
      nextInventoryState.masterStockQuantity,
    )
    form.setFieldValue(
      'masterStockUnit',
      nextInventoryState.masterStockUnit ?? '',
    )
    form.setFieldValue(
      'stockByDenomination',
      nextInventoryState.stockByDenomination,
    )
  }

  const handleSelectionChange = (
    field: {
      handleChange: (value: string) => void
    },
    keys: Set<React.Key> | 'all',
  ) => {
    const newKeys =
      keys === 'all'
        ? variantOptions.map((option) => option.key)
        : Array.from(keys).map((key) => String(key))

    field.handleChange(
      keys === 'all'
        ? variantOptions.map((option) => option.key).join(', ')
        : newKeys.join(', '),
    )

    const current =
      (form.getFieldValue('stockByDenomination') as
        | Record<string, number>
        | undefined) ?? {}
    const next = {...current}

    for (const key of newKeys) {
      if (next[key] === undefined) next[key] = 0
    }

    form.setFieldValue('stockByDenomination', next)
  }

  const persistedInventoryInputs = useMemo(
    () => (product ? buildInventoryInputs(product) : []),
    [product],
  )
  const persistedCurrentStock = useMemo(
    () => (product ? getTotalStock(product) : null),
    [product],
  )
  const persistedStockUnit = useMemo(
    () => (product ? getStockDisplayUnit(product) : null),
    [product],
  )
  const parsedLowStockThreshold = lowStockThreshold.trim()
    ? Number(lowStockThreshold)
    : null

  return (
    <FormSection>
      <Header label='Inventory' />
      <div className='w-full space-y-8'>
        <div className='grid grid-cols-1 md:grid-cols-6 md:gap-x-4 gap-y-6 w-full'>
          <div className='w-full col-span-6 md:col-span-3'>
            <form.Field name='inventoryMode'>
              {(field) => (
                <div className='space-y-2'>
                  <Select
                    label='Inventory Mode'
                    selectedKeys={[
                      String(field.state.value ?? 'by_denomination'),
                    ]}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0]
                      if (typeof selected === 'string') {
                        field.handleChange(selected as InventoryMode)
                      }
                    }}
                    isDisabled={isEditMode}
                    variant='bordered'
                    classNames={commonSelectClassNames}>
                    <SelectItem
                      key='by_denomination'
                      textValue='By denomination'>
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>
                          By denomination
                        </span>
                        <span className='text-xs opacity-70'>
                          Track stock per purchasable size.
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem key='shared' textValue='Shared'>
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>
                          Shared{' '}
                          <span className='text-xs font-ios font-normal opacity-70'>
                            (
                          </span>
                          Count / Weight
                          <span className='text-xs font-ios font-normal opacity-70'>
                            )
                          </span>
                        </span>
                        <span className='text-xs opacity-70'>
                          Master stock is shared across all denominations.
                        </span>
                      </div>
                    </SelectItem>
                  </Select>
                  {isEditMode ? (
                    <p className='text-xs text-color-muted'>
                      Change inventory mode through the restock or manual
                      override modal so this form stays aligned with the logged
                      inventory history.
                    </p>
                  ) : null}
                </div>
              )}
            </form.Field>
          </div>

          <div className='w-full col-span-6 md:col-span-3'>
            <form.Field name='lowStockThreshold'>
              {(field) => {
                const value = (field.state.value as string) ?? ''
                const thresholdLabel =
                  parsedLowStockThreshold != null &&
                  Number.isFinite(parsedLowStockThreshold)
                    ? formatAlertQuantityLabel(
                        parsedLowStockThreshold,
                        persistedStockUnit,
                      )
                    : null

                return (
                  <div className='space-y-2'>
                    <Input
                      label='Low Stock Threshold'
                      type='number'
                      step='0.01'
                      value={value}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      onBlur={field.handleBlur}
                      placeholder='Leave blank to disable'
                      variant='bordered'
                      classNames={commonInputClassNames}
                    />
                    <div className='space-y-1'>
                      <p className='text-xs text-color-muted'>
                        {product && persistedCurrentStock != null
                          ? `Current stock: ${formatAlertQuantityLabel(persistedCurrentStock, persistedStockUnit)}.${thresholdLabel ? ` Email alerts trigger when stock reaches ${thresholdLabel} or lower.` : ' Leave blank to disable low-stock email alerts for this product.'}`
                          : 'Leave blank to disable low-stock email alerts for this product.'}
                      </p>
                      {product?.lowStockAlertActive ? (
                        <div className='flex items-center gap-2'>
                          <Chip
                            size='sm'
                            variant='flat'
                            className='bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-100'>
                            Alert active
                          </Chip>
                          {product.lowStockAlertLastSentAt ? (
                            <span className='text-xs text-color-muted'>
                              Last sent{' '}
                              {new Date(
                                product.lowStockAlertLastSentAt,
                              ).toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {product?.lowStockAlertLastError ? (
                        <p className='text-xs text-rose-400'>
                          Last alert send failed:{' '}
                          {product.lowStockAlertLastError}
                        </p>
                      ) : null}
                    </div>
                    {field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0 && (
                        <p className='text-xs text-rose-400'>
                          {field.state.meta.errors.join(', ')}
                        </p>
                      )}
                  </div>
                )
              }}
            </form.Field>
          </div>
          <div className=' grid md:grid-cols-2 gap-4 col-span-6'>
            <div className='col-span-1'>
              <form.Field name='availableDenominationsRaw'>
                {(field) => {
                  const selectedKeys = new Set(
                    variantOptions
                      .filter((option) => currentDenominations.has(option.key))
                      .map((option) => option.key),
                  )

                  return (
                    <div className='space-y-1 w-full'>
                      <Select
                        label='Available Denominations'
                        placeholder={
                          variantOptions.length === 0
                            ? 'No variants available. Configure variants in Pricing section.'
                            : 'Select denominations...'
                        }
                        selectionMode='multiple'
                        selectedKeys={selectedKeys}
                        onSelectionChange={(keys) =>
                          handleSelectionChange(field, keys)
                        }
                        variant='bordered'
                        isMultiline={true}
                        isDisabled={variantOptions.length === 0}
                        classNames={commonSelectClassNames}
                        renderValue={(items: SelectedItems<object>) => (
                          <div className='flex flex-wrap gap-2'>
                            {items.map((item) => {
                              const variant = variantOptions.find(
                                (option) => option.key === item.key,
                              )
                              return (
                                <Chip
                                  key={item.key}
                                  variant='flat'
                                  classNames={{
                                    base: 'border border-light-gray dark:border-light-gray/30 h-7',
                                    content: 'text-xs flex items-center gap-1',
                                  }}>
                                  <span className='capitalize'>
                                    {variant?.displayLabel ?? item.textValue}
                                  </span>
                                </Chip>
                              )
                            })}
                          </div>
                        )}>
                        {variantOptions.map((option) => {
                          const priceDisplay = option.price
                            ? formatPrice(Math.round(option.price * 100))
                            : 'No price'
                          return (
                            <SelectItem
                              key={option.key}
                              textValue={option.displayLabel}>
                              <div className='flex items-center justify-between w-full'>
                                <div className='flex flex-col'>
                                  <span className='text-sm font-medium'>
                                    {option.displayLabel}
                                  </span>
                                  <span className='text-xs opacity-70'>
                                    {option.label}
                                  </span>
                                </div>
                                <span className='text-sm font-semibold text-blue-400 ml-4'>
                                  ${priceDisplay}
                                </span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </Select>
                      {variantOptions.length === 0 ? (
                        <p className='text-xs text-color-muted mt-1'>
                          Configure variants with prices in the Pricing section
                          to enable denomination selection.
                        </p>
                      ) : null}
                    </div>
                  )
                }}
              </form.Field>
            </div>
            <div className=''>
              <form.Field name='popularDenomination'>
                {(field) => {
                  const popularDenominationValue =
                    (field.state.value as number[] | undefined) ?? []

                  const selectedKeys = (() => {
                    if (!popularDenominationValue.length) {
                      return new Set<string>()
                    }

                    return new Set(
                      variantOptions
                        .filter((option) =>
                          popularDenominationValue.some(
                            (value) =>
                              option.denomination !== null &&
                              Math.abs(option.denomination - value) < 0.0001,
                          ),
                        )
                        .map((option) => option.key),
                    )
                  })()

                  const handlePopularSelectionChange = (
                    keys: Set<React.Key> | 'all',
                  ) => {
                    if (keys === 'all') {
                      field.handleChange(
                        variantOptions
                          .map((option) => option.denomination)
                          .filter((value): value is number => value !== null),
                      )
                      return
                    }

                    field.handleChange(
                      Array.from(keys)
                        .map((key) =>
                          variantOptions.find((option) => option.key === key),
                        )
                        .map((option) => option?.denomination ?? null)
                        .filter((value): value is number => value !== null),
                    )
                  }

                  return (
                    <div className='space-y-1 w-full'>
                      <Select
                        label='Popular Denomination'
                        placeholder={
                          variantOptions.length === 0
                            ? 'No variants available. Configure variants in Pricing section.'
                            : 'Select popular denominations...'
                        }
                        selectionMode='multiple'
                        selectedKeys={selectedKeys}
                        onSelectionChange={handlePopularSelectionChange}
                        variant='bordered'
                        isMultiline={true}
                        isDisabled={variantOptions.length === 0}
                        classNames={commonSelectClassNames}
                        renderValue={(items: SelectedItems<object>) => (
                          <div className='flex flex-wrap gap-2'>
                            {items.map((item) => {
                              const variant = variantOptions.find(
                                (option) => option.key === item.key,
                              )
                              return (
                                <Chip
                                  key={item.key}
                                  variant='bordered'
                                  className='border border-blue-500'
                                  classNames={{
                                    base: 'border border-dark-gray bg-background dark:border-yellow-500 h-7',
                                    content: 'text-xs flex items-center gap-1',
                                  }}>
                                  <span className='capitalize'>
                                    {variant?.displayLabel ?? item.textValue}
                                  </span>
                                </Chip>
                              )
                            })}
                          </div>
                        )}>
                        {variantOptions.map((option) => (
                          <SelectItem
                            key={option.key}
                            textValue={option.displayLabel}>
                            <div className='flex items-center justify-between w-full'>
                              <span className='text-sm font-medium'>
                                {option.displayLabel}
                              </span>
                              <span className='text-xs opacity-70'>
                                {option.label}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  )
                }}
              </form.Field>
            </div>
          </div>

          {!isEditMode && inventoryMode === 'shared' ? (
            <div className='w-full grid grid-cols-8'>
              <div className='w-full col-span-1'>
                <form.Field name='masterStockQuantity'>
                  {(field) => (
                    <Input
                      label='Master Stock'
                      type='number'
                      min={0}
                      step='0.001'
                      value={
                        field.state.value == null
                          ? ''
                          : String(field.state.value)
                      }
                      onChange={(event) =>
                        field.handleChange(Number(event.target.value) || 0)
                      }
                      onBlur={field.handleBlur}
                      variant='bordered'
                      classNames={commonInputClassNames}
                    />
                  )}
                </form.Field>
              </div>

              <div className='w-full'>
                <form.Field name='masterStockUnit'>
                  {(field) => (
                    <Select
                      label='Master Unit'
                      selectedKeys={
                        field.state.value
                          ? [String(field.state.value)]
                          : undefined
                      }
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0]
                        if (typeof selected === 'string') {
                          field.handleChange(selected)
                        }
                      }}
                      variant='bordered'
                      classNames={commonSelectClassNames}>
                      {MASTER_STOCK_UNIT_OPTIONS.map((unit) => (
                        <SelectItem key={unit} textValue={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                </form.Field>
              </div>

              <div className='col-span-6 rounded-xl border border-black/5 bg-black/2 p-4 text-sm text-color-muted dark:border-white/10 dark:bg-white/3 overflow-scroll'>
                Orders will deduct from this master pool using the product unit
                in Pricing. Example: `10 lb` with product denominations in `oz`
                will drop to `9.5 lb` after one `0.5 oz` order.
                {productUnit ? ` Current product unit: ${productUnit}.` : ''}
              </div>
            </div>
          ) : null}

          {!isEditMode && inventoryMode === 'by_denomination' ? (
            <div className='w-full col-span-6'>
              <form.Field name='stockByDenomination'>
                {(field) => {
                  const stockByDenomination =
                    (field.state.value as Record<string, number>) ?? {}
                  const selectedVariantOptions = variantOptions.filter(
                    (option) => currentDenominations.has(option.key),
                  )

                  return (
                    <div className='space-y-3 w-full'>
                      <label className='text-sm font-medium block'>
                        Stock by Denomination
                      </label>
                      {selectedVariantOptions.length === 0 ? (
                        <p className='text-sm text-color-muted'>
                          Select available denominations below to set stock per
                          size.
                        </p>
                      ) : (
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                          {selectedVariantOptions.map((option) => (
                            <Input
                              key={option.key}
                              label={
                                mapFractions[option.label] ??
                                option.displayLabel ??
                                option.label
                              }
                              type='number'
                              value={String(
                                stockByDenomination[option.key] ?? 0,
                              )}
                              onChange={(event) =>
                                field.handleChange({
                                  ...stockByDenomination,
                                  [option.key]: Math.max(
                                    0,
                                    Number(event.target.value) || 0,
                                  ),
                                })
                              }
                              onBlur={field.handleBlur}
                              min={0}
                              variant='bordered'
                              classNames={commonInputClassNames}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }}
              </form.Field>
            </div>
          ) : null}

          {!isEditMode &&
          inventoryMode === 'by_denomination' &&
          variantOptions.length === 0 ? (
            <div className='w-full col-span-6 md:col-span-2'>
              <form.Field name='stock'>
                {(field) => (
                  <Input
                    label='Fallback Stock'
                    type='number'
                    min={0}
                    value={
                      field.state.value == null ? '' : String(field.state.value)
                    }
                    onChange={(event) =>
                      field.handleChange(Number(event.target.value) || 0)
                    }
                    onBlur={field.handleBlur}
                    variant='bordered'
                    classNames={commonInputClassNames}
                  />
                )}
              </form.Field>
            </div>
          ) : null}

          {isEditMode && product ? (
            <div className='col-span-6 space-y-4'>
              <div className='rounded-lg border-2 border-light-brand dark:border-brand bg-light-brand/5 p-4 dark:bg-brand/5'>
                <p className='text-base font-okxs font-semibold tracking-wide'>
                  Official inventory Controls{' '}
                  <span className='font-ios px-3'>( ADMIN ONLY )</span>
                </p>
                <p className='mt-1 text-sm text-color-muted'>
                  Stock quantities are now managed through logged inventory
                  adjustments. Use restock when new supply arrives, and use
                  manual override only when you need to correct counts.
                </p>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                {persistedInventoryInputs.map((input) => (
                  <Input
                    key={input.key}
                    label={input.label}
                    value={`${formatQuantity(input.currentQuantity)}${input.unit ? ` ${input.unit}` : ''}`}
                    isReadOnly
                    variant='bordered'
                    classNames={commonInputClassNames}
                  />
                ))}
              </div>

              <div className='flex flex-wrap gap-3'>
                <Button
                  color='primary'
                  radius='none'
                  onPress={() => setIsRestockOpen(true)}
                  className='dark:bg-white dark:text-dark-table rounded-md'>
                  Restock Inventory
                </Button>
                <Button
                  variant='bordered'
                  onPress={() => setIsManualOverrideOpen(true)}
                  className='rounded-md'>
                  Manual Override
                </Button>
              </div>

              <div className='space-y-3 rounded-md border border-light-gray/40 bg-background/60 p-4 dark:border-white/10'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <p className='text-sm font-medium'>Recent Activity</p>
                    <p className='text-xs opacity-70'>
                      Restocks, overrides, corrections, and paid-order
                      deductions for this product.
                    </p>
                  </div>
                </div>

                {inventoryMovements === undefined ? (
                  <p className='text-sm text-color-muted'>
                    Loading inventory activity...
                  </p>
                ) : inventoryMovements.length === 0 ? (
                  <p className='text-sm text-color-muted'>
                    No inventory activity has been recorded yet.
                  </p>
                ) : (
                  <div className='space-y-0'>
                    {inventoryMovements.map((movement) => (
                      <div
                        key={movement._id}
                        className='rounded-none border border-b-0 last:border-b border-light-gray/50 bg-default-100/80 p-3 dark:border-white/10 dark:bg-white/3'>
                        <div className='flex flex-wrap items-center justify-between gap-3'>
                          <div className='flex flex-wrap items-center gap-4'>
                            <Chip
                              variant='flat'
                              classNames={{
                                base: `border ${movementTypeStyles[movement.type]}`,
                                content:
                                  'text-sm font-clash font-semibold tracking-wide',
                              }}>
                              {movementTypeLabels[movement.type]}
                            </Chip>
                            <div className='flex items-center gap-1'>
                              <Icon
                                name='user'
                                className='w-3 h-3 opacity-80'
                              />
                              <span className='text-sm opacity-90'>
                                {movement.performedByName ??
                                  movement.performedByEmail ??
                                  movement.sourceOrderNumber ??
                                  'System'}
                              </span>
                            </div>
                          </div>
                          <span className='text-xs opacity-60 font-ios'>
                            {new Date(movement.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div className='mt-2 space-y-2'>
                          <div className='grid gap-2 md:grid-cols-2'>
                            {movement.lines.map((line, index) => (
                              <div
                                key={`${movement._id}-${index}`}
                                className='rounded-md border border-black/5 bg-background/70 px-3 py-2.5 dark:border-white/10 dark:bg-black/10'>
                                <p className='text-xs font-ios uppercase tracking-[0.12em] opacity-60'>
                                  {getMovementLineLabel(
                                    product,
                                    movement.inventoryMode,
                                    line,
                                  )}
                                </p>
                                <div className='mt-1 flex flex-wrap items-center gap-2'>
                                  <span className='rounded-sm border border-black/5 bg-default-100 px-2 py-1 text-sm font-okxs tabular-nums dark:border-white/10 dark:bg-white/5'>
                                    {formatMovementQuantityLabel(
                                      line.previousQuantity,
                                      line.unit,
                                    )}
                                  </span>
                                  <Icon
                                    name='arrow-right-normal'
                                    className='size-4 text-blue-500 dark-text-blue-200'
                                  />
                                  <span className='rounded-sm border border-black/5 bg-background px-2 py-1 text-sm font-okxs tabular-nums dark:border-white/10 dark:bg-white/3'>
                                    {formatMovementQuantityLabel(
                                      line.nextQuantity,
                                      line.unit,
                                    )}
                                  </span>
                                  <span
                                    className={`text-sm font-okxs ${
                                      line.quantityDelta > 0
                                        ? 'text-emerald-700 dark:text-emerald-300'
                                        : line.quantityDelta < 0
                                          ? 'text-rose-700 dark:text-rose-300'
                                          : 'text-color-muted'
                                    }`}>
                                    {getMovementDeltaLabel(
                                      line.quantityDelta,
                                      line.unit,
                                    )}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className='flex flex-wrap items-center px-2 gap-x-4 gap-y-1'>
                            {movement.reference ? (
                              <p className='text-xs text-color-muted'>
                                <span className='uppercase font-ios pr-2 opacity-60'>
                                  ref:
                                </span>{' '}
                                {movement.reference}
                              </p>
                            ) : null}

                            {movement.note ? (
                              <p className='text-xs text-color-muted'>
                                <span className='uppercase font-ios pr-2 opacity-60'>
                                  notes:
                                </span>{' '}
                                {movement.note}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <InventoryAdjustmentModal
                product={product}
                adjustmentType='restock'
                isOpen={isRestockOpen}
                onOpenChangeAction={setIsRestockOpen}
                onAppliedAction={syncInventoryStateToForm}
              />
              <InventoryAdjustmentModal
                product={product}
                adjustmentType='manual_override'
                isOpen={isManualOverrideOpen}
                onOpenChangeAction={setIsManualOverrideOpen}
                onAppliedAction={syncInventoryStateToForm}
              />
            </div>
          ) : null}
        </div>
      </div>
    </FormSection>
  )
}
