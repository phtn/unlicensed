'use client'

import {SelectOption} from '@/app/admin/_components/ui/fields'
import {useAppForm} from '@/app/admin/_components/ui/form-context'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button} from '@heroui/react'
import {useMemo, useTransition} from 'react'
import {toast} from 'react-hot-toast'
import type {
  EmailSettingsConvexArgs,
  EmailSettingsFormValues,
} from '../email-settings-form-schema'
import {
  emailSettingsFormSchema,
  toEmailSettingsConvexArgs,
} from '../email-settings-form-schema'

interface EmailTemplateEditorProps {
  initialValues: EmailSettingsFormValues
  submitLabel: string
  onCancel: VoidFunction
  onSubmit: (values: EmailSettingsConvexArgs) => Promise<void>
}

export const EmailTemplateEditor = ({
  initialValues,
  submitLabel,
  onCancel,
  onSubmit,
}: EmailTemplateEditorProps) => {
  const [isSaving, startSaving] = useTransition()

  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onChange: emailSettingsFormSchema,
    },
    onSubmit: async ({value}) => {
      const parsed = emailSettingsFormSchema.safeParse(value)
      if (!parsed.success) {
        toast.error('Please fix the form errors')
        return
      }

      const payload = toEmailSettingsConvexArgs(parsed.data)

      startSaving(() => {
        ;(async () => {
          try {
            await onSubmit(payload)
          } catch (error) {
            console.error(error)
            toast.error('Failed to save email setting')
          }
        })()
      })
    },
  })

  const typeOptions: SelectOption[] = useMemo(
    () => [
      {
        value: 'transactional',
        label: 'Transactional',
        icon: 'email',
        description: 'Password resets, onboarding, receipts',
      },
      {
        value: 'marketing',
        label: 'Marketing',
        icon: 'sparkle',
        description: 'Campaigns, newsletters, promos',
      },
    ],
    [],
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className='h-screen flex w-full overflow-auto'>
      <div className='p-6 space-y-10 flex-1 w-full'>
        <section>
          <SectionHeader title='Settings' />
          <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <form.AppField name='title'>
                {(fieldApi) => {
                  const errors = fieldApi.state.meta.errors
                  const error =
                    fieldApi.state.meta.isTouched && errors.length
                      ? errors.join(', ')
                      : undefined

                  return (
                    <fieldApi.TextField
                      {...fieldApi}
                      name='title'
                      label='Template Name'
                      defaultValue={fieldApi.state.value}
                      placeholder='Welcome Email, Password Reset...'
                      type='text'
                      required
                      error={error}
                      // onChange={(event) => {
                      //   fieldApi.handleChange(event.target.value)
                      // }}
                    />
                  )
                }}
              </form.AppField>
              <form.AppField name='group'>
                {(fieldApi) => {
                  const errors = fieldApi.state.meta.errors
                  const error =
                    fieldApi.state.meta.isTouched && errors.length
                      ? errors.join(', ')
                      : undefined

                  return (
                    <fieldApi.TextField
                      {...fieldApi}
                      name='group'
                      defaultValue={fieldApi.state.value}
                      label='Group'
                      placeholder='users, admins, marketing...'
                      type='text'
                      error={
                        typeof error === 'object'
                          ? JSON.stringify(error)
                          : error
                      }
                      // onChange={(event) => {
                      //   fieldApi.handleChange(event.target.value)
                      // }}
                    />
                  )
                }}
              </form.AppField>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <form.AppField name='intent'>
                {(fieldApi) => {
                  const errors = fieldApi.state.meta.errors
                  const error =
                    fieldApi.state.meta.isTouched && errors.length
                      ? errors.join(', ')
                      : undefined

                  return (
                    <fieldApi.TextField
                      {...fieldApi}
                      name='intent'
                      label='Intent'
                      defaultValue={fieldApi.state.value}
                      placeholder='onboarding, notification...'
                      type='text'
                      error={error}
                      // onChange={(event) => {
                      //   fieldApi.handleChange(event.target.value)
                      // }}
                    />
                  )
                }}
              </form.AppField>

              <form.AppField name='type'>
                {(fieldApi) => {
                  const errors = fieldApi.state.meta.errors
                  const error =
                    fieldApi.state.meta.isTouched && errors.length
                      ? errors.join(', ')
                      : undefined

                  return (
                    <fieldApi.SelectField
                      {...fieldApi}
                      name='type'
                      label='Type'
                      placeholder='Select type'
                      type='select'
                      options={typeOptions}
                      required
                      error={error}
                      defaultValue={initialValues.type}
                      // handleChange={(value: string) => {
                      //   fieldApi.handleChange(value)
                      // }}
                    />
                  )
                }}
              </form.AppField>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader title='Recipients' />

          <div className='space-y-4'>
            <form.AppField name='from'>
              {(fieldApi) => {
                const errors = fieldApi.state.meta.errors
                const error =
                  fieldApi.state.meta.isTouched && errors.length
                    ? errors.join(', ')
                    : undefined

                return (
                  <fieldApi.TextField
                    {...fieldApi}
                    name='from'
                    label='From Address'
                    defaultValue={fieldApi.state.value}
                    placeholder='support@protap.com'
                    type='email'
                    helperText='Comma-separated emails (or {{placeholders}})'
                    error={error}
                    // onChange={(event) => {
                    //   fieldApi.handleChange(event.target.value)
                    // }}
                  />
                )
              }}
            </form.AppField>

            <form.AppField name='to'>
              {(fieldApi) => {
                const errors = fieldApi.state.meta.errors
                const error =
                  fieldApi.state.meta.isTouched && errors.length
                    ? errors.join(', ')
                    : undefined

                return (
                  <fieldApi.TextField
                    {...fieldApi}
                    name='to'
                    label='To Recipients'
                    defaultValue={fieldApi.state.value}
                    placeholder='Comma-separated emails...'
                    type='email'
                    helperText='Comma-separated emails (or {{placeholders}})'
                    error={error}
                    // onChange={(event) => {
                    //   fieldApi.handleChange(event.target.value)
                    // }}
                  />
                )
              }}
            </form.AppField>

            <form.AppField name='cc'>
              {(fieldApi) => {
                const errors = fieldApi.state.meta.errors
                const error =
                  fieldApi.state.meta.isTouched && errors.length
                    ? errors.join(', ')
                    : undefined

                return (
                  <fieldApi.TextField
                    {...fieldApi}
                    name='cc'
                    label='CC'
                    defaultValue={fieldApi.state.value}
                    placeholder='Optional...'
                    type='text'
                    error={error}
                    // onChange={(event) => {
                    //   fieldApi.handleChange(event.target.value)
                    // }}
                  />
                )
              }}
            </form.AppField>

            <form.AppField name='bcc'>
              {(fieldApi) => {
                const errors = fieldApi.state.meta.errors
                const error =
                  fieldApi.state.meta.isTouched && errors.length
                    ? errors.join(', ')
                    : undefined

                return (
                  <fieldApi.TextField
                    {...fieldApi}
                    name='bcc'
                    label='BCC'
                    defaultValue={fieldApi.state.value}
                    placeholder='Optional...'
                    type='text'
                    error={error}
                    // onChange={(event) => {
                    //   fieldApi.handleChange(event.target.value)
                    // }}
                  />
                )
              }}
            </form.AppField>
            <form.AppField name='subject'>
              {(fieldApi) => {
                const errors = fieldApi.state.meta.errors
                const error =
                  fieldApi.state.meta.isTouched && errors.length
                    ? errors.join(', ')
                    : undefined

                return (
                  <fieldApi.TextField
                    {...fieldApi}
                    name='subject'
                    label='Subject Line'
                    defaultValue={fieldApi.state.value}
                    placeholder='Hi!'
                    type='text'
                    required
                    error={error}
                    // onChange={(event) => {
                    //   fieldApi.handleChange(event.target.value)
                    // }}
                  />
                )
              }}
            </form.AppField>
          </div>
        </section>
      </div>
      {/*RIGHT*/}
      <div className='px-6 pt-6 space-y-10 flex-1'>
        <section>
          <SectionHeader title='Content' />

          <div className='space-y-4'>
            <form.AppField name='text'>
              {(fieldApi) => {
                const errors = fieldApi.state.meta.errors
                const error =
                  fieldApi.state.meta.isTouched && errors.length
                    ? errors.join(', ')
                    : undefined

                return (
                  <fieldApi.TextAreaField
                    {...fieldApi}
                    name='text'
                    label='Plain Text'
                    defaultValue={fieldApi.state.value}
                    placeholder='Plain text fallback for email clients...'
                    type='textarea'
                    minRows={2}
                    error={error}
                    // onChange={(event) => {
                    //   fieldApi.handleChange(event.target.value)
                    // }}
                  />
                )
              }}
            </form.AppField>

            <form.AppField name='body'>
              {(fieldApi) => {
                const errors = fieldApi.state.meta.errors
                const error =
                  fieldApi.state.meta.isTouched && errors.length
                    ? errors.join(', ')
                    : undefined

                return (
                  <fieldApi.TextAreaField
                    {...fieldApi}
                    name='body'
                    label='Body Template'
                    defaultValue={fieldApi.state.value}
                    placeholder='Hello {{name}}, welcome to {{company}}...'
                    type='textarea'
                    minRows={5}
                    error={error}
                    // onChange={(event) => {
                    //   fieldApi.handleChange(event.target.value)
                    // }}
                  />
                )
              }}
            </form.AppField>

            <form.AppField name='html'>
              {(fieldApi) => {
                const errors = fieldApi.state.meta.errors
                const error =
                  fieldApi.state.meta.isTouched && errors.length
                    ? errors.join(', ')
                    : undefined

                return (
                  <fieldApi.TextAreaField
                    {...fieldApi}
                    name='html'
                    label='HTML Template'
                    defaultValue={fieldApi.state.value}
                    placeholder='<!DOCTYPE html><html>...</html>'
                    type='textarea'
                    minRows={8}
                    error={error}
                    // onChange={(event) => {
                    //   fieldApi.handleChange(event.target.value)
                    // }}
                  />
                )
              }}
            </form.AppField>
          </div>
        </section>
        <div className='flex items-center justify-between sticky bottom-0 px-6 py-4'>
          <form.AppField
            name='visible'
            validators={{
              onChange: emailSettingsFormSchema.shape.visible,
            }}>
            {(fieldApi) => {
              const errors = fieldApi.state.meta.errors
              const error =
                fieldApi.state.meta.isTouched && errors.length
                  ? errors.join(', ')
                  : undefined

              const fieldValue = fieldApi.state.value
              const checked =
                typeof fieldValue === 'boolean' ? fieldValue : false

              return (
                <fieldApi.SwitchField
                  {...fieldApi}
                  name='visible'
                  label='Toggle Active Status'
                  placeholder='Active status'
                  defaultValue={checked}
                  type='checkbox'
                  required
                  error={error}
                  // on={(next) => fieldApi.handleChange(next)}
                />
              )
            }}
          </form.AppField>
          <div className='flex items-center justify-end gap-3'>
            <Button
              variant='ghost'
              onPress={onCancel}
              className='text-zinc-400 hover:text-white hover:bg-zinc-800'>
              Cancel
            </Button>

            <Button
              type='submit'
              disabled={isSaving}
              className={cn(
                'gap-2 text-white border-0 shadow-lg transition-all duration-200',
                'bg-linear-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 shadow-cyan-500/25 hover:shadow-cyan-500/40',
              )}>
              {isSaving ? 'Saving…' : submitLabel}
              <Icon
                name={isSaving ? 'spinners-ring' : 'check'}
                className='size-3'
              />
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
