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
import {renderFields} from '@/app/admin/_components/ui/fields'
import {useAppForm} from '@/app/admin/_components/ui/form-context'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Switch} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useMutation} from 'convex/react'
import {useCallback, useEffect, useRef, useState} from 'react'

type CourierFormProps = {
  courierId?: Id<'couriers'>
  initialValues?: CourierFormValues
  onCreated?: VoidFunction
  onUpdated?: VoidFunction
}

const SECTIONS = [
  {id: 'basic-info', label: 'Basic Info', icon: 'file'},
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
        const payload = {
          name: data.name.trim(),
          code: data.code.trim().toLowerCase(),
          active: data.active ?? true,
          trackingUrlTemplate: data.trackingUrlTemplate?.trim() || undefined,
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
          <h1 className='text-lg flex items-center space-x-2 tracking-tighter font-semibold py-4 text-dark-gray dark:text-foreground'>
            <div
              aria-hidden
              className='size-4 select-none aspect-square rounded-full bg-emerald-500'
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
                  ? 'dark:bg-zinc-700 dark:text-emerald-300 bg-dark-gray/5 text-emerald-500'
                  : 'text-dark-gray/60 dark:text-light-gray/80 dark:hover:text-emerald-100  hover:bg-dark-gray/5 hover:text-dark-gray/90',
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
            className='w-full rounded-xl font-medium tracking-tight bg-emerald-500 text-white'
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
            <p className='mt-2 text-sm text-center text-emerald-500'>
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
                    <span className='text-sm font-semibold tracking-tight text-dark-gray dark:text-foreground'>
                      Toggle Courier Status
                    </span>
                    <span className='text-xs text-dark-gray/80 dark:text-light-gray/80'>
                      {active ? 'Active and available' : 'Currently inactive'}
                    </span>
                  </div>
                  <Switch
                    isSelected={active}
                    onValueChange={(value) => field.handleChange(value)}
                    onBlur={field.handleBlur}
                    classNames={{
                      wrapper: 'group-data-[selected=true]:bg-emerald-500',
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
            <FormSection id='basic-info' position='bottom'>
              <Header label='Courier Information' />
              <div className='grid gap-6 w-full mt-4'>
                {renderFields(
                  form as CourierFormApi,
                  courierFields.filter((f) => f.name !== 'active'),
                )}
              </div>
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
