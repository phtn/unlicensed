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
import {useRouter} from 'next/navigation'
import {useEffect} from 'react'
import {startTransition} from 'react'

interface DevelopmentModalProps {
  isOpen: boolean
  onClose: VoidFunction
}

export function DevelopmentModal({isOpen, onClose}: DevelopmentModalProps) {
  const router = useRouter()

  // Debug log to verify modal state
  useEffect(() => {
    console.log('[DevelopmentModal] isOpen prop changed:', isOpen)
    if (isOpen) {
      console.log('[DevelopmentModal] Modal is opening')
      
      // Auto-redirect after 3 seconds if user doesn't click the button
      const autoRedirectTimer = setTimeout(() => {
        console.log('[DevelopmentModal] Auto-redirecting to account page')
        startTransition(() => {
          router.push('/account')
        })
        onClose()
      }, 3000)
      
      return () => clearTimeout(autoRedirectTimer)
    }
  }, [isOpen, router, onClose])

  const handleRedirect = () => {
    console.log('[DevelopmentModal] Redirecting to account page')
    startTransition(() => {
      router.push('/account')
    })
    onClose()
  }

  console.log('[DevelopmentModal] Rendering with isOpen:', isOpen)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size='md'
      radius='sm'
      placement='center'
      isDismissable={false}
      hideCloseButton>
      <ModalContent className='overflow-hidden dark:bg-dark-table'>
        {() => (
          <>
            <ModalHeader className='flex flex-col justify-center gap-1 text-lg font-semibold tracking-tight bg-foreground dark:bg-foreground/60 text-background h-12 mb-1'>
              Development Mode
            </ModalHeader>
            <ModalBody className='py-6'>
              <div className='flex flex-col items-center gap-4 text-center'>
                <Icon
                  name='spinners-ring'
                  className='size-12 text-featured animate-spin'
                />
                <div className='space-y-2'>
                  <p className='text-base font-medium'>
                    Your order has been saved with status &quot;pending&quot;
                  </p>
                  <p className='text-sm text-default-500'>
                    We&apos;re currently in development mode. Payment processing
                    is temporarily disabled.
                  </p>
                  <p className='text-sm text-default-500'>
                    Redirecting to your account page...
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color='primary'
                className='bg-featured font-medium dark:text-background tracking-tighter text-base'
                onPress={handleRedirect}
                endContent={
                  <Icon
                    name='arrow-down'
                    className='-rotate-45 size-6 md:size-8'
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

