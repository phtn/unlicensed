'use client'

import {
  Button,
  Divider,
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
      scrollBehavior='inside'
      placement='center'>
      <ModalContent className='overflow-hidden'>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col gap-1 text-xl font-bold tracking-tight bg-foreground text-background'>
              Customer Shipping and Billing
            </ModalHeader>
            <ModalBody>
              <OrderStatusMessages
                isPending={isPending}
                orderError={orderError}
                orderId={orderId}
              />

              <div className='space-y-6'>
                <ContactForm
                  formData={formData}
                  formErrors={formErrors}
                  onInputChange={onInputChange}
                />

                <Divider />

                <ShippingForm
                  formData={formData}
                  formErrors={formErrors}
                  onInputChange={onInputChange}
                />

                <Divider />

                <BillingForm
                  formData={formData}
                  formErrors={formErrors}
                  onInputChange={onInputChange}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant='light'
                size='lg'
                onPress={onClose}
                isDisabled={isLoading || isPending}>
                Cancel
              </Button>
              <Button
                color='primary'
                size='lg'
                onPress={onPlaceOrder}
                isLoading={isLoading || isPending}
                isDisabled={!!orderId}>
                {orderId ? 'Order Placed!' : 'Place Order'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
