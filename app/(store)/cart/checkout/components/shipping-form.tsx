'use client'

import {Icon} from '@/lib/icons'
import {Checkbox, Input} from '@heroui/react'
import {FormData, FormErrors} from '../types'

interface ShippingFormProps {
  formData: FormData
  formErrors: FormErrors
  onInputChange: (field: keyof FormData, value: string | boolean) => void
}

export function ShippingForm({
  formData,
  formErrors,
  onInputChange,
}: ShippingFormProps) {
  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <h3 className='flex items-center space-x-1.5 text-lg font-semibold my-3 tracking-tighter'>
          <Icon name='pin' className='size-6 opacity-80' />
          <span className='whitespace-nowrap'>Shipping Address</span>
        </h3>
        <div>
          <label className='flex items-center gap-2 cursor-pointer'>
            <span className='text-sm whitespace-nowrap'>Same for billing</span>
            <Checkbox
              type='checkbox'
              radius='sm'
              checked={formData.useSameBilling}
              onChange={(e) =>
                onInputChange('useSameBilling', e.target.checked)
              }
            />
          </label>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-1'>
        <Input
          label='First Name'
          radius='sm'
          value={formData.firstName}
          onChange={(e) => onInputChange('firstName', e.target.value)}
          isRequired
          isInvalid={!!formErrors.firstName}
          errorMessage={formErrors.firstName}
        />
        <Input
          label='Last Name'
          radius='sm'
          value={formData.lastName}
          onChange={(e) => onInputChange('lastName', e.target.value)}
          isRequired
          isInvalid={!!formErrors.lastName}
          errorMessage={formErrors.lastName}
        />
      </div>
      <div className='mt-1 space-y-1'>
        <Input
          label='Address Line 1'
          radius='sm'
          value={formData.addressLine1}
          onChange={(e) => onInputChange('addressLine1', e.target.value)}
          isRequired
          isInvalid={!!formErrors.addressLine1}
          errorMessage={formErrors.addressLine1}
        />
        <Input
          label='Address Line 2 (Optional)'
          radius='sm'
          value={formData.addressLine2}
          onChange={(e) => onInputChange('addressLine2', e.target.value)}
        />
        <div className='grid grid-cols-3 gap-1'>
          <Input
            label='City'
            radius='sm'
            value={formData.city}
            onChange={(e) => onInputChange('city', e.target.value)}
            isRequired
            isInvalid={!!formErrors.city}
            errorMessage={formErrors.city}
          />
          <Input
            label='State'
            radius='sm'
            value={formData.state}
            onChange={(e) => onInputChange('state', e.target.value)}
            isRequired
            isInvalid={!!formErrors.state}
            errorMessage={formErrors.state}
          />
          <Input
            label='ZIP Code'
            radius='sm'
            value={formData.zipCode}
            onChange={(e) => onInputChange('zipCode', e.target.value)}
            isRequired
            isInvalid={!!formErrors.zipCode}
            errorMessage={formErrors.zipCode}
          />
        </div>
      </div>
    </div>
  )
}
