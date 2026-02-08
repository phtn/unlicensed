'use client'

import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Chip, Input, Select, SelectItem, SelectedItems} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useMemo} from 'react'
import {ProductFormApi, mapFractions} from '../product-schema'
import {commonInputClassNames} from '../ui/fields'
import {JunctionBox} from '../ui/junction-box'
import {FormSection, Header} from './components'

interface InventoryProps {
  form: ProductFormApi
}

// Extract numeric denomination from variant label (e.g., "0.125oz" -> 0.125)
const extractDenomination = (label: string): number | null => {
  // Match numbers at the start of the label (including decimals)
  const match = label.match(/^(\d+\.?\d*)/)
  if (match) {
    const num = Number.parseFloat(match[1])
    return Number.isNaN(num) ? null : num
  }
  return null
}

export const Inventory = ({form}: InventoryProps) => {
  // Get variants from form store
  const variants = useStore(form.store, (state) => {
    const values = state.values as {
      variants?: Array<{label: string; price: number}>
    }
    return values.variants ?? []
  })

  // Get current availableDenominationsRaw value
  const availableDenominationsRaw = useStore(form.store, (state) => {
    const values = state.values as {
      availableDenominationsRaw?: string | string[]
    }
    return values.availableDenominationsRaw
  })

  const eligibleForUpgrade = useStore(form.store, (state) => {
    const values = state.values as {eligibleForUpgrade?: boolean}
    return values.eligibleForUpgrade ?? false
  })

  // Parse current denominations from raw value
  const currentDenominations = useMemo(() => {
    if (!availableDenominationsRaw) return new Set<string>()
    if (typeof availableDenominationsRaw === 'string') {
      const nums = availableDenominationsRaw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
      return new Set(nums)
    }
    if (Array.isArray(availableDenominationsRaw)) {
      return new Set(availableDenominationsRaw.map(String))
    }
    return new Set<string>()
  }, [availableDenominationsRaw])

  // Create options from variants with prices
  const variantOptions = useMemo(() => {
    return variants
      .filter((v) => v.label && extractDenomination(v.label) !== null)
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
        // Sort by denomination value
        const aNum = a.denomination ?? 0
        const bNum = b.denomination ?? 0
        return aNum - bNum
      })
  }, [variants])

  // Handle selection change: update raw field and ensure stockByDenomination has an entry for each selected denomination
  const handleSelectionChange = (
    field: {
      handleChange: (value: string) => void
    },
    keys: Set<React.Key> | 'all',
  ) => {
    const newKeys =
      keys === 'all'
        ? variantOptions.map((opt) => opt.key)
        : Array.from(keys).map((key) => String(key))
    if (keys === 'all') {
      const allDenominations = variantOptions.map((opt) => opt.key).join(', ')
      field.handleChange(allDenominations)
    } else {
      field.handleChange(newKeys.join(', '))
    }
    const current =
      (form.getFieldValue('stockByDenomination') as
        | Record<string, number>
        | undefined) ?? {}
    const next = {...current}
    for (const k of newKeys) {
      if (next[k] === undefined) next[k] = 0
    }
    form.setFieldValue('stockByDenomination', next)
  }

  return (
    <FormSection id='inventory'>
      <Header label='Inventory' />
      <div className='w-full space-y-8'>
        <div className='grid grid-cols-1 md:grid-cols-6 md:gap-x-6 gap-y-6 w-full'>
          <div className='w-full col-span-6'>
            <form.Field name='stockByDenomination'>
              {(field) => {
                const stockByDenomination =
                  (field.state.value as Record<string, number>) ?? {}
                const selectedVariantOptions = variantOptions.filter((opt) =>
                  currentDenominations.has(opt.key),
                )
                const handleStockChange = (
                  denominationKey: string,
                  value: number,
                ) => {
                  const next = {
                    ...stockByDenomination,
                    [denominationKey]: Math.max(0, value),
                  }
                  field.handleChange(next)
                }
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
                        {selectedVariantOptions.map((option) => {
                          const value = stockByDenomination[option.key] ?? 0
                          return (
                            <Input
                              key={option.key}
                              label={
                                mapFractions[option.label] ??
                                option.displayLabel ??
                                option.label
                              }
                              type='number'
                              value={String(value)}
                              onChange={(e) =>
                                handleStockChange(
                                  option.key,
                                  Number(e.target.value) || 0,
                                )
                              }
                              onBlur={field.handleBlur}
                              min={0}
                              variant='bordered'
                              classNames={commonInputClassNames}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }}
            </form.Field>
          </div>

          <div className='w-full col-span-2'>
            <form.Field name='availableDenominationsRaw'>
              {(field) => {
                const selectedKeys = new Set(
                  variantOptions
                    .filter((opt) => currentDenominations.has(opt.key))
                    .map((opt) => opt.key),
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
                      classNames={{
                        ...commonInputClassNames,
                        trigger:
                          'border h-16 border-light-gray/50 dark:border-black/20 bg-light-gray/10 shadow-none dark:bg-black/60 rounded-lg p-2 outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500',
                        label:
                          'mb-2 pl-0.5 opacity-80 font-medium tracking-widest uppercase text-sm',
                      }}
                      renderValue={(items: SelectedItems<object>) => {
                        return (
                          <div className='flex flex-wrap gap-2'>
                            {items.map((item) => {
                              const variant = variantOptions.find(
                                (opt) => opt.key === item.key,
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
                        )
                      }}>
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
                    {variantOptions.length === 0 && (
                      <p className='text-xs text-color-muted mt-1'>
                        Configure variants with prices in the Pricing section to
                        enable denomination selection.
                      </p>
                    )}
                  </div>
                )
              }}
            </form.Field>
          </div>

          <div className='w-full col-span-2'>
            <form.Field name='popularDenomination'>
              {(field) => {
                const popularDenominationValue =
                  (field.state.value as number[] | undefined) ?? []

                // Find variant options that match the numeric values in the array
                const selectedKeys = (() => {
                  if (
                    !popularDenominationValue ||
                    popularDenominationValue.length === 0
                  ) {
                    return new Set<string>()
                  }

                  // Find variant options that match these numeric values
                  const matchingKeys = variantOptions
                    .filter((opt) =>
                      popularDenominationValue.some(
                        (num) =>
                          opt.denomination !== null &&
                          Math.abs(opt.denomination - num) < 0.0001,
                      ),
                    )
                    .map((opt) => opt.key)

                  return new Set(matchingKeys)
                })()

                const handleSelectionChange = (
                  keys: Set<React.Key> | 'all',
                ) => {
                  if (keys === 'all') {
                    const allDenominations = variantOptions
                      .map((opt) => opt.denomination)
                      .filter((num): num is number => num !== null)
                    field.handleChange(allDenominations)
                  } else {
                    // Convert selected keys to their numeric denomination values
                    const selectedDenominations = Array.from(keys)
                      .map((key) => {
                        const option = variantOptions.find(
                          (opt) => opt.key === key,
                        )
                        return option?.denomination ?? null
                      })
                      .filter((num): num is number => num !== null)
                    field.handleChange(selectedDenominations)
                  }
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
                      onSelectionChange={handleSelectionChange}
                      variant='bordered'
                      isMultiline={true}
                      isDisabled={variantOptions.length === 0}
                      classNames={{
                        ...commonInputClassNames,
                        trigger:
                          'border h-16 border-light-gray/50 dark:border-black/20 bg-light-gray/10 shadow-none dark:bg-black/60 rounded-lg p-2 outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500',
                        label:
                          'mb-2 pl-0.5 opacity-80 font-medium tracking-widest uppercase text-sm',
                      }}
                      renderValue={(items: SelectedItems<object>) => {
                        return (
                          <div className='flex flex-wrap gap-2'>
                            {items.map((item) => {
                              const variant = variantOptions.find(
                                (opt) => opt.key === item.key,
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
                        )
                      }}>
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
                    {variantOptions.length === 0 && (
                      <p className='text-xs text-color-muted mt-1'>
                        Configure variants with prices in the Pricing section to
                        enable denomination selection.
                      </p>
                    )}
                  </div>
                )
              }}
            </form.Field>
          </div>
          <div className='w-full col-span-2'>
            <form.Field name='tier'>
              {(field) => {
                const tierValue =
                  (field.state.value as
                    | 'A'
                    | 'AA'
                    | 'AAA'
                    | 'AAAA'
                    | 'S'
                    | undefined) ?? undefined
                const selectedKeys = tierValue ? [tierValue] : []
                return (
                  <Select
                    label='Product Tier'
                    placeholder='Select a tier'
                    selectedKeys={selectedKeys}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0]
                      field.handleChange(
                        key != null
                          ? (key as 'A' | 'AA' | 'AAA' | 'AAAA' | 'S')
                          : undefined,
                      )
                    }}
                    onBlur={field.handleBlur}
                    variant='bordered'
                    classNames={{
                      ...commonInputClassNames,
                      trigger:
                        'border h-16 border-light-gray/50 dark:border-black/20 bg-light-gray/10 shadow-none dark:bg-black/60 rounded-lg p-2 outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500',
                      label:
                        'mb-2 pl-0.5 opacity-80 font-medium tracking-widest uppercase text-sm',
                    }}
                    disallowEmptySelection={false}>
                    <SelectItem key='A' textValue='A'>
                      A
                    </SelectItem>
                    <SelectItem key='AA' textValue='AA'>
                      AA
                    </SelectItem>
                    <SelectItem key='AAA' textValue='AAA'>
                      AAA
                    </SelectItem>
                    <SelectItem key='AAAA' textValue='AAAA'>
                      AAAA
                    </SelectItem>
                    <SelectItem key='S' textValue='S'>
                      S
                    </SelectItem>
                  </Select>
                )
              }}
            </form.Field>
          </div>
        </div>

        <div className='flex items-center pt-8 space-x-2'>
          <Icon name='boomerang' className='size-4 rotate-25' />
          <span className='font-polysans font-medium'>Statuses</span>
        </div>

        <div className='grid md:grid-cols-4 items-center gap-6 py-4'>
          <form.Field name='available'>
            {(field) => {
              return (
                <JunctionBox
                  title='Active'
                  description='Product is visible in store.'
                  checked={(field.state.value as boolean) ?? false}
                  onUpdate={field.handleChange}
                />
              )
            }}
          </form.Field>
          <form.Field name='eligibleForDeals'>
            {(field) => {
              return (
                <JunctionBox
                  title='Deals'
                  description='Discounts and package deals.'
                  checked={(field.state.value as boolean) ?? false}
                  onUpdate={field.handleChange}
                />
              )
            }}
          </form.Field>

          <form.Field name='eligibleForRewards'>
            {(field) => {
              return (
                <JunctionBox
                  title='Rewards'
                  description='+Rewards for purchasing this product.'
                  checked={(field.state.value as boolean) ?? false}
                  onUpdate={field.handleChange}
                />
              )
            }}
          </form.Field>
          <form.Field name='featured'>
            {(field) => {
              return (
                <JunctionBox
                  title='Featured'
                  description='Highlight in featured sections.'
                  checked={(field.state.value as boolean) ?? false}
                  onUpdate={field.handleChange}
                />
              )
            }}
          </form.Field>
          <form.Field name='sale'>
            {(field) => {
              return (
                <JunctionBox
                  title='On Sale'
                  description='Product is on-sale.'
                  checked={(field.state.value as boolean) ?? false}
                  onUpdate={field.handleChange}
                />
              )
            }}
          </form.Field>

          <form.Field name='eligibleForUpgrade'>
            {(field) => {
              return (
                <JunctionBox
                  title='Upgradable'
                  description='Product can be upgraded to a higher tiers.'
                  checked={(field.state.value as boolean) ?? false}
                  onUpdate={field.handleChange}
                />
              )
            }}
          </form.Field>
        </div>

        {eligibleForUpgrade && (
          <div className='grid md:grid-cols-4 items-center gap-8 py-4'>
            <form.Field name='upgradePrice'>
              {(field) => {
                const value = (field.state.value as number | undefined) ?? 0
                return (
                  <div className='space-y-2'>
                    <Input
                      label='Upgrade Price ($)'
                      type='number'
                      value={String(value)}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value) || 0)
                      }
                      onBlur={field.handleBlur}
                      min={0}
                      step={0.01}
                      variant='bordered'
                      classNames={commonInputClassNames}
                      startContent={
                        <Icon
                          name='dollar'
                          className='size-5 mb-0.5 opacity-80'
                        />
                      }
                    />
                  </div>
                )
              }}
            </form.Field>
          </div>
        )}
      </div>
    </FormSection>
  )
}
