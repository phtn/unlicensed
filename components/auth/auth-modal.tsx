'use client'

import {useAuthCtx} from '@/ctx/auth'
import {
  getPostEmailLinkRedirectUrl,
  loginWithEmail,
  loginWithEmailLink,
  loginWithGoogle,
  sendEmailLink,
  sendPasswordReset,
  signupWithEmail,
} from '@/lib/firebase/auth'
import {auth} from '@/lib/firebase/config'
import {parseFirebaseAuthError} from '@/lib/firebase/parseAuthError'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Button,
  Divider,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@heroui/react'
import type {ActionCodeSettings} from 'firebase/auth'
import {
  ChangeEvent,
  InputHTMLAttributes,
  SubmitEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

interface AuthModalProps {
  isOpen: boolean
  onClose: VoidFunction
  mode?: 'login' | 'signup'
}

type AuthView = 'login' | 'signup' | 'email-link'

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
  const [authView, setAuthView] = useState<AuthView>(
    mode === 'signup' ? 'signup' : 'login',
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailForLink, setEmailForLink] = useState('')
  const [emailLinkError, setEmailLinkError] = useState<string | null>(null)
  const hasActiveSession = Boolean(user ?? auth?.currentUser)
  const canOpen = isOpen && !hasActiveSession

  // Sync modal state with context
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
    if (!isOpen || completeEmailLink) return
    setAuthView(mode === 'signup' ? 'email-link' : 'email-link')
  }, [completeEmailLink, isOpen, mode])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      setAuthModalOpen(false)
    }
  }, [setAuthModalOpen])

  const isLogin = authView === 'email-link'
  const isEmailLinkView = authView === 'email-link'
  const activeView = completeEmailLink ? 'email-link' : authView
  const passwordsMatch = password === confirmPassword
  const emailTrimmed = email.trim()
  const signUpValid =
    emailTrimmed &&
    password &&
    confirmPassword &&
    password.length >= 6 &&
    passwordsMatch
  const signInValid = Boolean(emailTrimmed && password)
  const primaryActionDisabled = isEmailLinkView
    ? !emailTrimmed || loading
    : isLogin
      ? !signInValid || loading
      : !signUpValid || loading

  const switchAuthView = (view: AuthView) => {
    setError(null)
    setEmailLinkError(null)
    setResetEmailSent(false)
    setEmailSent(false)
    setAuthView(view)
  }

  const handleEmailPasswordSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    setError(null)

    if (isLogin) {
      if (!signInValid) return
      setEmailLoading(true)
      try {
        await loginWithEmail(email.trim(), password)
        setAuthModalOpen(false)
        onClose()
      } catch (err) {
        setError(parseFirebaseAuthError(err))
      } finally {
        setEmailLoading(false)
      }
      return
    }

    // Sign-up: enforce confirm password and length before calling Firebase
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }

    setEmailLoading(true)
    try {
      await signupWithEmail(email.trim(), password)
      setAuthModalOpen(false)
      onClose()
    } catch (err) {
      setError(parseFirebaseAuthError(err))
    } finally {
      setEmailLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email?.trim()) {
      setError('Enter your email above, then click Forgot password.')
      return
    }
    setError(null)
    setEmailLoading(true)
    try {
      await sendPasswordReset(email.trim())
      setResetEmailSent(true)
    } catch (err) {
      setError(parseFirebaseAuthError(err))
    } finally {
      setEmailLoading(false)
    }
  }

  const handleSendEmailLink = async () => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Please enter your email.')
      return
    }
    setError(null)
    setEmailLoading(true)
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
      setEmailLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)

    try {
      await loginWithGoogle()
      setAuthModalOpen(false)
      onClose()
    } catch (err) {
      setError(parseFirebaseAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setConfirmPassword('')
    setResetEmailSent(false)
    setEmailSent(false)
    setEmailForLink('')
    setEmailLinkError(null)
    setError(null)
    setAuthView(mode === 'signup' ? 'signup' : 'login')
    if (completeEmailLink) {
      window.history.replaceState({}, '', window.location.origin)
      setCompleteEmailLink(null)
    }
    setAuthModalOpen(false)
    onClose()
  }

  const handleCompleteEmailLink = async () => {
    if (!completeEmailLink) return
    const trimmed = emailForLink.trim()
    if (!trimmed) {
      setEmailLinkError('Please enter your email address.')
      return
    }
    setEmailLinkError(null)
    setEmailLoading(true)
    try {
      await loginWithEmailLink(trimmed, completeEmailLink.href)
      setCompleteEmailLink(null)
      closeAuthModal()
      window.location.replace(getPostEmailLinkRedirectUrl())
    } catch (err) {
      setEmailLinkError(parseFirebaseAuthError(err))
    } finally {
      setEmailLoading(false)
    }
  }

  const emailLink = useMemo(() => `https://${email.split('@').pop()}`, [email])

  return (
    <Modal
      isOpen={canOpen}
      onClose={handleClose}
      placement='center'
      size='md'
      classNames={{
        wrapper: 'z-[20000]',
      }}
      hideCloseButton>
      <ModalContent className='rounded-xs dark:border-brand border-light-gray/80 w-96 h-120 overflow-hidden flex flex-col'>
        <div className='size-80 absolute left-1/2 -translate-x-1/2 top-1/3 -translate-y-1/2'>
          <Image
            src={'/svg/rf-logo-hot-pink-2.svg'}
            className='size-80'
            alt='rf-logo'
          />
        </div>
        <ModalHeader className='relative z-10 tracking-tight flex justify-between items-start shrink-0'>
          <div className='bg-black backdrop-blur-2xl text-white text-sm rounded-xs w-fit whitespace-nowrap flex'>
            {emailSent ? (
              <a
                rel='noopener noreferrer'
                href={emailLink}
                target='_blank'
                className='font-polysans font-normal text-sm flex items-center px-4 py-2'>
                <span>Check Your Email</span>
                <Icon name='arrow-right' className='size-6 -rotate-20 ml-1' />
              </a>
            ) : resetEmailSent ? (
              <span className='px-4 py-2'>Check your email</span>
            ) : (
              <>
                <button
                  type='button'
                  onClick={() => switchAuthView('email-link')}
                  className={cn(
                    'px-4 py-2 rounded-xs font-medium transition-colors',
                    activeView === 'email-link'
                      ? 'bg-black/40 text-white'
                      : 'text-white/70 hover:text-white',
                  )}>
                  Sign in
                </button>
                <button
                  type='button'
                  onClick={() => switchAuthView('email-link')}
                  className={cn(
                    'px-4 py-2 rounded-xs font-medium transition-colors',
                    activeView === 'signup'
                      ? 'bg-black/40 text-white'
                      : 'text-white/70 hover:text-white',
                  )}>
                  Create account
                </button>
                {/*<button
                  type='button'
                  onClick={() => switchAuthView('email-link')}
                  className={cn(
                    'px-4 py-2 rounded-xs font-medium transition-colors',
                    activeView === 'email-link'
                      ? 'bg-black/40 text-white'
                      : 'text-white/70 hover:text-white',
                  )}>
                  Send Email link
                </button>*/}
              </>
            )}
          </div>
          <Button
            isIconOnly
            size='sm'
            variant='light'
            aria-label='Close'
            onPress={handleClose}
            className='text-white/80 hover:text-white hover:bg-white/10 min-w-unit-8 w-8 h-8 z-20'>
            <Icon name='x' className='size-5' />
          </Button>
        </ModalHeader>
        <ModalBody className='flex-1 min-h-0 overflow-auto' />
        <form
          onSubmit={
            isEmailLinkView
              ? (e) => {
                  e.preventDefault()
                  void handleSendEmailLink()
                }
              : handleEmailPasswordSubmit
          }
          className='relative z-10 flex flex-col shrink-0 mt-auto'>
          {emailSent ? (
            <div className='relative z-50 bg-foreground/50 dark:bg-background/50 rounded-xs backdrop-blur-3xl flex flex-col items-center justify-center py-6 px-4 space-y-4 text-center'>
              <Icon
                name='mail-send-fill'
                className='size-12 -rotate-8 text-featured'
              />
              <p className='text-white text-sm'>
                We&apos;ve sent a sign-in link to{' '}
                <strong className='font-clash tracking-wide'>{email}</strong>
              </p>
              <p className='text-white/70 text-xs line-clamp-2 max-w-[25ch]'>
                Click the link in your email to sign in. The link will expire in
                1 hour.
              </p>
              <Button
                size='sm'
                variant='light'
                onPress={() => {
                  setEmailSent(false)
                  setEmail('')
                  setError(null)
                }}
                className='text-white/80 hover:text-white'>
                Use a different email
              </Button>
            </div>
          ) : resetEmailSent ? (
            <div className='bg-foreground/50 rounded-xl backdrop-blur-3xl flex flex-col items-center justify-center py-6 px-4 space-y-4 text-center'>
              <Icon name='email' className='size-16 -rotate-10 text-featured' />
              <p className='text-white text-sm'>
                Password reset link sent to{' '}
                <strong className='text-featured font-polysans tracking-wide'>
                  {email}
                </strong>
              </p>
              <Button
                size='sm'
                variant='light'
                onPress={() => {
                  setResetEmailSent(false)
                  setError(null)
                }}
                className='text-white/80 hover:text-white'>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div className='px-2 pb-2'>
                  <div className='bg-red-50 dark:bg-red-950/80 rounded-lg p-3'>
                    <div className='text-red-700 dark:text-red-300 text-xs'>
                      {error}
                    </div>
                  </div>
                </div>
              )}
              <ModalFooter className='flex flex-col gap-3 w-full pb-4 pt-2'>
                <div className='flex flex-col'>
                  <Input
                    size='lg'
                    fullWidth
                    radius='none'
                    type='email'
                    inputMode='email'
                    placeholder='Email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete='email'
                    className='placeholder:text-white text-white! dark:text-white!'
                    classNames={{
                      inputWrapper: cn(
                        'bg-black/80! dark:bg-black/80 backdrop-blur-2xl text-white!',
                        isEmailLinkView ? 'rounded-xs!' : 'rounded-t-md!',
                      ),
                      input:
                        'ps-3 placeholder:text-white text-white! dark:text-white!',
                    }}
                  />
                  {!isEmailLinkView && (
                    <Input
                      size='lg'
                      fullWidth
                      radius='none'
                      type='password'
                      placeholder='Password'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={
                        isLogin ? 'current-password' : 'new-password'
                      }
                      className={cn(
                        'placeholder:text-white text-white! dark:text-white!',
                        isLogin && 'rounded-b-md',
                      )}
                      classNames={{
                        inputWrapper: [
                          'bg-black/70! dark:bg-black/80 backdrop-blur-2xl text-white!',
                          isLogin && 'rounded-b-md!',
                        ],
                        input:
                          'ps-3 bg-black/80 placeholder:text-white text-white! dark:text-white!',
                      }}
                    />
                  )}
                  {!isLogin && !isEmailLinkView && (
                    <Input
                      size='lg'
                      fullWidth
                      radius='none'
                      type='password'
                      placeholder='Confirm password'
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete='new-password'
                      isInvalid={confirmPassword.length > 0 && !passwordsMatch}
                      errorMessage={
                        confirmPassword.length > 0 && !passwordsMatch
                          ? 'Passwords do not match'
                          : undefined
                      }
                      className={cn(
                        'placeholder:text-white text-white! dark:text-white! rounded-b-md',
                        confirmPassword &&
                          !passwordsMatch &&
                          'border-b-2 border-red-500',
                      )}
                      classNames={{
                        inputWrapper: [
                          'bg-black/50! dark:bg-black/80 backdrop-blur-2xl text-white!',
                          'rounded-b-md',
                        ],
                        input:
                          'ps-3 bg-black/80 placeholder:text-white text-white! dark:text-white!',
                        errorMessage: 'text-red-400 text-xs pt-1 px-1',
                      }}
                    />
                  )}
                </div>
                {isLogin && !isEmailLinkView && (
                  <div className='flex justify-end -mt-1 mr-2'>
                    <button
                      type='button'
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className='text-xs text-white hover:text-primary bg-black/15 px-3 py-1 dark:hover:text-white underline underline-offset-2 disabled:opacity-50'>
                      Forgot password?
                    </button>
                  </div>
                )}
                <Button
                  size='lg'
                  radius='none'
                  type='submit'
                  variant='solid'
                  disabled={primaryActionDisabled}
                  className={cn(
                    'bg-brand backdrop-blur-2xl w-full text-white rounded-xs',
                    {
                      'bg-black/50': primaryActionDisabled,
                    },
                  )}>
                  {emailLoading ? (
                    <Icon name='spinners-ring' className='size-5 text-white' />
                  ) : isEmailLinkView ? (
                    'Send email link'
                  ) : isLogin ? (
                    'Sign in'
                  ) : (
                    'Create account'
                  )}
                </Button>
                <div className='flex items-center gap-4 w-full'>
                  <Divider className='flex-1' />
                  <span className='text-xs dark:text-white opacity-70 font-light'>
                    or
                  </span>
                  <Divider className='flex-1' />
                </div>
                {completeEmailLink ? (
                  <div className='flex w-full flex-col gap-2'>
                    <Input
                      size='lg'
                      fullWidth
                      radius='none'
                      type='email'
                      inputMode='email'
                      placeholder='Email you used for the sign-in link'
                      value={emailForLink}
                      onChange={(e) => setEmailForLink(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        (e.preventDefault(), handleCompleteEmailLink())
                      }
                      autoComplete='email'
                      isInvalid={Boolean(emailLinkError)}
                      errorMessage={emailLinkError ?? undefined}
                      classNames={{
                        inputWrapper:
                          'bg-black/80! dark:bg-black/80 backdrop-blur-2xl text-white! rounded-md!',
                        input:
                          'ps-3 bg-black/80 placeholder:text-white text-white! dark:text-white!',
                        errorMessage: 'text-red-400 text-xs pt-1 px-1',
                      }}
                    />
                    <Button
                      size='lg'
                      type='button'
                      radius='none'
                      variant='flat'
                      onPress={handleCompleteEmailLink}
                      disabled={emailLoading}
                      className='bg-black/80 backdrop-blur-2xl font-okxs font-medium text-sm w-full text-white rounded-lg'
                      startContent={
                        emailLoading ? (
                          <Icon
                            name='spinners-ring'
                            className='size-5 text-white'
                          />
                        ) : null
                      }>
                      Continue
                    </Button>
                  </div>
                ) : (
                  <div className='flex w-full'>
                    <Button
                      size='lg'
                      type='button'
                      radius='none'
                      variant='flat'
                      onPress={handleGoogleLogin}
                      disabled={loading}
                      className='bg-black/80 backdrop-blur-2xl font-okxs font-medium text-sm w-full text-white rounded-xs'
                      startContent={
                        <Icon
                          name={loading ? 'spinners-ring' : 'google'}
                          className='size-5'
                        />
                      }>
                      Continue with Google
                    </Button>
                  </div>
                )}
              </ModalFooter>
            </>
          )}
        </form>
      </ModalContent>
    </Modal>
  )
}
interface SignInField {
  label: string
  placeholder: string
  type: InputHTMLAttributes<HTMLInputElement>
  value: string
  onChange: (value: ChangeEvent<HTMLInputElement>) => void
  required: boolean
  autoComplete: string
}
interface SignInFieldProps {
  fields: SignInField[]
}
export const InputFields = ({fields}: SignInFieldProps) => {
  return (
    <div className='hidden space-y-1'>
      {fields.map((field, index) => (
        <Input
          key={index}
          type={field.type as string}
          label={field.label}
          placeholder={field.placeholder}
          value={field.value}
          onChange={field.onChange}
          required={field.required}
          autoComplete={field.autoComplete}
        />
      ))}

      <div className='flex items-center gap-1'>
        <Divider className='flex-1' />
        <span className='text-xs text-color-muted font-light'>OR</span>
        <Divider className='flex-1' />
      </div>
    </div>
  )
}

export const SignInFooter = () => {
  return (
    <div className='flex-col gap-2'>
      <Button
        type='submit'
        variant='flat'
        className='w-full hidden'
        // isLoading={loading}
      >
        {/*{isLogin ? 'Sign In' : 'Sign Up'}*/}
      </Button>
      <Button
        size='sm'
        type='button'
        variant='light'
        className='hidden'></Button>
    </div>
  )
}
