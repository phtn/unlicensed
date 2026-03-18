'use client'

import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {onError} from '@/ctx/toast'
import {useAccount} from '@/hooks/use-account'
import {Icon} from '@/lib/icons'
import {useMutation} from 'convex/react'
import {useEffect, useRef, useState} from 'react'
import {AccountNav} from './_components/account-nav'
import {ProfileCard} from './_components/profile-card'
import {RecentOrders} from './_components/recent-orders'
import {RewardPoints} from './_components/reward-points'

export default function AccountPage() {
  const {user, orders, pointsBalance} = useAccount()
  const updateContact = useMutation(api.users.m.updateContact)
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
      await updateContact({
        fid,
        contact: {
          phone: nextPhoneNumber,
        },
      })
      setPhoneStatus('idle')
      setIsEditingPhone(false)
    } catch (error) {
      console.error('Failed to update phone number:', error)
      setPhoneStatus('error')
      onError('Failed to update phone number')
    }
  }

  // Loading State (Initial page load only)
  const isLoading = !user

  if (isLoading) {
    return (
      <div className='min-h-140 w-full flex'>
        <Loader className='scale-50' />
      </div>
    )
  }

  return (
    <div className='h-[calc(100lvh-140px)]'>
      {/* Header Section */}
      <AccountNav />
      <div className='px-4 xl:px-6 2xl:px-0 pb-10'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column: Profile & Rewards (1/3 width) */}
          <div className='space-y-3 lg:col-span-1 pt-3'>
            {/* Profile Card */}
            <ProfileCard user={user} />
            {/* Points Balance Card */}
            <div className='space-y-1'>
              <div className='h-10.5 bg-white/10 flex items-center justify-between w-full space-x-2 px-2 border border-sidebar/50'>
                <div className='flex items-center space-x-2 w-full min-w-0'>
                  <Icon name='phone' className='size-6 shrink-0' />
                  {isEditingPhone ? (
                    <input
                      ref={phoneInputRef}
                      type='tel'
                      value={phoneNumber}
                      onChange={(event) => {
                        setPhoneNumber(event.target.value)
                        if (phoneStatus !== 'idle') setPhoneStatus('idle')
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void savePhoneNumber()
                        }

                        if (event.key === 'Escape') {
                          event.preventDefault()
                          cancelPhoneEditing()
                        }
                      }}
                      placeholder='Add phone number'
                      autoComplete='tel'
                      spellCheck='false'
                      aria-label='Phone number'
                      disabled={phoneStatus === 'saving'}
                      className='w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-foreground/40 disabled:cursor-wait'
                    />
                  ) : (
                    <span className='text-sm truncate'>
                      {savedPhoneNumber || 'Add phone number'}
                    </span>
                  )}
                </div>
                <div className='flex items-center justify-end min-w-12 shrink-0'>
                  {phoneStatus === 'saving' && (
                    <span className='text-[10px] uppercase tracking-[0.18em] opacity-60'>
                      Saving
                    </span>
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
                      aria-label={
                        isEditingPhone
                          ? 'Save phone number'
                          : 'Edit phone number'
                      }
                      className='inline-flex items-center justify-center'>
                      <Icon
                        name={isEditingPhone ? 'check' : 'pen'}
                        className='size-5'
                      />
                    </button>
                  )}
                </div>
              </div>
              {phoneStatus === 'error' && (
                <p className='px-2 text-xs text-rose-400'>
                  Unable to save. Press Enter or click away to retry.
                </p>
              )}
            </div>
            {pointsBalance && <RewardPoints pointsBalance={pointsBalance} />}
            {/* Loyalty Progress Card */}
          </div>

          {/* Right Column: Orders (2/3 width) */}
          <div className='lg:col-span-2'>
            {/* Recent Orders Section */}
            <RecentOrders orders={orders} />
          </div>
        </div>
      </div>
    </div>
  )
}
