'use client'

import {
  commonSelectClassNames,
  SelectOption,
} from '@/app/admin/_components/ui/fields'
import {useAppForm} from '@/app/admin/_components/ui/form-context'
import {JunctionBox} from '@/app/admin/_components/ui/junction-box'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {
  EMAIL_TEMPLATE_OPTIONS,
  type EmailTemplateId,
} from '@/lib/resend/templates/registry'
import {getInvitationDefaultProps} from '@/lib/resend/templates/render-with-props'
import {cn} from '@/lib/utils'
import {ListboxItem as ListBoxItem} from '@heroui/listbox'
import {Button} from '@heroui/react'
import {Select} from '@heroui/select'
import type {SharedSelection} from '@heroui/system'
import {useQuery} from 'convex/react'
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
const COUPON_TEMPLATE_PROP_KEYS: Partial<
  Record<EmailTemplateId, 'couponCode' | 'discountCode'>
> = {
  welcome: 'couponCode',
  'first-order': 'discountCode',
  'product-discount': 'discountCode',
}

const parseTemplateProps = (
  value: string | undefined,
): Record<string, unknown> => {
  if (!value?.trim()) {
    return {}
  }

  try {
    const parsed = JSON.parse(value) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    return parsed as Record<string, unknown>
  } catch {
    return {}
  }
}

const stringifyTemplateProps = (value: Record<string, unknown>): string => {
  const next = Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (entry === undefined || entry === null) {
        return false
      }
      if (typeof entry === 'string') {
        return entry.trim().length > 0
      }
      return true
    }),
  )

  return Object.keys(next).length > 0 ? JSON.stringify(next, null, 2) : ''
}

const getCouponPropKey = (templateKey: string) =>
  COUPON_TEMPLATE_PROP_KEYS[templateKey as EmailTemplateId] ?? null

const getSingleSelectedKey = (keys: SharedSelection): React.Key | null => {
  if (keys === 'all') {
    return null
  }

  const key = Array.from(keys)[0]
  return key ?? null
}

const editorPaneClassName =
  'w-full min-w-0 px-4 py-5 sm:px-6 sm:py-6 xl:px-8 xl:py-8'

const stripCouponAttachmentProps = (value: string | undefined): string => {
  const next = parseTemplateProps(value)
  delete next.couponId
  delete next.couponCode
  delete next.discountCode
  return stringifyTemplateProps(next)
}

const getCouponAttachmentState = (
  templateKey: string,
  value: string | undefined,
) => {
  const couponPropKey = getCouponPropKey(templateKey)
  const templateProps = parseTemplateProps(value)
  const couponId =
    typeof templateProps.couponId === 'string' ? templateProps.couponId : ''
  const couponCode =
    couponPropKey && typeof templateProps[couponPropKey] === 'string'
      ? String(templateProps[couponPropKey])
      : ''

  return {
    enabled: Boolean(couponId || couponCode),
    couponId,
    couponCode,
  }
}

const applyCouponAttachmentProps = (
  templateKey: string,
  value: string | undefined,
  coupon: Pick<Doc<'coupons'>, '_id' | 'code'>,
): string => {
  const couponPropKey = getCouponPropKey(templateKey)
  if (!couponPropKey) {
    return stripCouponAttachmentProps(value)
  }

  const next = parseTemplateProps(value)
  delete next.couponCode
  delete next.discountCode

  next.couponId = String(coupon._id)
  next[couponPropKey] = coupon.code

  return stringifyTemplateProps(next)
}

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
  const [couponSnapshotNow] = useState(() => Date.now())
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
      {id: TEMPLATE_NONE, label: 'No template'},
      ...EMAIL_TEMPLATE_OPTIONS,
    ],
    [],
  )

  const coupons = useQuery(api.coupons.q.listCoupons)

  const initialCouponAttachment = useMemo(
    () =>
      getCouponAttachmentState(
        initialValues.template ?? TEMPLATE_NONE,
        initialValues.templateProps,
      ),
    [initialValues.template, initialValues.templateProps],
  )

  const [couponAttachmentEnabled, setCouponAttachmentEnabled] =
    useState<boolean>(() => initialCouponAttachment.enabled)
  const [selectedCouponId, setSelectedCouponId] = useState<string>(
    () => initialCouponAttachment.couponId,
  )

  const activeCoupons = useMemo(() => {
    return (coupons ?? []).filter((coupon) => {
      if (!coupon.enabled) {
        return false
      }
      if (
        coupon.startsAt !== undefined &&
        coupon.startsAt > couponSnapshotNow
      ) {
        return false
      }
      if (
        coupon.expiresAt !== undefined &&
        coupon.expiresAt <= couponSnapshotNow
      ) {
        return false
      }
      return true
    })
  }, [couponSnapshotNow, coupons])

  const couponSelectOptions = useMemo(
    () =>
      activeCoupons.map((coupon) => ({
        id: String(coupon._id),
        label:
          coupon.name && coupon.name !== coupon.code
            ? `${coupon.code} · ${coupon.name}`
            : coupon.code,
      })),
    [activeCoupons],
  )

  const templateCouponPropKey = useMemo(
    () => getCouponPropKey(selectedTemplateKey),
    [selectedTemplateKey],
  )

  const selectedCoupon = useMemo(() => {
    if (selectedCouponId) {
      return (
        activeCoupons.find(
          (coupon) => String(coupon._id) === selectedCouponId,
        ) ?? null
      )
    }

    if (!initialCouponAttachment.couponCode) {
      return null
    }

    return (
      activeCoupons.find(
        (coupon) => coupon.code === initialCouponAttachment.couponCode,
      ) ?? null
    )
  }, [activeCoupons, initialCouponAttachment.couponCode, selectedCouponId])
  const resolvedSelectedCouponId =
    selectedCouponId || (selectedCoupon ? String(selectedCoupon._id) : '')

  const loadTemplatePreview = useCallback(
    (
      templateId: string,
      templateProps?: string,
      notifySuccess: boolean = false,
    ) => {
      if (!templateId) {
        return
      }

      startLoadingTemplate(() => {
        ;(async () => {
          try {
            const params = new URLSearchParams({live: '1'})
            if (templateProps?.trim()) {
              params.set('templateProps', templateProps)
            }

            const res = await fetch(
              `/api/resend/templates/${encodeURIComponent(templateId)}?${params.toString()}`,
            )
            if (!res.ok) {
              const data = (await res.json()) as {error?: string}
              toast.error(data?.error ?? 'Failed to load template')
              return
            }

            const data = (await res.json()) as {html: string; subject: string}
            form.setFieldValue('subject', data.subject)
            form.setFieldValue('html', data.html)

            if (notifySuccess) {
              toast.success('Template applied')
            }
          } catch {
            toast.error('Failed to load template')
          }
        })()
      })
    },
    [form],
  )

  const handleTemplateSelect = useCallback(
    (key: React.Key | null) => {
      const id = key === null || key === TEMPLATE_NONE ? '' : String(key)
      setSelectedTemplateKey(id)
      form.setFieldValue('template', id)
      const couponPropKey = getCouponPropKey(id)

      let nextTemplateProps = ''

      if (id === 'invitation') {
        nextTemplateProps = JSON.stringify(getInvitationDefaultProps(), null, 2)
      } else if (couponPropKey && couponAttachmentEnabled) {
        const coupon = selectedCoupon ?? activeCoupons[0] ?? null
        if (coupon) {
          setSelectedCouponId(String(coupon._id))
          nextTemplateProps = applyCouponAttachmentProps(id, '', coupon)
        } else {
          setCouponAttachmentEnabled(false)
          toast.error('No active coupons available')
        }
      }

      form.setFieldValue('templateProps', nextTemplateProps)

      if (!id) {
        return
      }

      loadTemplatePreview(id, nextTemplateProps, true)
    },
    [
      activeCoupons,
      couponAttachmentEnabled,
      form,
      loadTemplatePreview,
      selectedCoupon,
    ],
  )

  const handleCouponAttachmentToggle = useCallback(
    (nextEnabled: boolean) => {
      if (!selectedTemplateKey || !templateCouponPropKey) {
        return
      }

      if (nextEnabled) {
        const coupon = selectedCoupon ?? activeCoupons[0] ?? null
        if (!coupon) {
          toast.error('No active coupons available')
          return
        }

        const nextTemplateProps = applyCouponAttachmentProps(
          selectedTemplateKey,
          form.getFieldValue('templateProps') as string | undefined,
          coupon,
        )

        setCouponAttachmentEnabled(true)
        setSelectedCouponId(String(coupon._id))
        form.setFieldValue('templateProps', nextTemplateProps)
        loadTemplatePreview(selectedTemplateKey, nextTemplateProps)
        return
      }

      const nextTemplateProps = stripCouponAttachmentProps(
        form.getFieldValue('templateProps') as string | undefined,
      )

      setCouponAttachmentEnabled(false)
      form.setFieldValue('templateProps', nextTemplateProps)
      loadTemplatePreview(selectedTemplateKey, nextTemplateProps)
    },
    [
      activeCoupons,
      form,
      loadTemplatePreview,
      selectedCoupon,
      selectedTemplateKey,
      templateCouponPropKey,
    ],
  )

  const handleCouponSelect = useCallback(
    (key: React.Key | null) => {
      const nextId = key === null ? '' : String(key)
      setSelectedCouponId(nextId)

      if (!nextId || !selectedTemplateKey || !templateCouponPropKey) {
        return
      }

      const coupon =
        activeCoupons.find((entry) => String(entry._id) === nextId) ?? null
      if (!coupon) {
        return
      }

      const nextTemplateProps = applyCouponAttachmentProps(
        selectedTemplateKey,
        form.getFieldValue('templateProps') as string | undefined,
        coupon,
      )

      form.setFieldValue('templateProps', nextTemplateProps)
      loadTemplatePreview(selectedTemplateKey, nextTemplateProps)
    },
    [
      activeCoupons,
      form,
      loadTemplatePreview,
      selectedTemplateKey,
      templateCouponPropKey,
    ],
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className='flex min-h-0 flex-1 w-full flex-col overflow-hidden'>
      <div className='shrink-0 bg-background/95 px-4 supports-backdrop-filter:bg-background/80 sm:px-6'>
        <div className='mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-3'>
          <Button
            type='button'
            variant='tertiary'
            onPress={onCancel}
            className='gap-2 -ml-2 dark:bg-transparent'>
            <Icon name='chevron-left' className='size-4' />
            Back
          </Button>
        </div>
      </div>
      <div
        className='flex-1 overflow-y-auto overscroll-y-contain'
        style={{WebkitOverflowScrolling: 'touch'}}>
        <div className='grid w-full min-w-0 grid-cols-1 xl:grid-cols-2 xl:items-start xl:divide-x xl:divide-foreground/10'>
          <div className={cn(editorPaneClassName, 'space-y-8 sm:space-y-10')}>
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
          <div
            className={cn(
              editorPaneClassName,
              'space-y-8 border-t border-foreground/10 sm:space-y-10 xl:border-t-0',
            )}>
            <section>
              <SectionHeader title='Content' />

              <div className='pt-2 space-y-4'>
                <Select
                  label='Template'
                  placeholder='Choose a template (optional)'
                  variant='faded'
                  selectedKeys={
                    selectedTemplateKey ? [selectedTemplateKey] : []
                  }
                  onSelectionChange={(keys) => {
                    handleTemplateSelect(getSingleSelectedKey(keys))
                  }}
                  isDisabled={isLoadingTemplate}
                  classNames={commonSelectClassNames}>
                  {templateSelectOptions.map((item) => (
                    <ListBoxItem key={item.id} textValue={item.label}>
                      {item.label}
                    </ListBoxItem>
                  ))}
                </Select>

                {templateCouponPropKey && (
                  <div className='space-y-4'>
                    <JunctionBox
                      title='Attach Coupon'
                      checked={couponAttachmentEnabled}
                      onUpdate={handleCouponAttachmentToggle}
                      description='Attach an active coupon from the coupons table and use its code in this template render.'
                    />

                    <Select
                      label='Coupon'
                      placeholder={
                        activeCoupons.length > 0
                          ? 'Choose a coupon'
                          : 'No active coupons available'
                      }
                      variant='faded'
                      selectedKeys={
                        resolvedSelectedCouponId
                          ? [resolvedSelectedCouponId]
                          : []
                      }
                      onSelectionChange={(keys) => {
                        handleCouponSelect(getSingleSelectedKey(keys))
                      }}
                      isDisabled={
                        !couponAttachmentEnabled ||
                        isLoadingTemplate ||
                        activeCoupons.length === 0
                      }
                      classNames={commonSelectClassNames}>
                      {couponSelectOptions.map((item) => (
                        <ListBoxItem key={item.id} textValue={item.label}>
                          {item.label}
                        </ListBoxItem>
                      ))}
                    </Select>
                  </div>
                )}

                {selectedTemplateKey === 'invitation' && (
                  <form.AppField name='templateProps'>
                    {(fieldApi) => (
                      <fieldApi.TextAreaField
                        {...fieldApi}
                        name='templateProps'
                        label='Invitation template props (JSON)'
                        defaultValue={fieldApi.state.value}
                        placeholder='{"title": "You are invited.", "message": "..."}'
                        type='textarea'
                        minRows={6}
                        error={(() => {
                          try {
                            if (fieldApi.state.value) {
                              JSON.parse(fieldApi.state.value)
                            }
                            return undefined
                          } catch {
                            return 'Invalid JSON'
                          }
                        })()}
                      />
                    )}
                  </form.AppField>
                )}

                {/*<form.AppField name='text'>
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
            </form.AppField>*/}

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
                        minRows={4}
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
                        minRows={6}
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
        </div>
      </div>
      <div className='shrink-0 border-t border-foreground/10 bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6 md:px-10 sm:py-4'>
        <div className='mx-auto flex w-full max-w-screen-2xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
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
                  description='Control whether this template can be used.'
                  // on={(next) => fieldApi.handleChange(next)}
                />
              )
            }}
          </form.AppField>
          <div className='flex w-full flex-col gap-2 sm:flex-row sm:justify-end lg:w-auto lg:items-center lg:gap-3'>
            <Button
              type='button'
              variant='tertiary'
              onPress={onCancel}
              className='w-full hover:bg-sidebar border-background sm:w-auto'>
              Cancel
            </Button>

            <Button
              type='submit'
              isDisabled={isSaving}
              className={cn(
                'w-full gap-2 text-white border-0 shadow-lg sm:w-auto',
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
