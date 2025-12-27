'use client'

import {Checkbox, Input} from '@heroui/react'
import {useCallback, useMemo} from 'react'
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
  const showBillingFields = useMemo(
    () => !formData.useSameBilling,
    [formData.useSameBilling],
  )

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      onInputChange('useSameBilling', checked)
    },
    [onInputChange],
  )

  const handleChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onInputChange(field, e.target.value)
    },
    [onInputChange],
  )

  return (
    <>
      <div>
        <Checkbox
          isSelected={formData.useSameBilling}
          onValueChange={handleCheckboxChange}>
          <span className='text-sm'>Use same address for billing</span>
        </Checkbox>
      </div>
      {showBillingFields && (
        <div>
          <h3 className='text-lg font-semibold mb-4'>Billing Address</h3>
          <div className='grid grid-cols-2 gap-4'>
            <Input
              label='First Name'
              value={formData.billingFirstName}
              onChange={handleChange('billingFirstName')}
              isRequired
              isInvalid={!!formErrors.billingFirstName}
              errorMessage={formErrors.billingFirstName}
              autoFocus={false}
            />
            <Input
              label='Last Name'
              value={formData.billingLastName}
              onChange={handleChange('billingLastName')}
              isRequired
              isInvalid={!!formErrors.billingLastName}
              errorMessage={formErrors.billingLastName}
              autoFocus={false}
            />
          </div>
          <div className='mt-4 space-y-4'>
            <Input
              label='Address Line 1'
              value={formData.billingAddressLine1}
              onChange={handleChange('billingAddressLine1')}
              isRequired
              isInvalid={!!formErrors.billingAddressLine1}
              errorMessage={formErrors.billingAddressLine1}
              autoFocus={false}
            />
            <Input
              label='Address Line 2 (Optional)'
              value={formData.billingAddressLine2}
              onChange={handleChange('billingAddressLine2')}
              autoFocus={false}
            />
            <div className='grid grid-cols-3 gap-4'>
              <Input
                label='City'
                value={formData.billingCity}
                onChange={handleChange('billingCity')}
                isRequired
                isInvalid={!!formErrors.billingCity}
                errorMessage={formErrors.billingCity}
                autoFocus={false}
              />
              <Input
                label='State'
                value={formData.billingState}
                onChange={handleChange('billingState')}
                isRequired
                isInvalid={!!formErrors.billingState}
                errorMessage={formErrors.billingState}
                autoFocus={false}
              />
              <Input
                label='ZIP Code'
                value={formData.billingZipCode}
                onChange={handleChange('billingZipCode')}
                isRequired
                isInvalid={!!formErrors.billingZipCode}
                errorMessage={formErrors.billingZipCode}
                autoFocus={false}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
