'use client'

import {Input} from '@heroui/react'
import {FormData, FormErrors} from '../types'

interface ShippingFormProps {
  formData: FormData
  formErrors: FormErrors
  onInputChange: (field: keyof FormData, value: string) => void
}

export function ShippingForm({
  formData,
  formErrors,
  onInputChange,
}: ShippingFormProps) {
  return (
    <div>
      <h3 className='text-lg font-semibold mb-4'>Shipping Address</h3>
      <div className='grid grid-cols-2 gap-4'>
        <Input
          label='First Name'
          value={formData.firstName}
          onChange={(e) => onInputChange('firstName', e.target.value)}
          isRequired
          isInvalid={!!formErrors.firstName}
          errorMessage={formErrors.firstName}
        />
        <Input
          label='Last Name'
          value={formData.lastName}
          onChange={(e) => onInputChange('lastName', e.target.value)}
          isRequired
          isInvalid={!!formErrors.lastName}
          errorMessage={formErrors.lastName}
        />
      </div>
      <div className='mt-4 space-y-4'>
        <Input
          label='Address Line 1'
          value={formData.addressLine1}
          onChange={(e) => onInputChange('addressLine1', e.target.value)}
          isRequired
          isInvalid={!!formErrors.addressLine1}
          errorMessage={formErrors.addressLine1}
        />
        <Input
          label='Address Line 2 (Optional)'
          value={formData.addressLine2}
          onChange={(e) => onInputChange('addressLine2', e.target.value)}
        />
        <div className='grid grid-cols-3 gap-4'>
          <Input
            label='City'
            value={formData.city}
            onChange={(e) => onInputChange('city', e.target.value)}
            isRequired
            isInvalid={!!formErrors.city}
            errorMessage={formErrors.city}
          />
          <Input
            label='State'
            value={formData.state}
            onChange={(e) => onInputChange('state', e.target.value)}
            isRequired
            isInvalid={!!formErrors.state}
            errorMessage={formErrors.state}
          />
          <Input
            label='ZIP Code'
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

