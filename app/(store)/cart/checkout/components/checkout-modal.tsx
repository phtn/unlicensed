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
                isLoading={isLoading || isPending}
                endContent={
                  <Icon name='arrow-down' className='-rotate-45 size-8' />
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
