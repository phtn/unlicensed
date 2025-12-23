'use client'

import {useToggle} from '@/hooks/use-toggle'
import {Icon} from '@/lib/icons'
import {
  InputOtp,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import {useRouter} from 'next/navigation'
import {useState} from 'react'

interface ProtectedModalProps {
  accessCode: string
  storageKey: string
  access: ReturnType<typeof useToggle>
}

export function ProtectedModal({
  accessCode,
  storageKey,
  access,
}: ProtectedModalProps) {
  // Initialize state based on localStorage check
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    const confirmed =
      localStorage.getItem(storageKey) &&
      localStorage.getItem(storageKey) === accessCode
    return !confirmed
  })
  const [isMounted] = useState(() => typeof window !== 'undefined')

  const router = useRouter()

  const handleConfirm = (code: string) => {
    localStorage.setItem(storageKey, code)
  }

  const handleDecline = () => {
    // Redirect to a safe page or show a message
    router.push('/')
  }

  const handleComplete = (v?: string) => {
    if (v === accessCode) {
      handleConfirm(v)
      setIsOpen(false)
      access.toggle()
    }
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
      placement='top-center'
      size='md'
      classNames={{
        backdrop: 'bg-black backdrop-opacity-80',
        body: 'border-0 border-white',
        wrapper: 'flex items-start!',
      }}>
      <ModalContent className='age-verification-modal mt-20 w-full max-w-md rounded-none border-0 bg-linear-to-b from-indigo-300/35 from-35% via-slate-800/60 to-slate-950/60 py-8 px-6 shadow-2xl relative'>
        <div className='absolute -bottom-84 left-1/2 -translate-x-1/2 size-160 aspect-square rounded-t-[14rem] bg-linear-to-t from-slate-950 via-slate-800 to-slate-950/80 blur-sm' />
        <div className='absolute -bottom-12 -right-18 w-50 h-32 rounded-full bg-linear-to-r from-slate-200/80 to-slate-200 blur-3xl rotate-45' />
        <ModalHeader className='pb-32 pt-10 flex items-start justify-between'>
          <h2 className='text-5xl font-bone tracking-normal dark:text-white text-foreground drop-shadow-2xl'>
            <span className='text-5xl'>Protected</span> Route
          </h2>
          <Icon name='lock' className='size-8 md:size-12 opacity-70' />
        </ModalHeader>
        <ModalBody>
          <div className='max-w-[22ch] text-center mx-auto relative z-100 pt-3 text-lg font-semibold text-white'>
            Dev Layer Access Required
          </div>
          <div className=' relative z-100 text-center text-sm font-normal text-light-gray'>
            Obtain your 6 digit code from our comms channel
          </div>
        </ModalBody>
        <ModalFooter className='pt-8 pb-4 flex-col gap-2'>
          <div className='flex w-full justify-center flex-nowrap gap-4'>
            <InputOtp
              length={6}
              radius='full'
              size='lg'
              type='password'
              variant='bordered'
              className='text-xl dark:text-dark-gray'
              classNames={{
                caret: 'text-4xl font-bold',
                segmentWrapper: 'space-x-1 md:space-x-2',
                segment: 'dark:bg-white/40 text-black',
                input: 'dark:text-dark-gray text-4xl',
              }}
              errorMessage=''
              onComplete={handleComplete}
            />
          </div>
          <div className='space-y-4 pt-4'>
            <button
              onClick={handleDecline}
              className='relative z-100 w-full text-sm font-semibold text-white hover:text-white'>
              Cancel
            </button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
