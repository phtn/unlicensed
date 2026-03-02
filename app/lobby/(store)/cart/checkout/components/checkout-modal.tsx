'use client'

import {AddressType} from '@/convex/users/d'
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size='2xl'
      radius='sm'
      scrollBehavior='inside'
      className=''
      classNames={{
        wrapper: 'h-[calc(100lvh)] mt-12 md:mt-10 z-9999',
        body: 'h-full p-2 md:p-4',
        backdrop: 'bg-black/50',
      }}
      placement='top'>
      <ModalContent className='overflow-hidden dark:bg-dark-table'>
        {(onClose) => (
          <>
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
                radius='none'
                variant='light'
                onPress={onClose}
                className='w-full rounded-lg text-dark-table dark:hover:bg-white/5'
                isDisabled={isLoading || isPending}>
                Cancel
              </Button>
              <Button
                size='lg'
                radius='none'
                color='primary'
                variant='solid'
                className='w-full rounded-lg bg-black font-polysans font-normal dark:text-white disabled:opacity-50'
                fullWidth
                onPress={onPlaceOrder}
                endContent={
                  <Icon
                    name={
                      isLoading || isPending
                        ? 'spinners-ring'
                        : 'hand-card-fill'
                    }
                    className='size-6 md:size-8'
                  />
                }
                isDisabled={!!orderId}>
                {orderId ? 'Order Placed!' : 'Pay'}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
