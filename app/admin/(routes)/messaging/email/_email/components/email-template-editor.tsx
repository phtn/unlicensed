'use client'

import {SelectOption} from '@/app/admin/_components/ui/fields'
import {useAppForm} from '@/app/admin/_components/ui/form-context'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {Icon} from '@/lib/icons'
import {EMAIL_TEMPLATE_OPTIONS} from '@/lib/resend/templates/registry'
import {cn} from '@/lib/utils'
import {Button, Select, SelectItem} from '@heroui/react'
import {useCallback, useMemo, useState, useTransition} from 'react'
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

const TEMPLATE_NONE = ''

export const EmailTemplateEditor = ({
  initialValues,
  submitLabel,
  onCancel,
  onSubmit,
}: EmailTemplateEditorProps) => {
  const [isSaving, startSaving] = useTransition()
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(
    () => initialValues.template ?? TEMPLATE_NONE,
  )
  const [isLoadingTemplate, startLoadingTemplate] = useTransition()

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

  const templateSelectOptions = useMemo(
    () => [
      { id: TEMPLATE_NONE, label: 'No template' },
      ...EMAIL_TEMPLATE_OPTIONS,
    ],
    [],
  )

  const handleTemplateSelect = useCallback(
    (key: React.Key | null) => {
      const id = key === null || key === TEMPLATE_NONE ? '' : String(key)
      setSelectedTemplateKey(id)
      form.setFieldValue('template', id)
      if (!id) return

      startLoadingTemplate(() => {
        ;(async () => {
          try {
            const res = await fetch(
              `/api/resend/templates/${encodeURIComponent(id)}`,
            )
            if (!res.ok) {
              const data = (await res.json()) as {error?: string}
              toast.error(data?.error ?? 'Failed to load template')
              return
            }
            const data = (await res.json()) as {html: string; subject: string}
            form.setFieldValue('subject', data.subject)
            form.setFieldValue('html', data.html)
            toast.success('Template applied')
          } catch {
            toast.error('Failed to load template')
          }
        })()
      })
    },
    [form],
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
          <div className='space-y-4 pt-2'>
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

          <div className='space-y-4 pt-2'>
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

          <div className='space-y-4 pt-2'>
            <Select
              label='Start from template'
              placeholder='Choose a template (optional)'
              variant='bordered'
              selectedKeys={selectedTemplateKey ? [selectedTemplateKey] : []}
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] ?? null
                handleTemplateSelect(key)
              }}
              isDisabled={isLoadingTemplate}
              classNames={{
                trigger:
                  'border border-light-gray/50 dark:border-black/20 bg-light-gray/10 dark:bg-black/60 rounded-lg min-h-10',
              }}
              items={templateSelectOptions}>
              {(item) => (
                <SelectItem key={item.id} textValue={item.label}>
                  {item.label}
                </SelectItem>
              )}
            </Select>

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
        <div className='flex items-center justify-between sticky bottom-0 px-4'>
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
              variant='light'
              onPress={onCancel}
              className='hover:bg-sidebar border-background'>
              Cancel
            </Button>

            <Button
              type='submit'
              disabled={isSaving}
              className={cn(
                'gap-2 text-white border-0 shadow-lg',
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
