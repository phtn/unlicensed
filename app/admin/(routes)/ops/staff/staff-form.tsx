'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuth} from '@/hooks/use-auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  SelectField,
  SelectOption,
  SwitchField,
  TextField,
} from '../../../_components/ui/fields'
import {useAppForm} from '../../../_components/ui/form-context'

export type StaffFormValues = {
  email: string
  name: string
  division: string
  position: string
  accessRoles: string[]
  active: boolean
  avatarUrl: string
}

const defaultValues: StaffFormValues = {
  email: '',
  name: '',
  division: '',
  position: '',
  accessRoles: [],
  active: true,
  avatarUrl: '',
}

const ROLE_OPTIONS = [
  {value: 'admin', label: 'Admin'},
  {value: 'manager', label: 'Manager'},
  {value: 'supervisor', label: 'Supervisor'},
  {value: 'developer', label: 'Developer'},
  {value: 'sysadmin', label: 'SysAdmin'},
  {value: 'courier', label: 'Courier'},
  {value: 'staff', label: 'Staff'},
  {value: 'viewer', label: 'Viewer'},
] as SelectOption[]

type StaffFormProps = {
  staffId?: Id<'staff'>
  initialValues?: StaffFormValues
  onCreated?: VoidFunction
  onUpdated?: VoidFunction
}

export const StaffForm = ({
  staffId,
  initialValues,
  onCreated,
  onUpdated,
}: StaffFormProps) => {
  const isEditMode = !!staffId
  const {user: firebaseUser} = useAuth()
  const createStaff = useMutation(api.staff.m.createStaff)
  const updateStaff = useMutation(api.staff.m.updateStaff)
  const [activeSection, setActiveSection] = useState<string>('basic-info')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const mainScrollRef = useRef<HTMLElement>(null)

  // Get current user for authorization
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    firebaseUser ? {fid: firebaseUser.uid} : 'skip',
  )

  // Get current user's staff record for authorization check
  const currentUserStaff = useQuery(
    api.staff.q.getStaffByEmail,
    convexUser?.email ? {email: convexUser.email} : 'skip',
  )

  // Check if current user is authorized (admin or manager) to create staff
  const isAuthorizedToCreate = useMemo(() => {
    if (!currentUserStaff || !currentUserStaff.active) return false
    return (
      currentUserStaff.accessRoles.includes('admin') ||
      currentUserStaff.accessRoles.includes('manager')
    )
  }, [currentUserStaff])

  // Fetch all users for email selection
  const users = useQuery(api.users.q.getAllUsers, {limit: 1000})

  // Transform users to SelectOption format
  const userEmailOptions = useMemo<SelectOption[]>(() => {
    if (!users) return []
    return users.map((user) => ({
      value: user.email,
      label: user.name ? `${user.name} (${user.email})` : user.email,
    }))
  }, [users])

  // Create a map of email to user for quick lookup
  const emailToUserMap = useMemo(() => {
    if (!users)
      return new Map<
        string,
        {email: string; name: string; photoUrl: string | undefined}
      >()
    const map = new Map<
      string,
      {email: string; name: string; photoUrl: string | undefined}
    >()
    users.forEach((user) => {
      map.set(user.email, {
        email: user.email,
        name: user.name,
        photoUrl: user.photoUrl,
      })
    })
    return map
  }, [users])

  // Memoize formValues to ensure stable reference
  const formValues = useMemo(
    () => initialValues ?? defaultValues,
    [initialValues],
  )

  const form = useAppForm({
    defaultValues: formValues,
    onSubmit: async ({value, formApi}) => {
      setStatus('idle')
      setErrorMessage(null)
      try {
        // Validation
        if (!value.email?.trim()) {
          setErrorMessage('Email is required')
          setStatus('error')
          return
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())) {
          setErrorMessage('Please enter a valid email address')
          setStatus('error')
          return
        }

        if (!value.position?.trim()) {
          setErrorMessage('Position is required')
          setStatus('error')
          return
        }

        if (!value.accessRoles || value.accessRoles.length === 0) {
          setErrorMessage('At least one access role is required')
          setStatus('error')
          return
        }

        if (isEditMode && staffId) {
          // For updates, don't include email (it shouldn't be changed)
          await updateStaff({
            id: staffId,
            name: value.name.trim() || undefined,
            position: value.position.trim(),
            division: value.division.trim() || undefined,
            accessRoles: value.accessRoles,
            active: value.active ?? true,
            avatarUrl: value.avatarUrl.trim() || undefined,
          })
          setStatus('success')
          onUpdated?.()
        } else {
          // For creation, include email and current user email for authorization
          if (!convexUser?.email) {
            setErrorMessage('You must be signed in to create staff members')
            setStatus('error')
            return
          }

          const createPayload = {
            email: value.email.trim(),
            name: value.name.trim() || undefined,
            position: value.position.trim(),
            division: value.division.trim() || undefined,
            accessRoles: value.accessRoles,
            active: value.active ?? true,
            avatarUrl: value.avatarUrl.trim() || undefined,
            currentUserEmail: convexUser.email,
          }
          await createStaff(createPayload)
          formApi.reset()
          setStatus('success')
          const scrollContainer = mainScrollRef.current
          const basicInfoElement = document.getElementById('basic-info')
          if (basicInfoElement && scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect()
            const elementRect = basicInfoElement.getBoundingClientRect()
            const scrollTop =
              scrollContainer.scrollTop + elementRect.top - containerRect.top

            scrollContainer.scrollTo({
              top: scrollTop + 16,
              behavior: 'smooth',
            })
          } else if (basicInfoElement) {
            basicInfoElement.scrollIntoView({behavior: 'smooth'})
          }
          onCreated?.()
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : isEditMode
              ? 'Failed to update staff member.'
              : 'Failed to create staff member.'
        setErrorMessage(message)
        setStatus('error')
      }
    },
  })

  // Subscribe to email field value changes
  const emailValue = useStore(
    form.store,
    (state) => state.values.email as string | undefined,
  )
  const nameValue = useStore(
    form.store,
    (state) => state.values.name as string | undefined,
  )

  // Track previous email to detect changes
  const previousEmailRef = useRef<string>('')

  // Handle email selection change to auto-populate name and avatarUrl
  useEffect(() => {
    if (
      emailValue &&
      typeof emailValue === 'string' &&
      emailValue !== previousEmailRef.current &&
      emailToUserMap.size > 0 // Ensure users are loaded
    ) {
      const user = emailToUserMap.get(emailValue)
      if (user) {
        // Auto-populate name when email is selected
        // Only overwrite if name is empty or if we're in create mode (not edit mode)
        const currentName = nameValue
        if (!currentName?.trim() || !isEditMode) {
          form.setFieldValue('name', user.name)
        }
        // Auto-populate avatarUrl from user's photoUrl
        if (user.photoUrl) {
          form.setFieldValue('avatarUrl', user.photoUrl)
        }
      }
      previousEmailRef.current = emailValue
    }
  }, [emailValue, nameValue, emailToUserMap, form, isEditMode])

  // Track if we've populated initial values to avoid re-running unnecessarily
  const hasPopulatedInitialValues = useRef(false)

  // Populate form when initialValues change (for edit mode)
  useEffect(() => {
    if (initialValues && isEditMode) {
      // Set all field values, ensuring division is explicitly set even if empty
      form.setFieldValue('email', initialValues.email ?? '')
      form.setFieldValue('name', initialValues.name ?? '')
      form.setFieldValue('division', initialValues.division ?? '')
      form.setFieldValue('position', initialValues.position ?? '')
      form.setFieldValue('accessRoles', initialValues.accessRoles ?? [])
      form.setFieldValue('active', initialValues.active ?? true)
      form.setFieldValue('avatarUrl', initialValues.avatarUrl ?? '')
      // Reset previousEmailRef when initialValues change to prevent auto-populate on initial load
      previousEmailRef.current = initialValues.email ?? ''
      hasPopulatedInitialValues.current = true
    }
  }, [initialValues, isEditMode, form])

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  const scrollToSection = useCallback(
    (sectionId: string) => () => {
      setActiveSection(sectionId)
      const element = document.getElementById(sectionId)
      const scrollContainer = mainScrollRef.current

      if (element && scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()
        const scrollTop =
          scrollContainer.scrollTop + elementRect.top - containerRect.top

        scrollContainer.scrollTo({
          top: scrollTop + 16,
          behavior: 'smooth',
        })
      } else if (element) {
        element.scrollIntoView({behavior: 'smooth', block: 'start'})
      }
    },
    [],
  )

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 lg:p-0 items-start h-[calc(100vh-6rem)]'>
      {/* Left Sidebar Navigation */}
      <aside className='hidden lg:block cols-span-3 2xl:col-span-2 col-span-3 h-full overflow-y-auto pr-2 space-y-6'>
        <nav className='flex flex-col gap-1'>
          <h1 className='text-lg flex items-center space-x-2 pl-2 font-medium py-4 opacity-80'>
            <div
              aria-hidden
              className='size-4 select-none aspect-square rounded-full bg-pink-500'
            />
            <span>{isEditMode ? 'Edit Staff Member' : 'Create New Staff'}</span>
          </h1>
          <Button
            size='md'
            disableRipple
            disableAnimation
            variant='light'
            name='basic-info'
            onPress={scrollToSection('basic-info')}
            className={cn(
              'flex justify-start items-center gap-3 px-4 text-base font-medium tracking-tight rounded-xl transition-all text-left',
              activeSection === 'basic-info'
                ? 'dark:bg-zinc-700 dark:text-pink-300 bg-dark-gray/5 text-pink-500'
                : 'text-dark-gray/60 dark:text-light-gray/80 dark:hover:text-pink-100  hover:bg-dark-gray/5 hover:text-dark-gray/90',
            )}>
            <Icon name='file' className='size-4' />
            <span>Basic Info</span>
          </Button>
        </nav>

        <div className='px-0 xl:px-4'>
          <Button
            size='lg'
            type='submit'
            fullWidth
            className='w-full rounded-xl font-medium tracking-tight bg-pink-500 text-white'
            isLoading={isSubmitting}
            isDisabled={!isEditMode && !isAuthorizedToCreate}
            onPress={form.handleSubmit}>
            {isSubmitting
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
                ? 'Update Staff'
                : 'Create Staff'}
          </Button>
          {!isEditMode && !isAuthorizedToCreate && (
            <p className='mt-2 text-sm text-center text-rose-500'>
              Only admin or manager roles can create staff members
            </p>
          )}
          {status === 'success' && (
            <p className='mt-2 text-sm text-center text-pink-500'>
              {isEditMode
                ? 'Staff member updated successfully!'
                : 'Staff member created successfully!'}
            </p>
          )}
          {status === 'error' && errorMessage && (
            <p className='mt-2 text-sm text-center text-rose-500'>
              {errorMessage}
            </p>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        ref={mainScrollRef}
        className='col-span-1 lg:col-span-8 xl:col-span-9 2xl:col-span-10 h-full overflow-y-auto space-y-0 pb-24 scroll-smooth px-1 relative pt-2'>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className='space-y-0 pt-2'>
          <div id='basic-info' className='scroll-mt-4 space-y-6'>
            <div>
              <h2 className='text-xl font-medium mb-4 opacity-80'>
                Basic Information
              </h2>
              <div className='space-y-6'>
                {/* Email */}
                <form.AppField name='email'>
                  {(field) => (
                    <SelectField
                      {...field}
                      type='select'
                      name='email'
                      label='Email'
                      placeholder='Search and select user email...'
                      options={userEmailOptions}
                    />
                  )}
                </form.AppField>

                {/* Name */}
                <form.AppField name='name'>
                  {(field) => (
                    <TextField
                      {...field}
                      type='text'
                      name='name'
                      label='Name'
                      placeholder='John Doe'
                    />
                  )}
                </form.AppField>

                <div className='w-full flex items-cenzer space-x-4'>
                  {/* Sector */}
                  <form.AppField name='division'>
                    {(field) => (
                      <TextField
                        {...field}
                        type='text'
                        name='division'
                        label='division'
                        placeholder='e.g., Sales, Marketing, Fulfillment, Shipping'
                      />
                    )}
                  </form.AppField>
                  <form.AppField name='position'>
                    {(field) => (
                      <TextField
                        {...field}
                        type='text'
                        name='position'
                        label='Position'
                        placeholder='e.g., Store Manager, Sales Associate'
                      />
                    )}
                  </form.AppField>
                </div>
                {/* Access Roles */}
                <form.AppField name='accessRoles'>
                  {(field) => (
                    <SelectField
                      {...field}
                      type='select'
                      name='accessRoles'
                      mode='multiple'
                      label='Access Roles'
                      placeholder='Select roles'
                      options={ROLE_OPTIONS}
                    />
                  )}
                </form.AppField>

                {/* Active Switch */}
                <form.AppField name='active'>
                  {(field) => (
                    <SwitchField
                      {...field}
                      type='checkbox'
                      name='active'
                      label='Active'
                      description='Staff member is active and can access the system'
                    />
                  )}
                </form.AppField>
              </div>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className='lg:hidden sticky bottom-4 z-20 p-4 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl'>
            <Button
              type='submit'
              color='success'
              className='w-full font-semibold'
              isLoading={isSubmitting}
              isDisabled={!isEditMode && !isAuthorizedToCreate}>
              {isSubmitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Update Staff'
                  : 'Create Staff'}
            </Button>
            {!isEditMode && !isAuthorizedToCreate && (
              <p className='mt-2 text-sm text-center text-rose-500'>
                Only admin or manager roles can create staff members
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  )
}
