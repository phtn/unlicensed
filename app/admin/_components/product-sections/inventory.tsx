'use client'

import {Input, Switch} from '@heroui/react'
import {ProductFormApi} from '../product-schema'
import {commonInputClassNames} from '../ui/fields'
import {FormSection, Header} from './components'

interface InventoryProps {
  form: ProductFormApi
}

export const Inventory = ({form}: InventoryProps) => {
  return (
    <FormSection id='inventory'>
      <Header label='Inventory & Status' />
      <div className='grid gap-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <form.Field name='stock'>
            {(field) => {
              const stockValue = (field.state.value as number) ?? 0
              return (
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-neutral-300'></label>
                  <Input
                    label='Stock Quantity'
                    type='number'
                    value={String(stockValue ?? 0)}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    onBlur={field.handleBlur}
                    min={0}
                    variant='bordered'
                    classNames={commonInputClassNames}
                  />
                </div>
              )
            }}
          </form.Field>

          <form.Field name='availableDenominationsRaw'>
            {(field) => {
              const denominationsValue = (field.state.value as string) ?? ''
              return (
                <div className='space-y-2'>
                  <Input
                    label='Available Denominations'
                    value={denominationsValue}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder='e.g. 1, 3.5, 7, 14'
                    variant='bordered'
                    classNames={commonInputClassNames}
                  />
                  <p className='text-xs'>Comma separated values</p>
                </div>
              )
            }}
          </form.Field>
        </div>

        <div className='grid grid-cols-4 items-center gap-8 py-2'>
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
                  <div className='flex flex-col gap-px'>
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
                    wrapper: 'group-data-[selected=true]:bg-amber-500',
                  }}>
                  <div className='flex flex-col gap-px'>
                    <span className='text-base font-semibold'>Featured</span>
                    <span className='text-xs opacity-70'>
                      Highlight in featured sections
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
