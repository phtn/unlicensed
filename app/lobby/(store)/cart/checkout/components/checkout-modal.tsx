'use client'

import {AddressType} from '@/convex/users/d'
import {
  Button,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import {FormData, FormErrors} from '../types'
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
  onCreateNewShippingAddress: VoidFunction
  shippingAddresses?: AddressType[]
  selectedShippingAddressId: string | null
  onSelectShippingAddress: (addressId: string) => void
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
  onCreateNewShippingAddress,
  shippingAddresses,
  selectedShippingAddressId,
  onSelectShippingAddress,
  onPlaceOrder,
}: CheckoutModalProps) {
  return (
    <Modal isOpen={isOpen}>
      <ModalBackdrop>
        <ModalContainer
          scroll='inside'
          placement='top'
          className='h-[calc(100lvh)] mt-12 md:mt-10 z-9999'>
          <ModalDialog className='overflow-hidden dark:bg-dark-table'>
            <ModalHeader className='flex flex-col justify-center gap-1 text-base md:text-lg font-medium md:font-semibold bg-foreground dark:bg-foreground/60 text-background h-9 md:h-12 mb-1'>
              Confirm Shipping & Billing Info
            </ModalHeader>
            <ModalBody className='h-full pb-6'>
              <OrderStatusMessages
                isPending={isPending}
                orderError={orderError}
                orderId={orderId}
              />

              <div className='space-y-4 md:space-y-8'>
                <ContactForm
                  formData={formData}
                  formErrors={formErrors}
                  onInputChange={onInputChange}
                />
                <ShippingForm
                  formData={formData}
                  formErrors={formErrors}
                  onInputChange={onInputChange}
                  onCreateNewAddress={onCreateNewShippingAddress}
                  shippingAddresses={shippingAddresses}
                  selectedAddressId={selectedShippingAddressId}
                  onSelectSavedAddress={onSelectShippingAddress}
                />
              </div>
            </ModalBody>
            <ModalFooter className='w-full px-1.5 md:px-4 h-16 md:h-20 flex items-center bg-alum/40 border-t border-dark-table/40 dark:bg-foreground/60'>
              <Button
                size='lg'
                variant='tertiary'
                onPress={onClose}
                className='w-full rounded-xs text-dark-table dark:hover:bg-white/5'
                isDisabled={isLoading || isPending}>
                Cancel
              </Button>
              <Button
                size='lg'
                variant='primary'
                className='w-full rounded-xs bg-black font-polysans font-normal dark:text-white disabled:opacity-50'
                fullWidth
                onPress={onPlaceOrder}
                isDisabled={!!orderId}>
                {orderId ? 'Order Placed!' : 'Pay'}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </ModalBackdrop>
    </Modal>
  )
}
