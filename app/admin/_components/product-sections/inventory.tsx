'use client'

import {formatPrice} from '@/utils/formatPrice'
import {
  Chip,
  Input,
  Select,
  SelectItem,
  SelectedItems,
  Switch,
} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useMemo} from 'react'
import {ProductFormApi, mapFractions} from '../product-schema'
import {commonInputClassNames} from '../ui/fields'
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

  // Handle selection change
  const handleSelectionChange = (
    field: {
      handleChange: (value: string) => void
    },
    keys: Set<React.Key> | 'all',
  ) => {
    if (keys === 'all') {
      const allDenominations = variantOptions.map((opt) => opt.key).join(', ')
      field.handleChange(allDenominations)
    } else {
      const selectedDenominations = Array.from(keys)
        .map((key) => String(key))
        .join(', ')
      field.handleChange(selectedDenominations)
    }
  }

  return (
    <FormSection id='inventory'>
      <Header label='Inventory & Status' />
      <div className='w-full space-y-8'>
        <div className='grid grid-cols-1 md:grid-cols-6 md:gap-x-6 gap-y-6 w-full'>
          <div className='w-full col-span-1'>
            <form.Field name='stock'>
              {(field) => {
                const stockValue = (field.state.value as number) ?? 0
                return (
                  <div className='space-y-2 w-full'>
                    <label className='text-sm font-medium text-neutral-300'></label>
                    <Input
                      label='Stock Quantity'
                      type='number'
                      value={String(stockValue ?? 0)}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                      onBlur={field.handleBlur}
                      min={0}
                      variant='bordered'
                      classNames={commonInputClassNames}
                    />
                  </div>
                )
              }}
            </form.Field>
          </div>

          <div className='w-full col-span-3'>
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
        </div>

        <div className='grid md:grid-cols-4 items-center gap-8 py-4'>
          <form.Field name='available'>
            {(field) => {
              const availableValue = (field.state.value as boolean) ?? false
              return (
                <Switch
                  isSelected={availableValue}
                  onValueChange={field.handleChange}
                  classNames={{
                    wrapper: 'group-data-[selected=true]:bg-emerald-500',
                  }}>
                  <div className='flex flex-col gap-px portrait:pl-4'>
                    <span className='text-base font-semibold'>
                      Available for Sale
                    </span>
                    <span className='text-xs opacity-70'>
                      Product is visible in store
                    </span>
                  </div>
                </Switch>
              )
            }}
          </form.Field>

          <form.Field name='featured'>
            {(field) => {
              const featuredValue = (field.state.value as boolean) ?? false
              return (
                <Switch
                  isSelected={featuredValue}
                  onValueChange={field.handleChange}
                  classNames={{
                    wrapper: 'group-data-[selected=true]:bg-featured',
                  }}>
                  <div className='flex flex-col gap-px portrait:pl-4'>
                    <span className='text-base font-semibold'>Featured</span>
                    <span className='text-xs opacity-70'>
                      Highlight in featured sections
                    </span>
                  </div>
                </Switch>
              )
            }}
          </form.Field>
          <form.Field name='eligibleForRewards'>
            {(field) => {
              const eligibleValue = (field.state.value as boolean) ?? false
              return (
                <Switch
                  isSelected={eligibleValue}
                  onValueChange={field.handleChange}
                  classNames={{
                    wrapper: 'group-data-[selected=true]:bg-amber-400',
                  }}>
                  <div className='flex flex-col gap-px portrait:pl-4'>
                    <span className='text-base font-semibold'>
                      Eligible for Rewards
                    </span>
                    <span className='text-xs opacity-70'>
                      Customers can earn rewards for purchasing this product.
                    </span>
                  </div>
                </Switch>
              )
            }}
          </form.Field>
        </div>
      </div>
    </FormSection>
  )
}
