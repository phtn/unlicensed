'use client'

import {useAuthCtx} from '@/ctx/auth'
import {
  getPostEmailLinkRedirectUrl,
  loginWithEmailLink,
  loginWithGoogle,
  sendEmailLink,
} from '@/lib/firebase/auth'
import {auth} from '@/lib/firebase/config'
import {parseFirebaseAuthError} from '@/lib/firebase/parseAuthError'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Button,
  Input,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  Separator,
} from '@heroui/react'
import type {ActionCodeSettings} from 'firebase/auth'
import Image from 'next/image'
import type {ReactNode} from 'react'
import {useEffect, useMemo, useState} from 'react'

// ---------------------------------------------------------------------------
// Reusable form components
// ---------------------------------------------------------------------------

type AuthTab = 'login' | 'signup'

interface EmailLinkFormProps {
  email: string
  onEmailChange: (email: string) => void
  onSubmit: () => void
  loading: boolean
  error: string | null
  tab: AuthTab
}

export const EmailLinkForm = ({
  email,
  onEmailChange,
  onSubmit,
  loading,
  error,
  tab,
}: EmailLinkFormProps) => {
  const copy =
    tab === 'login'
      ? "Enter your email and we'll send you a sign-in link."
      : 'Enter your email to create your account.'

  return (
    <div className='flex flex-col gap-0.5'>
      {/*<p className='text-white/60 text-xs text-center'>{copy}</p>*/}
      {error && (
        <div className='bg-red-950/80 rounded-lg p-3'>
          <p className='text-red-300 text-xs'>{error}</p>
        </div>
      )}
      <Input
        fullWidth
        type='email'
        inputMode='email'
        placeholder={copy}
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onSubmit())}
        autoComplete='email'
        className='placeholder:text-foreground/60 rounded-xs dark:text-white! shadow-none'
      />
      <Button
        size='lg'
        type='button'
        variant='primary'
        onPress={onSubmit}
        isDisabled={!email.trim() || loading}
        className={cn('bg-brand w-full text-white rounded-xs', {
          'bg-brand/70': !email.trim() || loading,
        })}>
        {loading ? (
          <Icon name='spinners-ring' className='size-5 text-white' />
        ) : (
          'Send email link'
        )}
      </Button>
    </div>
  )
}

// Available for future use — not currently rendered in the modal
export interface EmailPasswordFormProps {
  email: string
  password: string
  confirmPassword?: string
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onConfirmPasswordChange?: (v: string) => void
  loading: boolean
  error: string | null
  mode: 'login' | 'signup'
  onForgotPassword?: () => void
}

export const EmailPasswordForm = ({
  email,
  password,
  confirmPassword = '',
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  loading,
  error,
  mode,
  onForgotPassword,
}: EmailPasswordFormProps) => {
  const passwordsMatch = password === confirmPassword
  return (
    <div className='flex flex-col gap-2'>
      {error && (
        <div className='bg-red-950/80 rounded-lg p-3'>
          <p className='text-red-300 text-xs'>{error}</p>
        </div>
      )}
      <Input
        fullWidth
        type='email'
        inputMode='email'
        placeholder='Email'
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        autoComplete='email'
        className='placeholder:text-white/60 text-white! dark:text-white!'
      />
      <Input
        fullWidth
        type='password'
        placeholder='Password'
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        className='placeholder:text-white/60 text-white! dark:text-white!'
      />
      {mode === 'signup' && onConfirmPasswordChange && (
        <Input
          fullWidth
          type='password'
          placeholder='Confirm password'
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          autoComplete='new-password'
          className={cn(
            'placeholder:text-white/60 text-white! dark:text-white!',
            confirmPassword && !passwordsMatch && 'border-b-2 border-red-500',
          )}
        />
      )}
      {mode === 'login' && onForgotPassword && (
        <div className='flex justify-end'>
          <button
            type='button'
            onClick={onForgotPassword}
            disabled={loading}
            className='text-xs text-white/60 hover:text-white underline underline-offset-2 disabled:opacity-50'>
            Forgot password?
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------

const ModalContent = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <ModalBackdrop>
    <ModalContainer size='md' placement='center'>
      <ModalDialog className={className}>{children}</ModalDialog>
    </ModalContainer>
  </ModalBackdrop>
)

// ---------------------------------------------------------------------------
// AuthModal
// ---------------------------------------------------------------------------

interface AuthModalProps {
  isOpen: boolean
  onClose: VoidFunction
  mode?: 'login' | 'signup'
}

export const AuthModal = ({
  isOpen,
  onClose,
  mode = 'login',
}: AuthModalProps) => {
  const {
    setAuthModalOpen,
    user,
    completeEmailLink,
    setCompleteEmailLink,
    closeAuthModal,
  } = useAuthCtx()

  const [tab, setTab] = useState<AuthTab>(
    mode === 'signup' ? 'signup' : 'login',
  )
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailForLink, setEmailForLink] = useState('')
  const [emailLinkError, setEmailLinkError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const hasActiveSession = Boolean(user ?? auth?.currentUser)
  const canOpen = isOpen && !hasActiveSession

  useEffect(() => {
    setAuthModalOpen(canOpen)
  }, [canOpen, setAuthModalOpen])

  useEffect(() => {
    if (isOpen && hasActiveSession) {
      setAuthModalOpen(false)
      onClose()
    }
  }, [hasActiveSession, isOpen, onClose, setAuthModalOpen])

  useEffect(() => {
    return () => {
      setAuthModalOpen(false)
    }
  }, [setAuthModalOpen])

  const handleSendEmailLink = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/auth/email-link`,
        handleCodeInApp: true,
      }
      await sendEmailLink(trimmedEmail, actionCodeSettings)
      setEmail(trimmedEmail)
      setEmailSent(true)
    } catch (err) {
      setError(parseFirebaseAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      setAuthModalOpen(false)
      onClose()
    } catch (err) {
      setError(parseFirebaseAuthError(err))
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleCompleteEmailLink = async () => {
    if (!completeEmailLink) return
    const trimmed = emailForLink.trim()
    if (!trimmed) {
      setEmailLinkError('Please enter your email address.')
      return
    }
    setEmailLinkError(null)
    setLoading(true)
    try {
      await loginWithEmailLink(trimmed, completeEmailLink.href)
      setCompleteEmailLink(null)
      closeAuthModal()
      window.location.replace(getPostEmailLinkRedirectUrl())
    } catch (err) {
      setEmailLinkError(parseFirebaseAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setEmailSent(false)
    setError(null)
    setEmailForLink('')
    setEmailLinkError(null)
    setTab(mode === 'signup' ? 'signup' : 'login')
    if (completeEmailLink) {
      window.history.replaceState({}, '', window.location.origin)
      setCompleteEmailLink(null)
    }
    setAuthModalOpen(false)
    onClose()
  }

  const switchTab = (next: AuthTab) => {
    setError(null)
    setEmailSent(false)
    setTab(next)
  }

  const emailProviderLink = useMemo(
    () => `https://${email.split('@').pop()}`,
    [email],
  )

  return (
    <Modal isOpen={canOpen}>
      <ModalContent className='relative rounded-xs dark:border-brand border-light-gray/80 w-96 h-120 overflow-hidden flex flex-col p-0'>
        {/* Logo — centered in the modal, behind the form section */}
        <div className='absolute inset-0 flex items-start justify-center pointer-events-none pt-4'>
          <Image
            src='/svg/rf-logo-hot-pink-2.svg'
            className='size-72'
            alt='rf-logo'
            width={320}
            height={320}
            unoptimized
          />
        </div>

        {/* Close button */}
        <Button
          isIconOnly
          size='sm'
          variant='tertiary'
          aria-label='Close'
          onPress={handleClose}
          className='absolute top-2 right-2 z-20 text-foreground/80 hover:text-foreground hover:bg-background/10 min-w-unit-8 w-8 h-8'>
          <Icon name='x' className='size-5' />
        </Button>

        {/* Push form section to bottom */}
        <div className='flex-1' />

        {/* Bottom section */}
        <div className='relative z-10 shrink-0'>
          {emailSent ? (
            <div className='bg-linear-to-t from-black/80 to-black/30 dark:bg-background/50 backdrop-blur-lg flex flex-col items-center justify-center py-6 px-4 gap-4 text-center rounded-xs'>
              <a
                rel='noopener noreferrer'
                href={emailProviderLink}
                target='_blank'
                className='flex items-center gap-1 text-white text-sm font-polysans'>
                <Icon
                  name='mail-send-fill'
                  className='size-10 -rotate-8 text-featured'
                />
              </a>
              <p className='text-white text-sm'>
                We&apos;ve sent a sign-in link to{' '}
                <strong className='font-clash tracking-wide'>{email}</strong>
              </p>
              <p className='text-white/70 text-xs max-w-[25ch]'>
                Click the link in your email to sign in. The link expires in 1
                hour.
              </p>
              <Button
                size='sm'
                variant='tertiary'
                onPress={() => {
                  setEmailSent(false)
                  setEmail('')
                  setError(null)
                }}
                className='dark:text-white/80 hover:text-featured rounded-md hover:bg-foreground'>
                Use a different email
              </Button>
            </div>
          ) : completeEmailLink ? (
            <div className='bg-foreground/50 dark:bg-background/50 backdrop-blur-3xl flex flex-col gap-3 px-4 pb-4 pt-3 rounded-xs'>
              {emailLinkError && (
                <div className='bg-red-950/80 rounded-lg p-3'>
                  <p className='text-red-300 text-xs'>{emailLinkError}</p>
                </div>
              )}
              <Input
                fullWidth
                type='email'
                inputMode='email'
                placeholder='Email you used for the sign-in link'
                value={emailForLink}
                onChange={(e) => setEmailForLink(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  (e.preventDefault(), void handleCompleteEmailLink())
                }
                autoComplete='email'
                className='placeholder:text-white/60 text-white! dark:text-white!'
              />
              <Button
                size='lg'
                type='button'
                variant='tertiary'
                onPress={() => void handleCompleteEmailLink()}
                isDisabled={loading}
                className='bg-black/80 backdrop-blur-2xl font-medium text-sm w-full text-white rounded-xs'>
                {loading ? (
                  <Icon name='spinners-ring' className='size-5 text-white' />
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          ) : (
            <div className='bg-linear-to-t from-black/80 to-black/40 dark:bg-background/40 backdrop-blur-lg rounded-none'>
              {/* Tabs */}
              <div className='flex px-4 pt-3'>
                <div className='bg-black/0 text-white text-sm rounded-xs w-fit whitespace-nowrap flex'>
                  <button
                    type='button'
                    onClick={() => switchTab('login')}
                    className={cn(
                      'px-3 py-1 h-7 rounded-sm font-medium transition-colors',
                      tab === 'login'
                        ? 'bg-foreground/40 text-white drop-shadow-xs'
                        : 'text-white/70 hover:text-white',
                    )}>
                    Sign in
                  </button>
                  <button
                    type='button'
                    onClick={() => switchTab('signup')}
                    className={cn(
                      'px-3 py-1 h-7 rounded-sm font-medium transition-colors',
                      tab === 'signup'
                        ? 'bg-foreground/20 text-white'
                        : 'text-white hover:text-white',
                    )}>
                    Create account
                  </button>
                </div>
              </div>
              {/* Form */}
              <div className='px-4 pb-4 pt-3 flex flex-col gap-1'>
                <EmailLinkForm
                  email={email}
                  onEmailChange={setEmail}
                  onSubmit={() => void handleSendEmailLink()}
                  loading={loading}
                  error={error}
                  tab={tab}
                />
                <div className='flex items-center gap-4'>
                  <Separator className='flex-1 opacity-40' />
                  <span className='text-xs text-background/80 font-light uppercase font-ios'>
                    or
                  </span>
                  <Separator className='flex-1 opacity-40' />
                </div>
                <Button
                  size='lg'
                  type='button'
                  variant='tertiary'
                  onPress={() => void handleGoogleLogin()}
                  isDisabled={googleLoading}
                  className='bg-black/80 backdrop-blur-2xl font-medium text-sm w-full text-white rounded-xs'>
                  {googleLoading ? (
                    <Icon name='spinners-ring' className='size-5 text-white' />
                  ) : (
                    'Continue with Google'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}
