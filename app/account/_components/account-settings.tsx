'use client'

import {api} from '@/convex/_generated/api'
import {onError, onSuccess} from '@/ctx/toast'
import {useAccount} from '@/hooks/use-account'
import {useAuth} from '@/hooks/use-auth'
import {sendPasswordReset} from '@/lib/firebase/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useMutation} from 'convex/react'
import {useEffect, useRef, useState} from 'react'

interface AccountSettingsProps {
  user: ReturnType<typeof useAccount>['user']
}

export const AccountSettings = ({user}: AccountSettingsProps) => {
  const {user: firebaseUser} = useAuth()
  const updateContact = useMutation(api.users.m.updateContact)

  // Detect email/password provider — only they can reset a password
  const hasPasswordProvider =
    firebaseUser?.providerData.some((p) => p.providerId === 'password') ?? false
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'saving' | 'error'>(
    'idle',
  )
  const phoneInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditingPhone || !phoneInputRef.current) return
    phoneInputRef.current.focus()
    phoneInputRef.current.select()
  }, [isEditingPhone])

  const savedPhoneNumber = user?.contact?.phone ?? ''

  function startPhoneEditing() {
    setPhoneNumber(savedPhoneNumber)
    setPhoneStatus('idle')
    setIsEditingPhone(true)
  }

  function cancelPhoneEditing() {
    setPhoneNumber(savedPhoneNumber)
    setPhoneStatus('idle')
    setIsEditingPhone(false)
  }

  const [resetStatus, setResetStatus] = useState<
    'idle' | 'sending' | 'sent' | 'error'
  >('idle')

  async function handlePasswordReset() {
    const email = firebaseUser?.email
    if (!email) return

    setResetStatus('sending')
    try {
      await sendPasswordReset(email)
      setResetStatus('sent')
      onSuccess('Password reset email sent. Check your inbox.')
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      setResetStatus('error')
      onError('Failed to send reset email. Try again.')
    }
  }

  async function savePhoneNumber() {
    const fid = user?.fid
    if (!fid) return

    const nextPhoneNumber = phoneNumber.trim()
    if (nextPhoneNumber === savedPhoneNumber) {
      setPhoneStatus('idle')
      setPhoneNumber(nextPhoneNumber)
      setIsEditingPhone(false)
      return
    }

    setPhoneNumber(nextPhoneNumber)
    setPhoneStatus('saving')

    try {
      await updateContact({fid, contact: {phone: nextPhoneNumber}})
      setPhoneStatus('idle')
      setIsEditingPhone(false)
    } catch (error) {
      console.error('Failed to update phone number:', error)
      setPhoneStatus('error')
      onError('Failed to update phone number')
    }
  }

  return (
    <div className='px-4 py-12 xl:px-6 2xl:px-0 space-y-12'>
      <div className='max-w-xl space-y-6'>
        {/* Section header */}
        <div>
          <h2 className='font-clash text-xl tracking-tight'>
            Account Settings
          </h2>
          <p className='mt-1 font-okxs text-xs opacity-60'>
            Manage your contact information and preferences.
          </p>
        </div>

        {/* Contact section */}
        <div className='space-y-2'>
          {/* Email — read-only */}
          {user?.email && (
            <div className='flex h-11 items-center gap-3 rounded-xs border border-foreground/10 bg-default-50/50 px-3 dark:bg-dark-table/30'>
              <Icon name='email' className='size-4 shrink-0 text-default-400' />
              <span className='font-okxs text-sm text-default-600'>
                {user.email}
              </span>
              <span className='ml-auto font-okxs text-[10px] uppercase tracking-widest text-default-300'>
                Email
              </span>
            </div>
          )}

          {/* Phone — editable */}
          <div className='space-y-1'>
            <div className='flex h-11 items-center gap-3 rounded-xs border border-foreground/10 bg-background px-3 transition-colors focus-within:border-foreground/30 dark:bg-dark-table/30'>
              <Icon name='phone' className='size-4 shrink-0 text-default-400' />
              {isEditingPhone ? (
                <input
                  ref={phoneInputRef}
                  type='tel'
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value)
                    if (phoneStatus !== 'idle') setPhoneStatus('idle')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void savePhoneNumber()
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      cancelPhoneEditing()
                    }
                  }}
                  placeholder='Add phone number'
                  autoComplete='tel'
                  spellCheck='false'
                  aria-label='Phone number'
                  disabled={phoneStatus === 'saving'}
                  className='min-w-0 flex-1 bg-transparent font-okxs text-sm outline-none placeholder:text-foreground/30 disabled:cursor-wait'
                />
              ) : (
                <span className='flex-1 truncate font-okxs text-sm text-default-600'>
                  {savedPhoneNumber || (
                    <span className='text-default-300'>Add phone number</span>
                  )}
                </span>
              )}

              <div className='flex shrink-0 items-center gap-2'>
                {phoneStatus === 'saving' && (
                  <span className='font-okxs text-[10px] uppercase tracking-widest text-default-400'>
                    Saving…
                  </span>
                )}
                {isEditingPhone && phoneStatus !== 'saving' && (
                  <button
                    type='button'
                    onClick={cancelPhoneEditing}
                    aria-label='Cancel'
                    className='text-brand transition-colors hover:text-foreground'>
                    <Icon name='x' className='size-4' />
                  </button>
                )}
                {phoneStatus !== 'saving' && (
                  <button
                    type='button'
                    onClick={() => {
                      if (isEditingPhone) {
                        void savePhoneNumber()
                        return
                      }
                      startPhoneEditing()
                    }}
                    aria-label={isEditingPhone ? 'Save' : 'Edit phone number'}
                    className='text-default-400 transition-colors hover:text-foreground'>
                    <Icon
                      name={isEditingPhone ? 'check' : 'pen'}
                      className={cn('size-4 opacity-60', {
                        'opacity-100': isEditingPhone,
                      })}
                    />
                  </button>
                )}
              </div>
            </div>
            {phoneStatus === 'error' && (
              <p className='font-okxs text-xs text-rose-400 px-1'>
                Unable to save. Try again.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className='max-w-xl space-y-6'>
        <div>
          <h2 className='font-clash text-xl tracking-tight'>Security</h2>
          <p className='mt-1 font-okxs text-xs opacity-60'>
            Manage your account password.
          </p>
        </div>

        {hasPasswordProvider ? (
          <div className='space-y-2'>
            <div className='flex h-11 items-center gap-3 rounded-xs border border-foreground/10 bg-default-50/50 px-3 dark:bg-dark-table/30'>
              <Icon name='lock' className='size-4 shrink-0 text-default-400' />
              <span className='flex-1 font-okxs text-sm text-default-600'>
                Password
              </span>
              <button
                type='button'
                disabled={resetStatus === 'sending' || resetStatus === 'sent'}
                onClick={() => void handlePasswordReset()}
                className={cn(
                  'font-okxs text-xs transition-colors',
                  resetStatus === 'sent'
                    ? 'text-emerald-500 cursor-default'
                    : resetStatus === 'error'
                      ? 'text-rose-400 hover:text-rose-300'
                      : resetStatus === 'sending'
                        ? 'text-default-300 cursor-wait'
                        : 'text-default-400 hover:text-foreground',
                )}>
                {resetStatus === 'sending' && 'Sending…'}
                {resetStatus === 'sent' && (
                  <span className='flex items-center gap-1.5'>
                    <Icon name='check' className='size-3.5' />
                    Email sent
                  </span>
                )}
                {resetStatus === 'error' && 'Retry'}
                {resetStatus === 'idle' && 'Send reset email'}
              </button>
            </div>
            {resetStatus === 'sent' && (
              <p className='px-1 font-okxs text-xs text-default-400'>
                Check{' '}
                <span className='font-medium text-foreground'>
                  {firebaseUser?.email}
                </span>{' '}
                for a link to reset your password.
              </p>
            )}
            {resetStatus === 'error' && (
              <p className='px-1 font-okxs text-xs text-rose-400'>
                Unable to send reset email. Try again.
              </p>
            )}
          </div>
        ) : (
          <div className='flex h-11 items-center gap-3 rounded-xs border border-foreground/10 bg-default-50/50 px-3 dark:bg-dark-table/30'>
            <Icon name='google' className='size-4 shrink-0 text-default-400' />
            <span className='font-okxs text-sm text-default-500'>
              Signed in with Google — no password to manage.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
