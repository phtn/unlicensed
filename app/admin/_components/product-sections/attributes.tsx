'use client'

import {
  TextureCard,
  TextureCardContent,
  TextureCardHeader,
  TextureCardTitle,
} from '@/components/ui/texture-card'
import {Input, Select, SelectItem} from '@heroui/react'
import {ProductFormApi} from '../product-schema'
import {TagSelector} from '../tag-selector'

interface AttributesProps {
  form: ProductFormApi
}

export const Attributes = ({form}: AttributesProps) => {
  return (
    <TextureCard id='attributes'>
      <TextureCardHeader>
        <TextureCardTitle>Attributes & Profile</TextureCardTitle>
      </TextureCardHeader>
      <TextureCardContent className='grid gap-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <form.Field name='potencyLevel'>
            {(field) => (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-neutral-300'>
                  Potency Level
                </label>
                <Select
                  selectedKeys={[field.state.value]}
                  onChange={(e) => field.handleChange(e.target.value as any)}
                  // classNames={{
                  //   trigger: 'bg-neutral-900 border border-neutral-800',
                  //   popoverContent: 'bg-neutral-900 border border-neutral-800',
                  // }}
                >
                  <SelectItem key='mild'>Mild</SelectItem>
                  <SelectItem key='medium'>Medium</SelectItem>
                  <SelectItem key='high'>High</SelectItem>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name='thcPercentage'>
            {(field) => (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-neutral-300'>
                  THC %
                </label>
                <Input
                  type='number'
                  step='0.1'
                  value={field.state.value.toString()}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                  variant='bordered'
                  // classNames={{
                  //   inputWrapper: 'bg-neutral-900 border-neutral-800',
                  // }}
                />
              </div>
            )}
          </form.Field>

          <form.Field name='cbdPercentage'>
            {(field) => (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-neutral-300'>
                  CBD %
                </label>
                <Input
                  type='number'
                  step='0.1'
                  value={field.state.value ?? ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  variant='bordered'
                  // classNames={{
                  //   inputWrapper: 'bg-neutral-900 border-neutral-800',
                  // }}
                />
              </div>
            )}
          </form.Field>
        </div>

        <form.Field name='terpenes'>
          {(field) => (
            <div className='space-y-2'>
              <TagSelector
                label='Terpenes'
                type='terpene'
                placeholder='Select terpenes...'
                selectedKeys={field.state.value || []}
                onSelectionChange={(keys) => field.handleChange(keys)}
              />
            </div>
          )}
        </form.Field>

        <form.Field name='flavors'>
          {(field) => (
            <div className='space-y-2'>
              <TagSelector
                label='Flavors'
                type='flavor'
                placeholder='Select flavors...'
                selectedKeys={field.state.value || []}
                onSelectionChange={(keys) => field.handleChange(keys)}
              />
            </div>
          )}
        </form.Field>
      </TextureCardContent>
    </TextureCard>
  )
}
