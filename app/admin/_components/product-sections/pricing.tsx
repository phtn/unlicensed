'use client'

import {
  TextureCard,
  TextureCardContent,
  TextureCardHeader,
  TextureCardTitle,
} from '@/components/ui/texture-card'
import {Input} from '@heroui/react'
import {ProductFormApi} from '../product-schema'

interface PricingProps {
  form: ProductFormApi
}

export const Pricing = ({form}: PricingProps) => {
  return (
    <TextureCard id='pricing'>
      <TextureCardHeader>
        <TextureCardTitle>Pricing</TextureCardTitle>
      </TextureCardHeader>
      <TextureCardContent className='grid gap-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <form.Field name='priceCents'>
            {(field) => (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-neutral-300'>
                  Base Price
                </label>
                <Input
                  type='number'
                  value={field.state.value.toString()}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  onBlur={field.handleBlur}
                  startContent={
                    <span className='text-neutral-500 text-sm'>$</span>
                  }
                  placeholder='0.00'
                  variant='bordered'
                  // classNames={{
                  //   inputWrapper: 'bg-neutral-900 border-neutral-800 data-[hover=true]:border-neutral-700 group-data-[focus=true]:border-emerald-500',
                  // }}
                />
                {field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0 && (
                    <p className='text-xs text-rose-400'>
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
              </div>
            )}
          </form.Field>

          <form.Field name='unit'>
            {(field) => (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-neutral-300'>
                  Unit
                </label>
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder='e.g. 3.5g, each'
                  variant='bordered'
                  // classNames={{
                  //   inputWrapper: 'bg-neutral-900 border-neutral-800 data-[hover=true]:border-neutral-700 group-data-[focus=true]:border-emerald-500',
                  // }}
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name='variants'>
          {(field) => {
            const variants = field.state.value || []
            return (
              <div className='space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/30 p-4'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium text-neutral-300'>
                    Variants & Pricing
                  </label>
                  <span className='text-xs text-neutral-500'>
                    Optional override per unit
                  </span>
                </div>

                {variants.length > 0 ? (
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                    {variants.map((variant, index) => (
                      <div key={index} className='space-y-1.5'>
                        <span className='text-xs text-neutral-400 ml-1'>
                          {variant.label}
                        </span>
                        <Input
                          type='number'
                          value={variant.price.toString()}
                          onChange={(e) => {
                            const newVariants = [...variants]
                            newVariants[index] = {
                              ...variant,
                              price: Number(e.target.value),
                            }
                            field.handleChange(newVariants)
                          }}
                          startContent={
                            <span className='text-neutral-500 text-xs'>$</span>
                          }
                          size='sm'
                          variant='bordered'
                          // classNames={{
                          //   inputWrapper: 'bg-neutral-900 border-neutral-800',
                          // }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-4 text-xs text-neutral-500'>
                    No variants configured. (Auto-populated for Flower
                    categories)
                  </div>
                )}
              </div>
            )
          }}
        </form.Field>
      </TextureCardContent>
    </TextureCard>
  )
}
