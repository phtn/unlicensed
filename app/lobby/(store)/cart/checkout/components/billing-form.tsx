'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
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
          radius='none'
          isSelected={formData.useSameBilling}
          color='default'
          className='rounded-xs'
          classNames={{
            icon: 'size-5 text-white bg-black rounded-xs border-2 border-black',
            wrapper: 'rounded-sm',
            hiddenInput: 'bg-black',
          }}
          onValueChange={handleCheckboxChange}>
          <span className='text-sm font-okxs'>
            Use same address for billing
          </span>
        </Checkbox>
      </div>
      {showBillingFields && (
        <div>
          <h3 className='text-lg font-semibold mb-4'>Billing Address</h3>
          <div className='grid grid-cols-2 gap-2'>
            <Input
              label='First Name'
              value={formData.billingFirstName}
              onChange={handleChange('billingFirstName')}
              isRequired
              spellCheck='false'
              classNames={commonInputClassNames}
              isInvalid={!!formErrors.billingFirstName}
              errorMessage={formErrors.billingFirstName}
              autoFocus={false}
            />
            <Input
              label='Last Name'
              value={formData.billingLastName}
              onChange={handleChange('billingLastName')}
              isRequired
              spellCheck='false'
              classNames={commonInputClassNames}
              isInvalid={!!formErrors.billingLastName}
              errorMessage={formErrors.billingLastName}
              autoFocus={false}
            />
          </div>
          <div className='mt-2 space-y-4'>
            <Input
              label='Address Line 1'
              value={formData.billingAddressLine1}
              onChange={handleChange('billingAddressLine1')}
              isRequired
              spellCheck='false'
              classNames={commonInputClassNames}
              isInvalid={!!formErrors.billingAddressLine1}
              errorMessage={formErrors.billingAddressLine1}
              autoFocus={false}
            />
            <Input
              label='Address Line 2 (Optional)'
              value={formData.billingAddressLine2}
              onChange={handleChange('billingAddressLine2')}
              spellCheck='false'
              classNames={commonInputClassNames}
              autoFocus={false}
            />
            <div className='grid grid-cols-3 gap-4'>
              <Input
                label='City'
                value={formData.billingCity}
                onChange={handleChange('billingCity')}
                isRequired
                spellCheck='false'
                classNames={commonInputClassNames}
                isInvalid={!!formErrors.billingCity}
                errorMessage={formErrors.billingCity}
                autoFocus={false}
              />
              <Input
                label='State'
                value={formData.billingState}
                onChange={handleChange('billingState')}
                isRequired
                spellCheck='false'
                classNames={commonInputClassNames}
                isInvalid={!!formErrors.billingState}
                errorMessage={formErrors.billingState}
                autoFocus={false}
              />
              <Input
                label='ZIP Code'
                value={formData.billingZipCode}
                onChange={handleChange('billingZipCode')}
                isRequired
                spellCheck='false'
                classNames={commonInputClassNames}
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
