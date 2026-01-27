'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {Icon} from '@/lib/icons'
import {Input} from '@heroui/react'
import {useCallback} from 'react'
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
  const handleChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onInputChange(field, e.target.value)
    },
    [onInputChange],
  )

  return (
    <div className='space-y-2'>
      <h3 className='flex items-center space-x-1.5 text-lg font-semibold my-3 tracking-tighter'>
        <Icon name='pin' className='size-6 opacity-80' />
        <span className='whitespace-nowrap'>Shipping Address</span>
      </h3>

      <div className='grid grid-cols-2 gap-1'>
        <Input
          label='First Name'
          radius='sm'
          value={formData.firstName}
          onChange={handleChange('firstName')}
          isRequired
          classNames={commonInputClassNames}
          isInvalid={!!formErrors.firstName}
          errorMessage={formErrors.firstName}
          autoFocus={false}
        />
        <Input
          label='Last Name'
          radius='sm'
          value={formData.lastName}
          onChange={handleChange('lastName')}
          isRequired
          classNames={commonInputClassNames}
          isInvalid={!!formErrors.lastName}
          errorMessage={formErrors.lastName}
          autoFocus={false}
        />
      </div>
      <div className='mt-1 space-y-1'>
        <Input
          label='Address Line 1'
          radius='sm'
          value={formData.addressLine1}
          onChange={handleChange('addressLine1')}
          isRequired
          classNames={commonInputClassNames}
          isInvalid={!!formErrors.addressLine1}
          errorMessage={formErrors.addressLine1}
        />
        <Input
          label='Address Line 2 (Optional)'
          radius='sm'
          classNames={commonInputClassNames}
          value={formData.addressLine2}
          onChange={handleChange('addressLine2')}
          autoFocus={false}
        />
        <div className='grid grid-cols-3 gap-1'>
          <Input
            label='City'
            radius='sm'
            value={formData.city}
            onChange={handleChange('city')}
            isRequired
            classNames={commonInputClassNames}
            errorMessage={formErrors.city}
            autoFocus={false}
          />
          <Input
            label='State'
            radius='sm'
            value={formData.state}
            onChange={handleChange('state')}
            isRequired
            classNames={commonInputClassNames}
            isInvalid={!!formErrors.state}
            errorMessage={formErrors.state}
            autoFocus={false}
          />
          <Input
            label='ZIP Code'
            radius='sm'
            value={formData.zipCode}
            onChange={handleChange('zipCode')}
            isRequired
            classNames={commonInputClassNames}
            isInvalid={!!formErrors.zipCode}
            errorMessage={formErrors.zipCode}
            autoFocus={false}
          />
        </div>
      </div>
    </div>
  )
}
