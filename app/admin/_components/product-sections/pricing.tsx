'use client'

import {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {Input, Select, SelectItem} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useEffect, useMemo, useRef} from 'react'
import {mapFractions, ProductFormApi} from '../product-schema'
import {commonInputClassNames} from '../ui/fields'
import {FormSection, Header} from './components'

function extractDenominationFromLabel(label: string): string | null {
  const match = label.match(/^(\d+\.?\d*)/)
  if (match) {
    const num = Number.parseFloat(match[1])
    return Number.isNaN(num) ? null : String(num)
  }
  return null
}

interface PricingProps {
  form: ProductFormApi
  categories?: Doc<'categories'>[]
  /** When true (editing), we only auto-fill variants when empty. When false (creating), we always sync variants to the selected category's denominations. */
  isEditMode?: boolean
}

export const Pricing = ({
  form,
  categories,
  isEditMode = false,
}: PricingProps) => {
  const categorySlug = useStore(form.store, (state) => {
    const values = state.values as {categorySlug?: string}
    return values.categorySlug
  })

  const selectedCategory = useMemo(() => {
    if (!categories || !categorySlug) return null
    return categories.find((c) => c.slug === categorySlug) ?? null
  }, [categories, categorySlug])

  const lastAppliedCategorySlugRef = useRef<string | null>(null)

  // Reflect category's denominations only: when creating, sync variants when category is selected or changes so only that category's options (e.g. 1, 3, 7 for Extracts) appear. When editing, only fill when variants are empty. Don't overwrite on every run or we'd wipe price edits.
  useEffect(() => {
    if (!selectedCategory) {
      lastAppliedCategorySlugRef.current = null
      return
    }

    const units = selectedCategory.units ?? []
    const denominations = selectedCategory.denominations ?? []

    const currentUnit = (form.getFieldValue('unit') as string) ?? ''
    if (units.length > 0 && !currentUnit.trim()) {
      form.setFieldValue('unit', units[0])
    }

    if (units.length === 0 || denominations.length === 0) return

    const currentVariants = form.getFieldValue('variants') as
      | Array<{label: string; price: number}>
      | undefined
    const isEmpty =
      !currentVariants ||
      !Array.isArray(currentVariants) ||
      currentVariants.length === 0

    const slug = selectedCategory.slug ?? null
    const categoryChanged = lastAppliedCategorySlugRef.current !== slug
    if (categoryChanged) {
      lastAppliedCategorySlugRef.current = slug
    }

    const shouldApply = isEmpty || (isEditMode ? false : categoryChanged)
    if (!shouldApply) return

    const primaryUnit = units[0]
    const generatedVariants = denominations.map((denomination) => ({
      label: `${denomination}${primaryUnit}`,
      price: 0,
    }))

    form.setFieldValue('variants', generatedVariants)
    form.setFieldValue(
      'availableDenominationsRaw',
      denominations.map(String).join(', '),
    )
    const currentStock =
      (form.getFieldValue('stockByDenomination') as
        | Record<string, number>
        | undefined) ?? {}
    const next: Record<string, number> = {...currentStock}
    for (const d of denominations) {
      const key = String(d)
      if (next[key] === undefined) next[key] = 0
    }
    form.setFieldValue('stockByDenomination', next)
    const currentPrices =
      (form.getFieldValue('priceByDenomination') as
        | Record<string, number>
        | undefined) ?? {}
    const nextPrices: Record<string, number> = {...currentPrices}
    for (const d of denominations) {
      const key = String(d)
      if (nextPrices[key] === undefined) nextPrices[key] = 0
    }
    form.setFieldValue('priceByDenomination', nextPrices)
  }, [selectedCategory, form, isEditMode])
  return (
    <FormSection id='pricing'>
      <Header label='Pricing' />
      <div className='grid gap-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/*{renderFields(form, fields, flowerDenominations)}*/}
          <form.AppField name='priceCents'>
            {(field) => (
              <div className='space-y-2'>
                <Input
                  label='Base Price'
                  type='number'
                  value={String(field.state.value ?? '')}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  onBlur={field.handleBlur}
                  startContent={
                    <Icon name='dollar' className='size-5 mb-0.5' />
                  }
                  placeholder='0.00'
                  variant='bordered'
                  classNames={commonInputClassNames}
                />
                {field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0 && (
                    <p className='text-xs text-rose-400'>
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
              </div>
            )}
          </form.AppField>

          <form.AppField name='unit'>
            {(field) => {
              const unitValue = (field.state.value as string) ?? ''
              const categoryUnits = selectedCategory?.units ?? []
              const hasCategoryUnits = categoryUnits.length > 0
              return (
                <div className='space-y-2'>
                  {hasCategoryUnits ? (
                    <Select
                      label='Unit'
                      selectedKeys={unitValue ? [unitValue] : []}
                      onSelectionChange={(keys) => {
                        const key = Array.from(keys)[0]
                        field.handleChange(key != null ? String(key) : '')
                      }}
                      onBlur={field.handleBlur}
                      placeholder='Select unit'
                      variant='bordered'
                      classNames={{
                        ...commonInputClassNames,
                        trigger:
                          'border h-16 border-light-gray/50 dark:border-black/20 bg-light-gray/10 shadow-none dark:bg-black/60 rounded-lg p-2 outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500',
                        label:
                          'mb-2 pl-0.5 opacity-80 font-medium tracking-widest uppercase text-sm',
                      }}
                      disallowEmptySelection={false}>
                      {categoryUnits.map((u) => (
                        <SelectItem key={u} textValue={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      label='Unit of Measurement'
                      value={unitValue}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder='e.g. g, oz, each'
                      variant='bordered'
                      classNames={commonInputClassNames}
                    />
                  )}
                  {field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0 && (
                      <p className='text-xs text-rose-400'>
                        {field.state.meta.errors.join(', ')}
                      </p>
                    )}
                </div>
              )
            }}
          </form.AppField>
        </div>

        <form.Field name='variants'>
          {(variantsField) => {
            const variants =
              (variantsField.state.value as
                | Array<{label: string; price: number}>
                | undefined) || []
            return (
              <div className='space-y-3 p-4'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>
                    Price by Denomination
                  </label>
                  <span className='text-xs'>Price per size (from category)</span>
                </div>

                {variants.length > 0 ? (
                  <form.Field name='priceByDenomination'>
                    {(priceField) => {
                      const priceByDenomination =
                        (priceField.state.value as Record<string, number>) ?? {}
                      return (
                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4'>
                          {variants.map((variant) => {
                            const denomKey =
                              extractDenominationFromLabel(variant.label)
                            if (denomKey == null) return null
                            const value = priceByDenomination[denomKey] ?? 0
                            return (
                              <Input
                                key={variant.label}
                                type='number'
                                label={
                                  mapFractions[variant.label] ?? variant.label
                                }
                                value={String(value)}
                                onChange={(e) => {
                                  const next = {
                                    ...priceByDenomination,
                                    [denomKey]: Number(e.target.value) || 0,
                                  }
                                  priceField.handleChange(next)
                                }}
                                onBlur={priceField.handleBlur}
                                startContent={
                                  <Icon
                                    name='dollar'
                                    className='size-4 opacity-80 mb-1 -mr-2'
                                  />
                                }
                                size='sm'
                                variant='bordered'
                                classNames={{
                                  ...commonInputClassNames,
                                  label: 'mb-4 ml-1',
                                }}
                              />
                            )
                          })}
                        </div>
                      )
                    }}
                  </form.Field>
                ) : (
                  <div className='text-center py-4 text-xs'>
                    {selectedCategory?.units && selectedCategory?.denominations
                      ? 'Variants will be auto-generated based on category settings.'
                      : 'No variants configured. Select a category with units and denominations to auto-generate variants.'}
                  </div>
                )}
              </div>
            )
          }}
        </form.Field>
      </div>
    </FormSection>
  )
}
