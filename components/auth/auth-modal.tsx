'use client'

import {cancelGoogleOneTap} from '@/components/auth/google-one-tap'
import {useToggle} from '@/hooks/use-toggle'
import {loginWithEmailLink, loginWithGoogle} from '@/lib/firebase/auth'
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
import {ChangeEvent, FormEvent, InputHTMLAttributes, useState} from 'react'
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
  const [isLogin] = useState(mode === 'login')
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    console.log(e)
    console.log(email, isLogin)
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        const link = await loginWithEmailLink(email, window.location.href)
        console.log('[email link triggered]', email)
        if (link) {
          setEmailSent(true)
        }
      }
      onClose()
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setLoading(true)

    // Cancel One Tap to prevent conflicts with popup
    cancelGoogleOneTap()

    try {
      await loginWithGoogle()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const {on: isEmail, toggle: toggleEmail} = useToggle()

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement='center' size='md'>
      <ModalContent className='rounded-4xl dark:border border-light-gray/80 w-96'>
        <div className='absolute h-160 w-160 aspect-auto -top-28 -left-10 flex items-center'>
          <ImageDither image={'/svg/rf-logo-hot-pink-2.svg'} />
          <DitherPhoto />
        </div>
        <ModalHeader className='relative z-10 tracking-tight'>
          <div className='bg-black/20 backdrop-blur-2xl  text-white px-2 rounded-lg w-fit'>
            {isLogin ? 'Sign In' : 'Create Account'}
          </div>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div
              onClick={toggleEmail}
              className='flex items-center h-80 justify-center'></div>
          </ModalBody>
          <ModalFooter>
            {isEmail ? (
              <div className='flex items-start justify-between space-x-2 w-full py-2'>
                <Input
                  size='lg'
                  fullWidth
                  type='email'
                  inputMode='email'
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
                  disabled={email === ''}
                  className={cn(
                    'bg-black/80 backdrop-blur-2xl flex-1 text-white',
                    {'bg-black/50': email === ''},
                  )}>
                  <Icon
                    name={
                      loading
                        ? 'spinners-ring'
                        : emailSent
                          ? 'check-fill'
                          : 'chevron-right'
                    }
                    className={cn('size-5', {
                      'text-orange-400': loading,
                      'text-emerald-500': emailSent,
                    })}
                  />
                </Button>
              </div>
            ) : (
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
            )}
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
