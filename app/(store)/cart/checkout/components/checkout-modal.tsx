'use client'

import {Icon} from '@/lib/icons'
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import {useEffect} from 'react'
import {FormData, FormErrors} from '../types'
import {BillingForm} from './billing-form'
import {ContactForm} from './contact-form'
import {OrderStatusMessages} from './order-status-messages'
import {ShippingForm} from './shipping-form'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: VoidFunction
  formData: FormData
  formErrors: FormErrors
  isPending: boolean
  isLoading: boolean
  orderError: Error | null
  orderId: string | null
  onInputChange: (field: keyof FormData, value: string | boolean) => void
  onPlaceOrder: () => void
}

export function CheckoutModal({
  isOpen,
  onClose,
  formData,
  formErrors,
  isPending,
  isLoading,
  orderError,
  orderId,
  onInputChange,
  onPlaceOrder,
}: CheckoutModalProps) {
  // Set default test values when modal opens and fields are empty
  useEffect(() => {
    if (isOpen && !orderId) {
      // Always set useSameBilling to true by default when modal opens
      if (!formData.useSameBilling) {
        onInputChange('useSameBilling', true)
      }
      
      // Always set payment method to credit_card by default when modal opens
      if (formData.paymentMethod !== 'credit_card') {
        onInputChange('paymentMethod', 'credit_card')
      }
      
      // Only populate if fields are empty (check once when modal opens)
      const hasEmptyFields =
        !formData.contactEmail.trim() ||
        !formData.contactPhone.trim() ||
        !formData.firstName.trim() ||
        !formData.lastName.trim() ||
        !formData.addressLine1.trim() ||
        !formData.city.trim() ||
        !formData.state.trim() ||
        !formData.zipCode.trim()

      if (hasEmptyFields) {
        
        // Set test values for empty fields
        if (!formData.contactEmail.trim()) {
          onInputChange('contactEmail', 'test@example.com')
        }
        if (!formData.contactPhone.trim()) {
          onInputChange('contactPhone', '555-123-4567')
        }
        if (!formData.firstName.trim()) {
          onInputChange('firstName', 'John')
        }
        if (!formData.lastName.trim()) {
          onInputChange('lastName', 'Doe')
        }
        if (!formData.addressLine1.trim()) {
          onInputChange('addressLine1', '123 Test Street')
        }
        if (!formData.addressLine2.trim()) {
          onInputChange('addressLine2', 'Apt 4B')
        }
        if (!formData.city.trim()) {
          onInputChange('city', 'Los Angeles')
        }
        if (!formData.state.trim()) {
          onInputChange('state', 'CA')
        }
        if (!formData.zipCode.trim()) {
          onInputChange('zipCode', '90001')
        }
        if (!formData.country.trim()) {
          onInputChange('country', 'US')
        }
        if (!formData.billingFirstName.trim()) {
          onInputChange('billingFirstName', 'John')
        }
        if (!formData.billingLastName.trim()) {
          onInputChange('billingLastName', 'Doe')
        }
        if (!formData.billingAddressLine1.trim()) {
          onInputChange('billingAddressLine1', '123 Test Street')
        }
        if (!formData.billingAddressLine2.trim()) {
          onInputChange('billingAddressLine2', 'Apt 4B')
        }
        if (!formData.billingCity.trim()) {
          onInputChange('billingCity', 'Los Angeles')
        }
        if (!formData.billingState.trim()) {
          onInputChange('billingState', 'CA')
        }
        if (!formData.billingZipCode.trim()) {
          onInputChange('billingZipCode', '90001')
        }
        if (!formData.billingCountry.trim()) {
          onInputChange('billingCountry', 'US')
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, orderId])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size='2xl'
      radius='sm'
      scrollBehavior='inside'
      className=''
      classNames={{wrapper: 'mt-16'}}
      placement='top'>
      <ModalContent className='overflow-hidden dark:bg-dark-table'>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col justify-center gap-1 text-lg font-semibold tracking-tight bg-foreground dark:bg-foreground/60 text-background h-12 mb-1'>
              Customer Shipping and Billing
            </ModalHeader>
            <ModalBody>
              <OrderStatusMessages
                isPending={isPending}
                orderError={orderError}
                orderId={orderId}
              />

              <div className='space-y-8'>
                <ContactForm
                  formData={formData}
                  formErrors={formErrors}
                  onInputChange={onInputChange}
                />

                <ShippingForm
                  formData={formData}
                  formErrors={formErrors}
                  onInputChange={onInputChange}
                />

                <BillingForm
                  formData={formData}
                  formErrors={formErrors}
                  onInputChange={onInputChange}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                size='lg'
                variant='light'
                onPress={onClose}
                className='px-8'
                isDisabled={isLoading || isPending}>
                Cancel
              </Button>
              <Button
                color='primary'
                className='bg-featured font-medium dark:text-background tracking-tighter text-base'
                onPress={onPlaceOrder}
                endContent={
                  <Icon
                    name={
                      isLoading || isPending ? 'spinners-ring' : 'arrow-down'
                    }
                    className='-rotate-45 size-6 md:size-8'
                  />
                }
                isDisabled={!!orderId}>
                {orderId ? 'Order Placed!' : 'Proceed to Payment'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
