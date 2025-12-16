'use client'

import {Checkbox, Input} from '@heroui/react'
import {FormData, FormErrors} from '../types'

interface BillingFormProps {
  formData: FormData
  formErrors: FormErrors
  onInputChange: (field: keyof FormData, value: string | boolean) => void
}

export function BillingForm({
  formData,
  formErrors,
  onInputChange,
}: BillingFormProps) {
  return (
    <>
      <div>
        <label className='flex items-center gap-2 cursor-pointer'>
          <Checkbox
            type='checkbox'
            checked={formData.useSameBilling}
            onChange={(e) => onInputChange('useSameBilling', e.target.checked)}
          />
          <span className='text-sm'>Use same address for billing</span>
        </label>
      </div>
      {!formData.useSameBilling && (
        <div>
          <h3 className='text-lg font-semibold mb-4'>Billing Address</h3>
          <div className='grid grid-cols-2 gap-4'>
            <Input
              label='First Name'
              value={formData.billingFirstName}
              onChange={(e) =>
                onInputChange('billingFirstName', e.target.value)
              }
              isRequired
              isInvalid={!!formErrors.billingFirstName}
              errorMessage={formErrors.billingFirstName}
            />
            <Input
              label='Last Name'
              value={formData.billingLastName}
              onChange={(e) => onInputChange('billingLastName', e.target.value)}
              isRequired
              isInvalid={!!formErrors.billingLastName}
              errorMessage={formErrors.billingLastName}
            />
          </div>
          <div className='mt-4 space-y-4'>
            <Input
              label='Address Line 1'
              value={formData.billingAddressLine1}
              onChange={(e) =>
                onInputChange('billingAddressLine1', e.target.value)
              }
              isRequired
              isInvalid={!!formErrors.billingAddressLine1}
              errorMessage={formErrors.billingAddressLine1}
            />
            <Input
              label='Address Line 2 (Optional)'
              value={formData.billingAddressLine2}
              onChange={(e) =>
                onInputChange('billingAddressLine2', e.target.value)
              }
            />
            <div className='grid grid-cols-3 gap-4'>
              <Input
                label='City'
                value={formData.billingCity}
                onChange={(e) => onInputChange('billingCity', e.target.value)}
                isRequired
                isInvalid={!!formErrors.billingCity}
                errorMessage={formErrors.billingCity}
              />
              <Input
                label='State'
                value={formData.billingState}
                onChange={(e) => onInputChange('billingState', e.target.value)}
                isRequired
                isInvalid={!!formErrors.billingState}
                errorMessage={formErrors.billingState}
              />
              <Input
                label='ZIP Code'
                value={formData.billingZipCode}
                onChange={(e) =>
                  onInputChange('billingZipCode', e.target.value)
                }
                isRequired
                isInvalid={!!formErrors.billingZipCode}
                errorMessage={formErrors.billingZipCode}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
