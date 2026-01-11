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

interface DevelopmentModeModalProps {
  isOpen: boolean
  onClose: VoidFunction
  onRedirect: VoidFunction
}

export function DevelopmentModeModal({
  isOpen,
  onClose,
  onRedirect,
}: DevelopmentModeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size='md'
      radius='sm'
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      hideCloseButton={true}
      placement='center'>
      <ModalContent className='overflow-hidden dark:bg-dark-table'>
        {(onClose) => (
          <>
            <ModalHeader className='flex flex-col justify-center gap-1 text-lg font-semibold tracking-tight bg-foreground dark:bg-foreground/60 text-background h-12 mb-1'>
              Development Mode
            </ModalHeader>
            <ModalBody className='py-6'>
              <div className='flex flex-col items-center gap-4 text-center'>
                <div className='flex items-center justify-center w-16 h-16 rounded-full bg-warning/20'>
                  <Icon
                    name='info'
                    className='size-8 text-warning'
                  />
                </div>
                <div className='space-y-2'>
                  <p className='text-base font-medium'>
                    Payment processing is currently in development mode.
                  </p>
                  <p className='text-sm text-foreground/70'>
                    Your order has been saved with status &quot;pending&quot;.
                    Redirecting you to your account page...
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className='justify-center'>
              <Button
                color='primary'
                className='bg-featured font-medium dark:text-background tracking-tighter text-base'
                onPress={onRedirect}
                endContent={
                  <Icon
                    name='chevron-right'
                    className='size-5'
                  />
                }>
                Go to Account
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

