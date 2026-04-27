'use client'

import {api} from '@/convex/_generated/api'
import type {Id} from '@/convex/_generated/dataModel'
import type {AddressType} from '@/convex/users/d'
import {onError, onSuccess} from '@/ctx/toast'
import {useAccount} from '@/hooks/use-account'
import {useAuth} from '@/hooks/use-auth'
import {sendPasswordReset} from '@/lib/firebase/auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useMutation, useQuery} from 'convex/react'
import {useEffect, useRef, useState} from 'react'

interface AccountSettingsProps {
  user: ReturnType<typeof useAccount>['user']
}

type AddressFormData = {
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  isDefault: boolean
}

const EMPTY_ADDRESS_FORM: AddressFormData = {
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US',
  phone: '',
  isDefault: false,
}

export const AccountSettings = ({user}: AccountSettingsProps) => {
  const {user: firebaseUser} = useAuth()

  const updateContact = useMutation(api.users.m.updateContact)
  const updateProfile = useMutation(api.users.m.updateProfile)
  const updateAvatar = useMutation(api.users.m.updateAvatar)
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl)
  const addAddressMutation = useMutation(api.users.m.addAddress)
  const updateAddressMutation = useMutation(api.users.m.updateAddress)
  const removeAddressMutation = useMutation(api.users.m.removeAddress)

  const addresses =
    useQuery(
      api.users.q.getUserAddresses,
      user?.fid ? {fid: user.fid, type: 'shipping'} : 'skip',
    ) ?? []

  const hasPasswordProvider =
    firebaseUser?.providerData.some((p) => p.providerId === 'password') ?? false

  // ── Avatar ──────────────────────────────────────────
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarFileRef = useRef<HTMLInputElement>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user?.fid) return
    setAvatarUploading(true)
    try {
      const uploadUrl = await generateUploadUrl()
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {'Content-Type': file.type},
        body: file,
      })
      if (!res.ok) throw new Error('Upload failed')
      const {storageId} = (await res.json()) as {storageId: string}
      await updateAvatar({
        fid: user.fid,
        storageId: storageId as Id<'_storage'>,
      })
      onSuccess('Avatar updated')
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      onError('Failed to update avatar')
    } finally {
      setAvatarUploading(false)
      if (avatarFileRef.current) avatarFileRef.current.value = ''
    }
  }

  // ── Display name ─────────────────────────────────────
  const [isEditingName, setIsEditingName] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'error'>(
    'idle',
  )
  const nameInputRef = useRef<HTMLInputElement>(null)
  const savedName = user?.name ?? ''

  useEffect(() => {
    if (!isEditingName || !nameInputRef.current) return
    nameInputRef.current.focus()
    nameInputRef.current.select()
  }, [isEditingName])

  function startNameEditing() {
    setDisplayName(savedName)
    setNameStatus('idle')
    setIsEditingName(true)
  }

  function cancelNameEditing() {
    setDisplayName(savedName)
    setNameStatus('idle')
    setIsEditingName(false)
  }

  async function saveDisplayName() {
    if (!user?.fid) return
    const next = displayName.trim()
    if (!next || next === savedName) {
      cancelNameEditing()
      return
    }
    setNameStatus('saving')
    try {
      await updateProfile({fid: user.fid, name: next})
      setNameStatus('idle')
      setIsEditingName(false)
    } catch (err) {
      console.error('Failed to update name:', err)
      setNameStatus('error')
      onError('Failed to update display name')
    }
  }

  // ── Phone ────────────────────────────────────────────
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'saving' | 'error'>(
    'idle',
  )
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const savedPhoneNumber = user?.contact?.phone ?? ''

  useEffect(() => {
    if (!isEditingPhone || !phoneInputRef.current) return
    phoneInputRef.current.focus()
    phoneInputRef.current.select()
  }, [isEditingPhone])

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
      await updateContact({fid, contact: {phone: nextPhoneNumber}})
      setPhoneStatus('idle')
      setIsEditingPhone(false)
    } catch (error) {
      console.error('Failed to update phone number:', error)
      setPhoneStatus('error')
      onError('Failed to update phone number')
    }
  }

  // ── Password reset ───────────────────────────────────
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

  // ── Addresses ────────────────────────────────────────
  const [addressMode, setAddressMode] = useState<string>('idle')
  const [addressForm, setAddressForm] =
    useState<AddressFormData>(EMPTY_ADDRESS_FORM)
  const [addressSaving, setAddressSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function openAddressForm() {
    setAddressForm(EMPTY_ADDRESS_FORM)
    setAddressMode('adding')
  }

  function openEditAddress(address: AddressType) {
    setAddressForm({
      firstName: address.firstName,
      lastName: address.lastName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? '',
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone ?? '',
      isDefault: address.isDefault ?? false,
    })
    setAddressMode(address.id)
  }

  function closeAddressForm() {
    setAddressMode('idle')
    setAddressForm(EMPTY_ADDRESS_FORM)
  }

  async function saveAddress() {
    if (!user?.fid) return
    const fid = user.fid
    const {firstName, lastName, addressLine1, city, state, zipCode, country} =
      addressForm
    if (
      !firstName ||
      !lastName ||
      !addressLine1 ||
      !city ||
      !state ||
      !zipCode ||
      !country
    ) {
      onError('Please fill in all required fields')
      return
    }
    setAddressSaving(true)
    try {
      const address: AddressType = {
        id:
          addressMode === 'adding'
            ? crypto.randomUUID()
            : (addressMode as string),
        type: 'shipping',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressForm.addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        country: country.trim(),
        phone: addressForm.phone.trim() || undefined,
        isDefault: addressForm.isDefault,
      }
      if (addressMode === 'adding') {
        await addAddressMutation({fid, address})
        onSuccess('Address added')
      } else {
        await updateAddressMutation({fid, addressId: addressMode, address})
        onSuccess('Address updated')
      }
      closeAddressForm()
    } catch (err) {
      console.error('Failed to save address:', err)
      onError('Failed to save address')
    } finally {
      setAddressSaving(false)
    }
  }

  async function deleteAddress(addressId: string) {
    if (!user?.fid) return
    setDeletingId(addressId)
    try {
      await removeAddressMutation({fid: user.fid, addressId})
      onSuccess('Address removed')
    } catch (err) {
      console.error('Failed to remove address:', err)
      onError('Failed to remove address')
    } finally {
      setDeletingId(null)
    }
  }

  const initial = (user?.name ?? '').charAt(0).toUpperCase()

  return (
    <div className='px-4 py-12 xl:px-6 2xl:px-0 grid md:grid-cols-2 gap-12 md:gap-0'>
      <div className=' space-y-12'>
        {/* ── Profile ─────────────────────────────────────── */}
        <div className='max-w-xl space-y-6'>
          <div>
            <h2 className='font-clash text-xl tracking-tight'>Profile</h2>
            <p className='mt-1 font-okxs text-xs opacity-60'>
              Update your avatar and display name.
            </p>
          </div>

          <div className='space-y-2'>
            {/* Avatar */}
            <div className='flex h-14 items-center gap-4 rounded-xs border border-foreground/10 bg-background px-3 dark:bg-dark-table/30'>
              <button
                type='button'
                onClick={() => avatarFileRef.current?.click()}
                disabled={avatarUploading}
                aria-label='Change avatar'
                className='relative size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-foreground/10 transition-opacity hover:opacity-75 disabled:cursor-wait'>
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt='Avatar'
                    className='size-full object-cover'
                  />
                ) : (
                  <div className='flex size-full items-center justify-center bg-linear-to-br from-indigo-100 to-pink-100 text-sm font-medium text-foreground/60 dark:from-indigo-900/30 dark:to-pink-900/30'>
                    {initial}
                  </div>
                )}
                {avatarUploading && (
                  <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/50'>
                    <Icon name='spinners-ring' className='size-4 text-white' />
                  </div>
                )}
              </button>
              <span className='flex-1 font-okxs text-sm text-default-500'>
                {avatarUploading ? 'Uploading…' : 'Click to change photo'}
              </span>
              <span className='font-okxs text-[10px] uppercase tracking-widest text-default-300'>
                Avatar
              </span>
              <input
                ref={avatarFileRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={(e) => void handleAvatarChange(e)}
              />
            </div>

            {/* Display name */}
            <div className='space-y-1'>
              <div className='flex h-12 items-center gap-3 rounded-xs border border-foreground/10 bg-background px-3 transition-colors focus-within:border-foreground/30 dark:bg-dark-table/30'>
                <Icon
                  name='user'
                  className='size-4 shrink-0 text-default-400'
                />
                {isEditingName ? (
                  <input
                    ref={nameInputRef}
                    type='text'
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value)
                      if (nameStatus !== 'idle') setNameStatus('idle')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void saveDisplayName()
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        cancelNameEditing()
                      }
                    }}
                    placeholder='Display name'
                    disabled={nameStatus === 'saving'}
                    className='min-w-0 flex-1 bg-transparent font-okxs text-sm outline-none placeholder:text-foreground/30 disabled:cursor-wait'
                  />
                ) : (
                  <span className='flex-1 truncate font-okxs text-sm text-default-600'>
                    {savedName || (
                      <span className='text-default-300'>Display name</span>
                    )}
                  </span>
                )}
                <div className='flex shrink-0 items-center gap-2'>
                  {nameStatus === 'saving' && (
                    <span className='font-okxs text-[10px] uppercase tracking-widest text-default-400'>
                      Saving…
                    </span>
                  )}
                  {isEditingName && nameStatus !== 'saving' && (
                    <button
                      type='button'
                      onClick={cancelNameEditing}
                      aria-label='Cancel'
                      className='text-brand transition-colors hover:text-foreground'>
                      <Icon name='x' className='size-4' />
                    </button>
                  )}
                  {nameStatus !== 'saving' && (
                    <button
                      type='button'
                      onClick={() => {
                        if (isEditingName) {
                          void saveDisplayName()
                          return
                        }
                        startNameEditing()
                      }}
                      aria-label={isEditingName ? 'Save' : 'Edit name'}
                      className='text-default-400 transition-colors hover:text-foreground'>
                      <Icon
                        name={isEditingName ? 'check' : 'pen'}
                        className={cn('size-4 opacity-60', {
                          'opacity-100': isEditingName,
                        })}
                      />
                    </button>
                  )}
                </div>
              </div>
              {nameStatus === 'error' && (
                <p className='px-1 font-okxs text-xs text-rose-400'>
                  Unable to save. Try again.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Contact ─────────────────────────────────────── */}
        <div className='max-w-xl space-y-6'>
          <div>
            <h2 className='font-clash text-xl tracking-tight'>
              Account Settings
            </h2>
            <p className='mt-1 font-okxs text-xs opacity-60'>
              Manage your contact information and preferences.
            </p>
          </div>

          <div className='space-y-2'>
            {user?.email && (
              <div className='flex h-11 items-center gap-3 rounded-xs border border-foreground/10 bg-default-50/50 px-3 dark:bg-dark-table/30'>
                <Icon
                  name='email'
                  className='size-4 shrink-0 text-default-400'
                />
                <span className='font-okxs text-sm text-default-600'>
                  {user.email}
                </span>
                <span className='ml-auto font-okxs text-[10px] uppercase tracking-widest text-default-300'>
                  Email
                </span>
              </div>
            )}

            <div className='space-y-1'>
              <div className='flex h-11 items-center gap-3 rounded-xs border border-foreground/10 bg-background px-3 transition-colors focus-within:border-foreground/30 dark:bg-dark-table/30'>
                <Icon
                  name='phone'
                  className='size-4 shrink-0 text-default-400'
                />
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
      </div>
      <div className=' space-y-12'>
        {/* ── Shipping Addresses ──────────────────────────── */}
        <div className='max-w-xl space-y-6'>
          <div className='flex items-end justify-between'>
            <div>
              <h2 className='font-clash text-xl tracking-tight'>
                Shipping Addresses
              </h2>
              <p className='mt-1 font-okxs text-xs opacity-60'>
                Manage your saved shipping addresses.
              </p>
            </div>
            {addressMode === 'idle' && (
              <button
                type='button'
                onClick={openAddressForm}
                className='flex items-center gap-1.5 font-okxs text-xs text-default-400 transition-colors hover:text-foreground'>
                <Icon name='plus' className='size-3.5' />
                Add
              </button>
            )}
          </div>

          <div className='space-y-2'>
            {addresses.length === 0 && addressMode === 'idle' && (
              <div className='flex h-11 items-center gap-3 rounded-xs border border-foreground/10 bg-default-50/50 px-3 dark:bg-dark-table/30'>
                <Icon
                  name='home'
                  className='size-4 shrink-0 text-default-400'
                />
                <span className='font-okxs text-sm text-default-400'>
                  No shipping addresses saved.
                </span>
              </div>
            )}

            {addresses.map((address) =>
              addressMode === address.id ? (
                <AddressForm
                  key={address.id}
                  form={addressForm}
                  onChange={(updates) =>
                    setAddressForm((prev) => ({...prev, ...updates}))
                  }
                  onSave={() => void saveAddress()}
                  onCancel={closeAddressForm}
                  saving={addressSaving}
                  mode='edit'
                />
              ) : (
                <div
                  key={address.id}
                  className='flex items-start gap-3 rounded-xs border border-foreground/10 bg-background p-3 dark:bg-dark-table/30 min-h-28'>
                  <Icon
                    name='home'
                    className='mt-0.5 size-4 shrink-0 text-default-400'
                  />
                  <div className='min-w-0 flex-1'>
                    <p className='font-okxs text-sm text-default-700'>
                      {address.firstName} {address.lastName}
                      {address.isDefault && (
                        <span className='ml-2 font-okxs text-[10px] uppercase tracking-widest text-brand'>
                          Default
                        </span>
                      )}
                    </p>
                    <p className='truncate font-okxs text-sm text-default-400'>
                      {address.addressLine1}
                      {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                    </p>
                    <p className='font-okxs text-sm text-default-400'>
                      {address.city}, {address.state} {address.zipCode},{' '}
                      {address.country}
                    </p>
                  </div>
                  <div className='mt-0.5 flex shrink-0 items-center gap-2'>
                    <button
                      type='button'
                      onClick={() => openEditAddress(address)}
                      aria-label='Edit address'
                      disabled={!!deletingId}
                      className='text-default-400 transition-colors hover:text-foreground disabled:opacity-40'>
                      <Icon name='pen' className='size-3.5' />
                    </button>
                    <button
                      type='button'
                      onClick={() => void deleteAddress(address.id)}
                      aria-label='Delete address'
                      disabled={deletingId === address.id}
                      className='text-default-400 transition-colors hover:text-rose-400 disabled:opacity-40'>
                      <Icon
                        name={
                          deletingId === address.id ? 'spinners-ring' : 'trash'
                        }
                        className='size-3.5'
                      />
                    </button>
                  </div>
                </div>
              ),
            )}

            {addressMode === 'adding' && (
              <AddressForm
                form={addressForm}
                onChange={(updates) =>
                  setAddressForm((prev) => ({...prev, ...updates}))
                }
                onSave={() => void saveAddress()}
                onCancel={closeAddressForm}
                saving={addressSaving}
                mode='add'
              />
            )}
          </div>
        </div>

        {/* ── Security ────────────────────────────────────── */}
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
                <Icon
                  name='lock'
                  className='size-4 shrink-0 text-default-400'
                />
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
              <Icon
                name='google'
                className='size-4 shrink-0 text-default-400'
              />
              <span className='font-okxs text-sm text-default-500'>
                Signed in with Google — no password to manage.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type AddressFormProps = {
  form: AddressFormData
  onChange: (updates: Partial<AddressFormData>) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  mode: 'add' | 'edit'
}

const AddressForm = ({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  mode,
}: AddressFormProps) => {
  const inputCls =
    'w-full bg-transparent font-okxs text-sm outline-none placeholder:text-foreground/30 disabled:cursor-wait'
  const fieldCls =
    'flex h-9 items-center rounded-xs border border-foreground/10 bg-background px-3 transition-colors focus-within:border-foreground/30 dark:bg-dark-table/30'

  return (
    <div className='space-y-2 rounded-xs border border-foreground/20 bg-background p-3 dark:bg-dark-table/30'>
      <p className='font-okxs text-[10px] uppercase tracking-widest text-default-400'>
        {mode === 'add' ? 'New address' : 'Edit address'}
      </p>
      <div className='grid grid-cols-2 gap-2'>
        <div className={fieldCls}>
          <input
            type='text'
            placeholder='First name'
            value={form.firstName}
            onChange={(e) => onChange({firstName: e.target.value})}
            disabled={saving}
            className={inputCls}
          />
        </div>
        <div className={fieldCls}>
          <input
            type='text'
            placeholder='Last name'
            value={form.lastName}
            onChange={(e) => onChange({lastName: e.target.value})}
            disabled={saving}
            className={inputCls}
          />
        </div>
      </div>
      <div className={fieldCls}>
        <input
          type='text'
          placeholder='Address line 1'
          value={form.addressLine1}
          onChange={(e) => onChange({addressLine1: e.target.value})}
          disabled={saving}
          className={inputCls}
        />
      </div>
      <div className={fieldCls}>
        <input
          type='text'
          placeholder='Address line 2 (optional)'
          value={form.addressLine2}
          onChange={(e) => onChange({addressLine2: e.target.value})}
          disabled={saving}
          className={inputCls}
        />
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <div className={fieldCls}>
          <input
            type='text'
            placeholder='City'
            value={form.city}
            onChange={(e) => onChange({city: e.target.value})}
            disabled={saving}
            className={inputCls}
          />
        </div>
        <div className={fieldCls}>
          <input
            type='text'
            placeholder='State'
            value={form.state}
            onChange={(e) => onChange({state: e.target.value})}
            disabled={saving}
            className={inputCls}
          />
        </div>
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <div className={fieldCls}>
          <input
            type='text'
            placeholder='ZIP code'
            value={form.zipCode}
            onChange={(e) => onChange({zipCode: e.target.value})}
            disabled={saving}
            className={inputCls}
          />
        </div>
        <div className={fieldCls}>
          <input
            type='text'
            placeholder='Country'
            value={form.country}
            onChange={(e) => onChange({country: e.target.value})}
            disabled={saving}
            className={inputCls}
          />
        </div>
      </div>
      <div className={fieldCls}>
        <input
          type='tel'
          placeholder='Phone (optional)'
          value={form.phone}
          onChange={(e) => onChange({phone: e.target.value})}
          disabled={saving}
          className={inputCls}
        />
      </div>
      <label className='flex cursor-pointer items-center gap-2'>
        <input
          type='checkbox'
          checked={form.isDefault}
          onChange={(e) => onChange({isDefault: e.target.checked})}
          disabled={saving}
          className='size-3.5 accent-current'
        />
        <span className='font-okxs text-xs text-default-500'>
          Set as default shipping address
        </span>
      </label>
      <div className='flex items-center justify-end gap-3 pt-1'>
        <button
          type='button'
          onClick={onCancel}
          disabled={saving}
          className='font-okxs text-xs text-default-400 transition-colors hover:text-foreground disabled:opacity-40'>
          Cancel
        </button>
        <button
          type='button'
          onClick={onSave}
          disabled={saving}
          className='flex items-center gap-1.5 rounded-xs bg-foreground px-3 py-1.5 font-okxs text-xs text-background transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-40'>
          {saving ? (
            <>
              <Icon name='spinners-ring' className='size-3.5' />
              Saving…
            </>
          ) : (
            <>
              <Icon name='check' className='size-3.5' />
              {mode === 'add' ? 'Add address' : 'Save changes'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
