'use client'

import {
  TextureCard,
  TextureCardContent,
  TextureCardHeader,
  TextureCardTitle,
} from '@/components/ui/texture-card'
import {Input, Switch} from '@heroui/react'
import {ProductFormApi} from '../product-schema'

interface InventoryProps {
  form: ProductFormApi
}

export const Inventory = ({form}: InventoryProps) => {
  return (
    <TextureCard id='inventory'>
      <TextureCardHeader>
        <TextureCardTitle>Inventory & Status</TextureCardTitle>
      </TextureCardHeader>
      <TextureCardContent className='grid gap-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <form.Field name='stock'>
            {(field) => (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-neutral-300'>
                  Stock Quantity
                </label>
                <Input
                  type='number'
                  value={field.state.value.toString()}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  onBlur={field.handleBlur}
                  min={0}
                  variant='bordered'
                  // classNames={{
                  //   inputWrapper: 'bg-neutral-900 border-neutral-800 data-[hover=true]:border-neutral-700 group-data-[focus=true]:border-emerald-500',
                  // }}
                />
              </div>
            )}
          </form.Field>

          <form.Field name='availableDenominationsRaw'>
            {(field) => (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-neutral-300'>
                  Available Denominations
                </label>
                <Input
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder='e.g. 1, 3.5, 7, 14'
                  variant='bordered'
                  // classNames={{
                  //   inputWrapper: 'bg-neutral-900 border-neutral-800 data-[hover=true]:border-neutral-700 group-data-[focus=true]:border-emerald-500',
                  // }}
                />
                <p className='text-xs text-neutral-500'>
                  Comma separated values
                </p>
              </div>
            )}
          </form.Field>
        </div>

        <div className='flex items-center gap-8 py-2'>
          <form.Field name='available'>
            {(field) => (
              <Switch
                isSelected={field.state.value}
                onValueChange={field.handleChange}
                classNames={{
                  wrapper: 'group-data-[selected=true]:bg-emerald-500',
                }}>
                <div className='flex flex-col gap-0.5'>
                  <span className='text-sm font-medium text-neutral-200'>
                    Available for Sale
                  </span>
                  <span className='text-xs text-neutral-500'>
                    Product is visible in store
                  </span>
                </div>
              </Switch>
            )}
          </form.Field>

          <form.Field name='featured'>
            {(field) => (
              <Switch
                isSelected={field.state.value}
                onValueChange={field.handleChange}
                classNames={{
                  wrapper: 'group-data-[selected=true]:bg-amber-500',
                }}>
                <div className='flex flex-col gap-0.5'>
                  <span className='text-sm font-medium text-neutral-200'>
                    Featured
                  </span>
                  <span className='text-xs text-neutral-500'>
                    Highlight in featured sections
                  </span>
                </div>
              </Switch>
            )}
          </form.Field>
        </div>
      </TextureCardContent>
    </TextureCard>
  )
}
