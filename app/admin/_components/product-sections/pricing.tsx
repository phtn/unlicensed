'use client'

import {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {Input} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useEffect, useMemo} from 'react'
import {mapFractions, ProductFormApi} from '../product-schema'
import {commonInputClassNames} from '../ui/fields'
import {FormSection, Header} from './components'

interface PricingProps {
  form: ProductFormApi
  categories?: Doc<'categories'>[]
}

export const Pricing = ({form, categories}: PricingProps) => {
  // Get categorySlug reactively from form store
  const categorySlug = useStore(form.store, (state) => {
    const values = state.values as {categorySlug?: string}
    return values.categorySlug
  })

  const selectedCategory = useMemo(() => {
    if (!categories || !categorySlug) return null
    return categories.find((c) => c.slug === categorySlug) ?? null
  }, [categories, categorySlug])

  // Generate variants based on category denominations and units
  useEffect(() => {
    if (!selectedCategory) return

    const units = selectedCategory.units ?? []
    const denominations = selectedCategory.denominations ?? []

    // Only generate variants if both units and denominations exist
    if (units.length === 0 || denominations.length === 0) return

    // Generate variant labels by combining denominations with units
    const generatedVariants = denominations.flatMap((denomination) =>
      units.map((unit) => ({
        label: `${denomination}${unit}`,
        price: 0, // Default price, user can edit
      })),
    )

    // Only update if variants haven't been set yet or are empty
    const currentVariants = form.getFieldValue('variants')
    const isEmpty =
      !currentVariants ||
      !Array.isArray(currentVariants) ||
      currentVariants.length === 0
    if (isEmpty) {
      form.setFieldValue('variants', generatedVariants)
    }
  }, [selectedCategory, form])
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
              return (
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-neutral-300'></label>
                  <Input
                    label='Unit of Measurement'
                    value={unitValue}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder='e.g. 3.5g, each'
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
              )
            }}
          </form.AppField>
        </div>

        <form.Field name='variants'>
          {(field) => {
            const variants =
              (field.state.value as
                | Array<{label: string; price: number}>
                | undefined) || []
            return (
              <div className='space-y-3 p-4'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium'>
                    Variants & Pricing
                  </label>
                  <span className='text-xs'>Optional override per unit</span>
                </div>

                {variants.length > 0 ? (
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
                    {variants.map((variant, index) => (
                      <Input
                        key={variant.label}
                        type='number'
                        label={mapFractions[variant.label] ?? variant.label}
                        value={String(variant.price ?? '')}
                        onChange={(e) => {
                          const newVariants = [...variants]
                          newVariants[index] = {
                            ...variant,
                            price: Number(e.target.value) || 0,
                          }
                          field.handleChange(newVariants)
                        }}
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
                    ))}
                  </div>
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
