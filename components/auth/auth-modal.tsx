'use client'

import {
  loginWithEmail,
  loginWithGoogle,
  signupWithEmail,
} from '@/lib/firebase/auth'
import {cancelGoogleOneTap} from '@/components/auth/google-one-tap'
import {Icon} from '@/lib/icons'
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
import {useState} from 'react'

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
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isLogin) {
        await loginWithEmail(email, password)
      } else {
        await signupWithEmail(email, password)
      }
      onClose()
      setEmail('')
      setPassword('')
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} placement='center' size='md'>
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1 bg-white'>
          {isLogin ? 'Sign In' : 'Create Account'}
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {error && (
              <div className='p-3 rounded-lg bg-danger/10 text-danger text-sm'>
                {error}
              </div>
            )}
            <Input
              type='email'
              label='Email'
              placeholder='Enter your email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete='email'
            />
            <Input
              type='password'
              label='Password'
              placeholder='Enter your password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={6}
            />
            <div className='flex items-center gap-4'>
              <Divider className='flex-1' />
              <span className='text-xs text-color-muted'>OR</span>
              <Divider className='flex-1' />
            </div>
            <Button
              type='button'
              variant='bordered'
              className='w-full'
              onPress={handleGoogleLogin}
              isLoading={loading}
              startContent={<Icon name='google' className='size-5' />}>
              Continue with Google
            </Button>
          </ModalBody>
          <ModalFooter className='flex-col gap-2'>
            <Button
              type='submit'
              color='primary'
              className='w-full'
              isLoading={loading}>
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
            <Button
              type='button'
              variant='light'
              size='sm'
              onPress={() => {
                setIsLogin(!isLogin)
                setError(null)
              }}>
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}




