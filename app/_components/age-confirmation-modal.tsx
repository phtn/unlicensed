'use client'

import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from '@heroui/react'
import {useState} from 'react'

const STORAGE_KEY = 'age-confirmed'

export function AgeConfirmationModal() {
  // Initialize state based on localStorage check
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    const confirmed = localStorage.getItem(STORAGE_KEY)
    return !confirmed
  })
  const [isMounted] = useState(() => typeof window !== 'undefined')

  const handleConfirm = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setIsOpen(false)
  }

  const handleDecline = () => {
    // Redirect to a safe page or show a message
    window.location.href = 'https://www.google.com'
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing without confirmation
      hideCloseButton
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      placement='center'
      size='md'
      classNames={{
        backdrop: 'bg-black/80 backdrop-opacity-80',
      }}>
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1 text-center'>
          <h2 className='text-2xl font-bold'>Age Verification Required</h2>
        </ModalHeader>
        <ModalBody>
          <div className='text-center space-y-4'>
            <p className='text-lg'>
              You must be 18 years or older to access this website.
            </p>
            <p className='text-sm text-default-500'>
              By clicking &quot;I am 18 years or older&quot;, you confirm that you are of legal age to
              purchase and consume cannabis products in your jurisdiction.
            </p>
          </div>
        </ModalBody>
        <ModalFooter className='flex-col gap-2'>
          <Button
            color='primary'
            size='lg'
            className='w-full font-semibold'
            onPress={handleConfirm}>
            I am 18 years or older
          </Button>
          <Button
            variant='light'
            size='sm'
            className='w-full'
            onPress={handleDecline}>
            I am under 18
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}


