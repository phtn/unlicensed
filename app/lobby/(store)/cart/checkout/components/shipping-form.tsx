'use client'

import {AddressType} from '@/convex/users/d'
import {useMobile} from '@/hooks/use-mobile'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Input} from '@heroui/react'
import {useCallback} from 'react'
import {FormData, FormErrors} from '../types'

interface ShippingFormProps {
  formData: FormData
  formErrors: FormErrors
  onInputChange: (field: keyof FormData, value: string | boolean) => void
  onCreateNewAddress: VoidFunction
  shippingAddresses?: AddressType[]
  selectedAddressId?: string | null
  onSelectSavedAddress: (addressId: string) => void
}

export function ShippingForm({
  formData,
  formErrors,
  onInputChange,
  onCreateNewAddress,
  shippingAddresses,
  selectedAddressId,
  onSelectSavedAddress,
}: ShippingFormProps) {
  const handleChange = useCallback(
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onInputChange(field, e.target.value)
    },
    [onInputChange],
  )

  const isMobile = useMobile()
  const hasSavedAddresses = !!shippingAddresses?.length

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-4'>
          <h3 className='flex items-center space-x-1.5 text-lg font-medium my-3 opacity-80'>
            <Icon name='mailbox-fill' className='size-5' />
            <span className='whitespace-nowrap'>Shipping Address</span>
          </h3>
          {hasSavedAddresses &&
            shippingAddresses.map((address, index) => {
              const isSelected = address.id === selectedAddressId
              return (
                <Button
                  key={address.id}
                  size='sm'
                  variant='tertiary'
                  onPress={() => onSelectSavedAddress(address.id)}
                  className={cn(
                    'font-medium min-w-8 px-2 bg-transparent border border-foreground/25',
                    {'bg-sidebar': isSelected},
                  )}>
                  {index + 1}
                </Button>
              )
            })}
        </div>
        <div className='flex items-center gap-1'>
          <Button
            variant='primary'
            onPress={onCreateNewAddress}
            isIconOnly={isMobile}
            className='border-none flex items-center rounded-sm font-okxs dark:bg-white dark:text-dark-gray h-6 px-0 md:px-1'>
            <Icon name='plus' className='size-4' />
            <span className='hidden md:flex'>New</span>
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-1'>
        <Input
          required
          placeholder='First Name'
          value={formData.firstName}
          onChange={handleChange('firstName')}
          autoFocus={false}
        />
        <Input
          placeholder='Last Name'
          value={formData.lastName}
          onChange={handleChange('lastName')}
          required
          autoFocus={false}
        />
      </div>
      <div className='mt-1 space-y-1'>
        <Input
          placeholder='Address Line 1'
          value={formData.addressLine1}
          onChange={handleChange('addressLine1')}
          required
        />
        <Input
          placeholder='Address Line 2 (Optional)'
          value={formData.addressLine2}
          onChange={handleChange('addressLine2')}
          autoFocus={false}
        />
        <div className='grid grid-cols-3 gap-1'>
          <Input
            placeholder='City'
            value={formData.city}
            onChange={handleChange('city')}
            required
            autoFocus={false}
          />
          <Input
            placeholder='State'
            value={formData.state}
            onChange={handleChange('state')}
            required
            autoFocus={false}
          />
          <Input
            placeholder='ZIP Code'
            value={formData.zipCode}
            onChange={handleChange('zipCode')}
            required
            autoFocus={false}
          />
        </div>
      </div>
    </div>
  )
}
