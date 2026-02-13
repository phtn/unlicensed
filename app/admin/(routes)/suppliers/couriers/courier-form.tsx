'use client'

import {
  FormSection,
  Header,
} from '@/app/admin/_components/category-sections/components'
import {
  courierFields,
  CourierFormApi,
  CourierFormValues,
  courierSchema,
  defaultValues,
} from '@/app/admin/_components/courier-schema'
import {
  commonInputClassNames,
  renderFields,
} from '@/app/admin/_components/ui/fields'
import {useAppForm} from '@/app/admin/_components/ui/form-context'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Input, Switch} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useMutation} from 'convex/react'
import {useCallback, useEffect, useRef, useState} from 'react'

type CourierFormProps = {
  courierId?: Id<'couriers'>
  initialValues?: CourierFormValues
  onCreated?: VoidFunction
  onUpdated?: VoidFunction
}

type CourierAccountFormValue = CourierFormValues['accounts'][number]
type EditableCourierAccountField = 'label' | 'value'

const createCourierAccountId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `courier-account-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const createEmptyCourierAccount = (): CourierAccountFormValue => ({
  id: createCourierAccountId(),
  label: '',
  value: '',
})

const SECTIONS = [
  {id: 'basic-info', label: 'Basic Info', icon: 'file'},
  {id: 'accounts', label: 'Accounts', icon: 'wallet'},
] as const

export const CourierForm = ({
  courierId,
  initialValues,
  onCreated,
  onUpdated,
}: CourierFormProps) => {
  const isEditMode = !!courierId
  const createCourier = useMutation(api.couriers.m.createCourier)
  const updateCourier = useMutation(api.couriers.m.updateCourier)
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
        const parsed = courierSchema.safeParse(value)
        if (!parsed.success) {
          const message =
            parsed.error.issues[0]?.message ??
            'Please review the courier form for validation errors.'
          setErrorMessage(message)
          setStatus('error')
          return
        }

        const data = parsed.data
        const now = Date.now()
        const code = data.code.trim().toLowerCase()
        const payload = {
          name: data.name.trim(),
          code,
          active: data.active ?? true,
          trackingUrlTemplate: data.trackingUrlTemplate?.trim() || undefined,
          accounts: data.accounts.map((account, index) => ({
            id: account.id?.trim() || `${code}-${now}-${index}`,
            label: account.label.trim(),
            value: account.value.trim(),
            createdAt: account.createdAt ?? now,
            updatedAt: now,
            updatedBy: account.updatedBy?.trim() || undefined,
          })),
        }

        if (isEditMode && courierId) {
          await updateCourier({
            ...payload,
            id: courierId,
          })
          setStatus('success')
          onUpdated?.()
        } else {
          await createCourier(payload)
          formApi.reset()
          setStatus('success')
          // Reset scroll within the container
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
              ? 'Failed to update courier.'
              : 'Failed to create courier.'
        setErrorMessage(message)
        setStatus('error')
      }
    },
  })

  // Populate form when initialValues change
  useEffect(() => {
    if (initialValues) {
      form.setFieldValue('name', initialValues.name)
      form.setFieldValue('code', initialValues.code)
      form.setFieldValue('active', initialValues.active ?? true)
      form.setFieldValue(
        'trackingUrlTemplate',
        initialValues.trackingUrlTemplate ?? '',
      )
      form.setFieldValue('accounts', initialValues.accounts ?? [])
    }
  }, [initialValues, form])

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  const scrollToSection = useCallback(
    (sectionId: string) => () => {
      setActiveSection(sectionId)
      const element = document.getElementById(sectionId)
      const scrollContainer = mainScrollRef.current

      if (element && scrollContainer) {
        // Calculate the position relative to the scrollable container
        const containerRect = scrollContainer.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()
        const scrollTop =
          scrollContainer.scrollTop + elementRect.top - containerRect.top

        scrollContainer.scrollTo({
          top: scrollTop + 16, // Account for scroll-mt-4 (1rem = 16px)
          behavior: 'smooth',
        })
      } else if (element) {
        // Fallback to default behavior if ref is not available
        element.scrollIntoView({behavior: 'smooth', block: 'start'})
      }
    },
    [],
  )

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:p-0 items-start h-[calc(100lvh-6rem)]'>
      {/* Left Sidebar Navigation */}
      <aside className='hidden lg:block cols-span-3 2xl:col-span-2 col-span-3 h-full overflow-y-auto pr-2 space-y-6'>
        <nav className='flex flex-col gap-1'>
          <h1 className='text-lg flex items-center space-x-2 pl-2 font-semibold py-4 opacity-80'>
            <div
              aria-hidden
              className='size-4 select-none aspect-square rounded-full bg-yellow-500'
            />
            <span>{isEditMode ? 'Edit Courier' : 'Create New Courier'}</span>
          </h1>
          {SECTIONS.map((section) => (
            <Button
              size='md'
              disableRipple
              disableAnimation
              variant='light'
              key={section.id}
              name={section.id}
              onPress={scrollToSection(section.id)}
              className={cn(
                'flex justify-start items-center gap-3 px-4 text-base font-medium tracking-tight rounded-xl transition-all text-left',
                activeSection === section.id
                  ? 'dark:bg-zinc-700 dark:text-yellow-300 bg-dark-gray/5 text-yellow-500'
                  : 'text-dark-gray/60 dark:text-light-gray/80 dark:hover:text-yellow-100  hover:bg-dark-gray/5 hover:text-dark-gray/90',
              )}>
              <Icon name={section.icon} className='size-4' />
              <span>{section.label}</span>
            </Button>
          ))}
        </nav>

        <div className='px-0 xl:px-4'>
          <Button
            size='lg'
            type='submit'
            fullWidth
            className='w-full rounded-xl font-medium tracking-tight bg-yellow-500 text-white'
            isLoading={isSubmitting}
            onPress={form.handleSubmit}>
            {isSubmitting
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
                ? 'Update Courier'
                : 'Create Courier'}
          </Button>
          {status === 'success' && (
            <p className='mt-2 text-sm text-center text-yellow-500'>
              {isEditMode
                ? 'Courier updated successfully!'
                : 'Courier created successfully!'}
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
        className='col-span-1 lg:col-span-8 xl:col-span-9 2xl:col-span-10 h-full overflow-y-auto space-y-0 pb-24 scroll-smooth px-1 relative pt-0'>
        {/* Active Switch - Top Right */}
        <div className='absolute top-4 right-2 z-30 flex justify-end pr-4 pt-2 pb-2'>
          <form.Field name='active'>
            {(field) => {
              const active = (field.state.value as boolean) ?? false
              return (
                <div className='flex items-center gap-3 px-4 py-1 rounded-lg bg-slate-500/20 dark:bg-black/60 backdrop-blur-sm border border-light-gray/10 dark:border-black/20 shadow-sm'>
                  <div className='flex flex-col gap-0.5'>
                    <span className='text-sm font-semibold text-dark-gray dark:text-foreground'>
                      Active
                    </span>
                    <span className='text-xs text-dark-gray/80 dark:text-light-gray/80'>
                      {active ? 'Courier is active' : 'Currently inactive'}
                    </span>
                  </div>
                  <Switch
                    isSelected={active}
                    onValueChange={(value) => field.handleChange(value)}
                    onBlur={field.handleBlur}
                    classNames={{
                      wrapper: 'group-data-[selected=true]:bg-yellow-500',
                    }}
                  />
                </div>
              )
            }}
          </form.Field>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className='space-y-0 pt-2 relative'>
          <div id='basic-info' className=''>
            <FormSection id='basic-info' position='top'>
              <Header label='Courier Information' />
              <div className='grid gap-6 w-full mt-4'>
                {renderFields(
                  form as CourierFormApi,
                  courierFields.filter((f) => f.name !== 'active'),
                )}
              </div>
            </FormSection>
          </div>

          <div id='accounts'>
            <FormSection id='accounts' position='bottom'>
              <Header label='Courier Accounts' />
              <form.Field name='accounts'>
                {(field) => {
                  const accounts = field.state.value ?? []

                  const handleAddAccount = () => {
                    field.handleChange([
                      ...accounts,
                      createEmptyCourierAccount(),
                    ])
                  }

                  const handleRemoveAccount = (index: number) => () => {
                    field.handleChange(accounts.filter((_, i) => i !== index))
                  }

                  const handleAccountChange =
                    (index: number, key: EditableCourierAccountField) =>
                    (nextValue: string) => {
                      field.handleChange(
                        accounts.map((account, i) =>
                          i === index
                            ? {...account, [key]: nextValue}
                            : account,
                        ),
                      )
                    }

                  return (
                    <div className='space-y-4 w-full mt-4'>
                      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                        <p className='text-sm text-dark-gray/70 dark:text-light-gray/80'>
                          Add courier account labels and values for dispatching
                          or fulfillment workflows.
                        </p>
                        <Button
                          size='sm'
                          type='button'
                          variant='flat'
                          className='bg-yellow-500 text-white font-medium'
                          onPress={handleAddAccount}>
                          <span className='inline-flex items-center gap-2'>
                            <Icon name='plus' className='size-4' />
                            Add Account
                          </span>
                        </Button>
                      </div>

                      {accounts.length === 0 ? (
                        <div className='rounded-lg border border-dashed border-light-gray/40 dark:border-black/30 px-4 py-3 text-sm text-dark-gray/70 dark:text-light-gray/70'>
                          No courier accounts added yet.
                        </div>
                      ) : (
                        <div className='space-y-3'>
                          {accounts.map((account, index) => (
                            <div
                              key={account.id ?? `account-${index}`}
                              className='rounded-xl border border-light-gray/40 dark:border-black/30 p-3 lg:p-4 bg-light-gray/5 dark:bg-black/20'>
                              <div className='grid gap-3 lg:grid-cols-[1fr_1fr_auto] items-end'>
                                <Input
                                  size='lg'
                                  label='Account Label'
                                  value={account.label}
                                  placeholder='e.g., Main Account'
                                  variant='bordered'
                                  classNames={commonInputClassNames}
                                  onBlur={field.handleBlur}
                                  onChange={(event) =>
                                    handleAccountChange(
                                      index,
                                      'label',
                                    )(event.target.value)
                                  }
                                />
                                <Input
                                  size='lg'
                                  label='Account Value'
                                  value={account.value}
                                  placeholder='e.g., account-001'
                                  variant='bordered'
                                  classNames={commonInputClassNames}
                                  onBlur={field.handleBlur}
                                  onChange={(event) =>
                                    handleAccountChange(
                                      index,
                                      'value',
                                    )(event.target.value)
                                  }
                                />
                                <Button
                                  size='sm'
                                  type='button'
                                  variant='flat'
                                  className='text-rose-500 bg-rose-500/10'
                                  onPress={handleRemoveAccount(index)}>
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }}
              </form.Field>
            </FormSection>
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
                  ? 'Update Courier'
                  : 'Create Courier'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
