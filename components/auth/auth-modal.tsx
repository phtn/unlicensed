'use client'

import {useAuthCtx} from '@/ctx/auth'
import {useToggle} from '@/hooks/use-toggle'
import {loginWithGoogle, sendEmailLink} from '@/lib/firebase/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Button,
  Divider,
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
  FormEvent,
  InputHTMLAttributes,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {DitherPhoto, ImageDither} from '../paper/dithering'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode?: 'login' | 'signup'
}

export const AuthModal = ({
  isOpen,
  onClose,
  mode = 'login',
}: AuthModalProps) => {
  const {setAuthModalOpen} = useAuthCtx()
  const [isLogin] = useState(mode === 'login')
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync modal state with context
  useEffect(() => {
    setAuthModalOpen(isOpen)
  }, [isOpen, setAuthModalOpen])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      setAuthModalOpen(false)
    }
  }, [setAuthModalOpen])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin && email) {
        // Configure where the email link should redirect
        const actionCodeSettings: ActionCodeSettings = {
          url: window.location.origin,
          handleCodeInApp: true,
        }

        await sendEmailLink(email, actionCodeSettings)
        setEmailSent(true)
        // Don't close modal immediately - show success message
        // The user needs to check their email
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setEmailSent(false)
    } finally {
      setLoading(false)
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
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const {on: isEmail, toggle: toggleEmail} = useToggle()
  const emailLink = useMemo(() => `https://${email.split('@').pop()}`, [email])

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement='center' size='md'>
      <ModalContent className='rounded-4xl dark:border border-light-gray/80 w-96'>
        <div className='absolute h-160 w-160 aspect-auto -top-28 -left-10 flex items-center'>
          <ImageDither image={'/svg/rf-logo-hot-pink-2.svg'} />
          <DitherPhoto />
        </div>
        <ModalHeader className='relative z-10 tracking-tight'>
          <div className='bg-black/20 backdrop-blur-2xl text-white px-2 rounded-lg w-fit'>
            {emailSent ? (
              <a
                rel='noopener noreferrer'
                href={emailLink}
                target='_blank'
                className='font-polysans font-normal flex items-center'>
                <span>Check Your Email</span>
                <Icon name='arrow-right' className='size-6 -rotate-20 ml-1' />
              </a>
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </div>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {emailSent ? (
              <div className='relative z-50 bg-foreground/50 rounded-xl backdrop-blur-3xl flex flex-col items-center justify-center h-80 space-y-4 text-center px-4'>
                <Icon
                  name='email'
                  className='size-16 -rotate-10 text-featured'
                />
                <p className='text-white text-sm'>
                  We&apos;ve sent a sign-in link to{' '}
                  <strong className='text-featured font-polysans tracking-wide'>
                    {email}
                  </strong>
                </p>
                <p className='text-white/70 text-xs line-clamp-2 max-w-[25ch]'>
                  Click the link in your email to sign in. The link will expire
                  in 1 hour.
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
            ) : (
              <div
                onClick={toggleEmail}
                className='flex items-center h-80 justify-center'></div>
            )}
            {error && (
              <div className='text-red-500 text-xs px-4 py-2 bg-red-500/10 rounded-lg'>
                {error}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {!emailSent && isEmail ? (
              <div className='flex items-start justify-between space-x-2 w-full py-2'>
                <Input
                  size='lg'
                  fullWidth
                  type='email'
                  inputMode='email'
                  value={email}
                  onChange={(e) => {
                    e.preventDefault()
                    setEmail(e.target.value)
                  }}
                  className='placeholder:text-white text-white! dark:text-white! flex w-full'
                  classNames={{
                    inputWrapper:
                      'bg-black/80! dark:bg-black/80 backdrop-blur-2xl w-full text-white!',
                    input:
                      'bg-black/80 selection:bg-featured focus-within:bg-black/80 placeholder:text-white text-white! dark:text-white! w-full text-xl',
                    errorMessage:
                      'p-2 bg-red-500/10 max-w-[25ch] rounded trucate text-foreground',
                  }}
                  startContent={
                    <Icon
                      onClick={toggleEmail}
                      name={email === '' ? 'x' : 'email'}
                      className='size-6'
                    />
                  }
                />
                <Button
                  size='lg'
                  isIconOnly
                  type='submit'
                  variant='solid'
                  disabled={email === '' || loading}
                  className={cn(
                    'bg-black/80 backdrop-blur-2xl flex-1 text-white',
                    {'bg-black/50': email === '' || loading},
                  )}>
                  <Icon
                    name={loading ? 'spinners-ring' : 'chevron-right'}
                    className={cn('size-5', {
                      'text-orange-400': loading,
                    })}
                  />
                </Button>
              </div>
            ) : !emailSent ? (
              <div className='flex items-center justify-between space-x-2 w-full py-2'>
                <Button
                  size='lg'
                  type='button'
                  variant='flat'
                  onPress={toggleEmail}
                  startContent={<Icon name='email' className='size-5' />}
                  className='bg-black/80 backdrop-blur-2xl w-fit text-white'>
                  Email
                </Button>
                <Button
                  size='lg'
                  type='button'
                  variant='solid'
                  className='bg-black/80 backdrop-blur-2xl w-fit text-white'
                  onPress={handleGoogleLogin}
                  startContent={
                    <Icon
                      name={loading ? 'spinners-ring' : 'google'}
                      className='size-5'
                    />
                  }>
                  Continue with Google
                </Button>
              </div>
            ) : null}
          </ModalFooter>
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
    <div className='hidden space-y-3'>
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

      <div className='flex items-center gap-4'>
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
        className='hidden'
        // onPress={() => {
        //   setIsLogin(!isLogin)
        //   setError(null)
        // }}
      >
        {/*{isLogin
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}*/}
      </Button>
    </div>
  )
}
