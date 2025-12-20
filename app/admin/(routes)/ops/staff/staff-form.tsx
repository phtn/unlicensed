'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useMutation} from 'convex/react'
import {useCallback, useEffect, useRef, useState} from 'react'
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
  position: string
  accessRoles: string[]
  active: boolean
}

const defaultValues: StaffFormValues = {
  email: '',
  name: '',
  position: '',
  accessRoles: [],
  active: true,
}

const ROLE_OPTIONS = [
  {value: 'admin', label: 'Admin'},
  {value: 'editor', label: 'Editor'},
  {value: 'viewer', label: 'Viewer'},
  {value: 'manager', label: 'Manager'},
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
  const createStaff = useMutation(api.staff.m.createStaff)
  const updateStaff = useMutation(api.staff.m.updateStaff)
  const [activeSection, setActiveSection] = useState<string>('basic-info')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const mainScrollRef = useRef<HTMLElement>(null)

  const formValues = initialValues ?? defaultValues

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

        const payload = {
          email: value.email.trim(),
          name: value.name.trim() || undefined,
          position: value.position.trim(),
          accessRoles: value.accessRoles,
          active: value.active ?? true,
        }

        if (isEditMode && staffId) {
          await updateStaff({
            id: staffId,
            ...payload,
          })
          setStatus('success')
          onUpdated?.()
        } else {
          await createStaff(payload)
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

  // Populate form when initialValues change
  useEffect(() => {
    if (initialValues) {
      form.setFieldValue('email', initialValues.email)
      form.setFieldValue('name', initialValues.name ?? '')
      form.setFieldValue('position', initialValues.position)
      form.setFieldValue('accessRoles', initialValues.accessRoles ?? [])
      form.setFieldValue('active', initialValues.active ?? true)
    }
  }, [initialValues, form])

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
          <h1 className='text-lg flex items-center space-x-2 pl-2 tracking-tighter font-semibold py-4 text-dark-gray dark:text-foreground'>
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
            onPress={form.handleSubmit}>
            {isSubmitting
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
                ? 'Update Staff'
                : 'Create Staff'}
          </Button>
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
              <h2 className='text-xl font-semibold tracking-tight mb-4'>
                Basic Information
              </h2>
              <div className='space-y-6'>
                {/* Email */}
                <form.AppField name='email'>
                  {(field) => (
                    <TextField
                      {...field}
                      type='text'
                      name='email'
                      label='Email'
                      placeholder='staff@example.com'
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

                {/* Position */}
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
              isLoading={isSubmitting}>
              {isSubmitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Update Staff'
                  : 'Create Staff'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
