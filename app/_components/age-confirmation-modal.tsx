'use client'

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import {useState} from 'react'

const VERSION = 'v1'
const STORAGE_KEY = `age-confirmed:${VERSION}`

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
      size='sm'
      classNames={{
        backdrop: 'bg-black/80 backdrop-opacity-80',
        base: 'mx-2 sm:mx-4',
      }}>
      <ModalContent className='age-verification-modal text-foreground w-full max-w-md rounded-none border-0 bg-linear-to-b from-indigo-300/35 from-35% via-slate-800/60 to-slate-950/60 py-4 px-4 sm:py-8 sm:px-6 shadow-2xl relative overflow-hidden'>
        <div className='absolute -bottom-84 left-1/2 -translate-x-1/2 size-160 aspect-square rounded-t-[14rem] bg-linear-to-t from-slate-950 via-slate-800 to-slate-950/80 blur-sm hidden sm:block' />
        <div className='absolute -bottom-12 -right-18 w-50 h-32 rounded-full bg-linear-to-r from-slate-200/80 to-slate-200 blur-3xl rotate-45 hidden sm:block' />
        <ModalHeader className='flex flex-col gap-1 text-center px-0'>
          <h2 className='text-4xl sm:text-5xl font-bone tracking-normal dark:text-white text-foreground/80 drop-shadow-2xl'>
            <span className='text-4xl sm:text-5xl'>Age</span> Confirmation
          </h2>
        </ModalHeader>
        <ModalBody className='px-0'>
          <div className='max-w-[22ch] text-center mx-auto relative z-100 py-2 sm:py-3 text-base sm:text-lg font-polysans font-normal dark:text-white'>
            You must be 18 years or older to access this website.
          </div>
          <div className='py-2 sm:py-3 text-xs dark:text-white/70 relative z-100'>
            By clicking &quot;I am 18 and older&quot;, you confirm that you are
            of legal age to purchase and consume products in your jurisdiction.
          </div>
        </ModalBody>
        <ModalFooter className='flex-col gap-2 px-0'>
          <div className='space-y-3 sm:space-y-4 pt-2 sm:pt-4 w-full'>
            <Button
              onPress={handleConfirm}
              className='w-full text-white rounded-full bg-brand py-4 sm:py-6 text-base sm:text-xl font-space font-extrabold drop-shadow-xs hover:opacity-95'>
              I&apos;m 18 and older
            </Button>
            <button
              onClick={handleDecline}
              className='relative z-100 w-full text-xs sm:text-sm font-semibold text-white hover:text-white'>
              I am under 18
            </button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
