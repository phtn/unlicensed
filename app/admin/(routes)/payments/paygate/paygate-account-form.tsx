'use client'

import {useAppForm} from '@/app/admin/_components/ui/form-context'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {Callout} from '@/components/ui/callout'
import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {usePaste} from '@/hooks/use-paste'
import {usePaygate} from '@/hooks/use-paygate'
import {usePolygonAddressValidation} from '@/hooks/use-polygon-address-validation'
import {Icon} from '@/lib/icons'
import type {ApiResponse} from '@/lib/paygate/types'
import {cn} from '@/lib/utils'
import {Button, Card, CardBody} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useAction, useMutation} from 'convex/react'
import {FunctionReference} from 'convex/server'
import {parseAsString, useQueryState} from 'nuqs'
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {z} from 'zod'
import {CreateWalletResponse} from './create-wallet-response'
import {CreateWalletResponseData} from './types'

const paygateAccountSchema = z.object({
  hexAddress: z
    .string()
    .min(1, 'Wallet address is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address (0x...)'),

  addressIn: z.string(),
  label: z.string().optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  enabled: z.boolean().optional(),
  callbackUrl: z.url().optional(),
})

type PaygateAccountFormValues = z.infer<typeof paygateAccountSchema>

const DEFAULT_CALLBACK_URL = 'https://rapidfirenow.com/api/paygate/webhook'

const getDefaultValues = (): PaygateAccountFormValues => ({
  hexAddress: '',
  addressIn: '',
  // Use consistent default to avoid hydration mismatch
  // Will be updated on client side if needed
  callbackUrl: DEFAULT_CALLBACK_URL,
  label: '',
  description: '',
  isDefault: false,
  enabled: true,
})

type PaygateAccountFormProps = {
  accountId?: Doc<'paygateAccounts'>['_id']
  initialValues?: PaygateAccountFormValues
  onCreated?: VoidFunction
  onUpdated?: VoidFunction
  onCancel?: VoidFunction
}

export const PaygateAccountForm = ({
  accountId,
  initialValues,
  onCreated,
  onUpdated,
  onCancel,
}: PaygateAccountFormProps) => {
  const isEditMode = !!accountId
  const createAccount = useMutation(api.paygateAccounts.m.createAccount)
  const updateAccount = useMutation(api.paygateAccounts.m.updateAccount)
  const syncAccount = useAction(
    api.paygateAccounts.a
      .syncAccountFromPayGate as unknown as FunctionReference<'action'>,
  )
  const {createWallet, loading: isSubmitting} = usePaygate()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [walletResponse, setWalletResponse] = useState<ApiResponse | null>(null)
  const {paste, pasted} = usePaste()

  // Sync callback URL with URL search params
  const [callbackUrlParam] = useQueryState(
    'callbackUrl',
    parseAsString.withDefault(DEFAULT_CALLBACK_URL),
  )

  // Track if we're updating URL param from form to avoid loops
  const isUpdatingFromForm = useRef(false)

  const formValues = initialValues ?? getDefaultValues()

  const form = useAppForm({
    defaultValues: formValues,
    onSubmit: async ({value}) => {
      setStatus('idle')
      setErrorMessage(null)
      setWalletResponse(null)
      try {
        const parsed = paygateAccountSchema.safeParse(value)
        if (!parsed.success) {
          const message =
            parsed.error.issues[0]?.message ??
            'Please review the form for validation errors.'
          setErrorMessage(message)
          setStatus('error')
          return
        }

        const data = parsed.data

        if (isEditMode && accountId) {
          await updateAccount({
            id: accountId,
            label: data.label,
            callbackUrl: data.callbackUrl,
            description: data.description,
            isDefault: data.isDefault,
            enabled: data.enabled,
          })
          setStatus('success')
          onUpdated?.()
        } else {
          // Create wallet in PayGate first
          // Use callbackUrl from form (which is synced with URL param)
          const callbackUrl = data.callbackUrl || callbackUrlParam
          const paygateResponse = await createWallet(
            data.hexAddress,
            callbackUrl,
          )

          // Store the response to display it
          setWalletResponse(paygateResponse)

          if (!paygateResponse.success) {
            const errorMsg =
              typeof paygateResponse.error === 'string'
                ? paygateResponse.error
                : 'Failed to create wallet in PayGate. Please check the wallet address and try again.'
            setErrorMessage(errorMsg)
            setStatus('error')
            return
          }

          const responseData = paygateResponse.data as CreateWalletResponseData

          // If PayGate API call succeeded, save to Convex
          await createAccount({
            hexAddress: data.hexAddress,
            addressIn: responseData.address_in,
            polygonAddressIn: responseData.polygon_address_in,
            callbackUrl: responseData.callback_url,
            ipnToken: responseData.ipn_token,
            label: data.label,
            description: data.description,
            isDefault: data.isDefault,
            enabled: data.enabled,
          })
          form.reset()
          setStatus('success')
          onCreated?.()
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : isEditMode
              ? 'Failed to update account.'
              : 'Failed to create account.'
        setErrorMessage(message)
        setStatus('error')
      }
    },
  })

  const handleSync = useCallback(async () => {
    if (!accountId) return

    setIsSyncing(true)
    try {
      const result = await syncAccount({accountId})
      if (result.success) {
        setStatus('success')
      } else {
        setErrorMessage(result.error || 'Failed to sync account data')
        setStatus('error')
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to sync account data',
      )
      setStatus('error')
    } finally {
      setIsSyncing(false)
    }
  }, [accountId, syncAccount])

  const handlePasteAddress = useCallback(async () => {
    try {
      const pastedText = await paste()
      if (pastedText) {
        form.setFieldValue('hexAddress', pastedText.trim())
      }
    } catch (error) {
      console.error('Failed to paste address:', error)
    }
  }, [paste, form])

  // Watch hexAddress field value changes
  const hexAddressValue = useStore(
    form.store,
    (state) => state.values.hexAddress,
  )

  // Validate Polygon wallet address
  const addressValidation = usePolygonAddressValidation(hexAddressValue, {
    autoValidate: true,
  })

  // Log validation results
  const walletAddressStatus = useMemo(() => {
    if (hexAddressValue && addressValidation.isValidating) {
      // console.log('[POLYGON] Validating address:', hexAddressValue)
      return 'Validating...'
    }
    if (addressValidation.isValid) {
      // console.log('[POLYGON] Address is valid:', hexAddressValue)
      return 'VALIDATED'
    }
    if (addressValidation.error) {
      // console.error('[POLYGON] Validation error:', addressValidation.error)
      return 'Polygon wallet address is invalid'
    }
    return 'WARNING: Only use USDC in Polygon Network.'
  }, [hexAddressValue, addressValidation])

  // Initialize form field from URL param on mount
  useEffect(() => {
    if (!isEditMode) {
      const currentFormValue = form.getFieldValue('callbackUrl')
      // Initialize from URL param if form is empty or using default
      if (!currentFormValue || currentFormValue === DEFAULT_CALLBACK_URL) {
        form.setFieldValue('callbackUrl', callbackUrlParam)
      }
    }
  }, [callbackUrlParam, isEditMode, form]) // Only run on mount

  // Sync URL param changes back to form (e.g., browser back/forward)
  useEffect(() => {
    if (!isEditMode && !isUpdatingFromForm.current) {
      const currentFormValue = form.getFieldValue('callbackUrl')
      if (callbackUrlParam && currentFormValue !== callbackUrlParam) {
        form.setFieldValue('callbackUrl', callbackUrlParam)
      }
    }
  }, [callbackUrlParam, form, isEditMode])

  // Clear wallet response when switching modes or when form is reset
  useEffect(() => {
    if (isEditMode) {
      setWalletResponse(null)
    }
  }, [isEditMode])

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      form.handleSubmit()
    },
    [form],
  )

  return (
    <Card
      shadow='none'
      radius='none'
      className='md:rounded-lg dark:bg-dark-table/40 w-full sm:py-4'>
      <CardBody className='px-3 sm:px-4 md:px-6 h-[calc(100svh-120px)] sm:h-[calc(100lvh-100px)] overflow-y-auto overflow-x-hidden'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8'>
          <div>
            <div className='mb-3 sm:mb-4 space-y-3 sm:space-y-5'>
              <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-0 sm:pt-4'>
                <SectionHeader
                  title={isEditMode ? 'Edit Wallet' : 'Create Wallet'}>
                  <a
                    href={
                      hexAddressValue
                        ? `https://polygonscan.com/address/${hexAddressValue}`
                        : 'https://polygonscan.com/'
                    }
                    rel='noopener noreferrer'
                    className='text-purple-600 dark:text-purple-100 flex items-center gap-1 hover:underline hover:underline-offset-4 decoration-dotted bg-white dark:bg-white/5 ps-2 pe-1 py-1 sm:py-0.5 rounded-full text-xs sm:text-sm'
                    target='_blank'>
                    <span className='wrap-break-words'>polygon scan</span>
                    {addressValidation.isValid && (
                      <Icon
                        name='arrow-up'
                        className={cn(
                          'size-3 sm:size-4 translate-y-[0.35px] rotate-25 shrink-0',
                          addressValidation.isValid ? 'dark:text-white' : '',
                        )}
                      />
                    )}
                  </a>
                </SectionHeader>
                {(errorMessage || status === 'success') && (
                  <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 font-mono text-xs uppercase tracking-widest'>
                    {errorMessage && (
                      <div className='rounded-full bg-danger/9 border border-danger/20 text-danger px-2 sm:px-3 py-1 text-center sm:text-left wrap-break-words'>
                        {errorMessage}
                      </div>
                    )}

                    {status === 'success' && (
                      <div
                        className={
                          cn(
                            `inline-block px-2 sm:px-3 py-1 rounded-full text-center sm:text-left`,
                            'bg-green-100 dark:bg-emerald-700 text-green-800 dark:text-white',
                          )
                          // : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }>
                        {isEditMode ? 'Update Success' : 'Account Created'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Callout
                type={
                  addressValidation.isValid || walletResponse
                    ? 'custom'
                    : 'warning'
                }
                customStyle={
                  addressValidation.isValid
                    ? 'bg-[#7242DB] border-[#7242DB]'
                    : ''
                }
                icon='polygon'
                title='Polygon USDC Wallet Address'
                description={
                  <div className='flex flex-wrap items-center gap-1.5 sm:gap-2'>
                    <span className='wrap-break-words'>
                      {walletAddressStatus}
                    </span>
                    {addressValidation.isValidating && (
                      <Icon name='spinner-dots' className='size-4 shrink-0' />
                    )}
                    {addressValidation.isValid && (
                      <Icon name='check' className='size-4 shrink-0' />
                    )}
                  </div>
                }></Callout>
            </div>
            <form
              onSubmit={onSubmit}
              className='space-y-4 sm:space-y-6 md:space-y-8 w-full'>
              <div className='relative'>
                <form.AppField name='hexAddress'>
                  {(input) => (
                    <input.TextField
                      type='text'
                      label='Wallet Address (USDC Polygon)'
                      placeholder='0x611F3143b76a994214d751d762b52D081d8DC4de'
                      required
                    />
                  )}
                </form.AppField>
                <div className='absolute right-2 sm:right-3 top-2 sm:top-3'>
                  <button
                    type='button'
                    onClick={handlePasteAddress}
                    className='cursor-pointer p-1.5 sm:p-1 touch-manipulation'
                    aria-label='Paste wallet address'>
                    <Icon
                      id='paste-wallet-address'
                      name={
                        addressValidation.isValidating
                          ? 'spinners-ring'
                          : pasted
                            ? 'check-fill'
                            : 'clipboard'
                      }
                      className='size-4 sm:size-5 active:scale-90 opacity-80 hover:opacity-100 will-change-transform transition-transform duration-200'
                    />
                  </button>
                </div>
              </div>

              <form.AppField name='callbackUrl'>
                {(input) => (
                  <input.TextField
                    type='text'
                    label='Callback URL'
                    placeholder={DEFAULT_CALLBACK_URL}
                    value={DEFAULT_CALLBACK_URL}
                    disabled={true}
                    required
                    // onChange={(e) => {
                    //   input.onChange(e)
                    //   // Sync to URL param when field changes
                    //   if (!isEditMode) {
                    //     isUpdatingFromForm.current = true
                    //     setCallbackUrlParam(e.target.value)
                    //     // Reset flag after a brief delay to allow URL update to complete
                    //     setTimeout(() => {
                    //       isUpdatingFromForm.current = false
                    //     }, 0)
                    //   }
                    // }}
                  />
                )}
              </form.AppField>

              <div className='text-xs sm:text-sm font-medium pt-2'>
                Internal use fields
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                <form.AppField name='label'>
                  {(input) => (
                    <input.TextField
                      type='text'
                      label='Label (Optional)'
                      placeholder='e.g., Main Account'
                    />
                  )}
                </form.AppField>

                <form.AppField name='description'>
                  {(input) => (
                    <input.TextField
                      type='text'
                      label='Description (Optional)'
                      placeholder='Account notes'
                    />
                  )}
                </form.AppField>
              </div>

              <div className='py-4 sm:py-6'>
                <div className='flex flex-col sm:flex-row sm:justify-start gap-3 sm:gap-4 md:gap-6'>
                  <form.AppField name='isDefault'>
                    {(input) => (
                      <input.SwitchField
                        type='checkbox'
                        label='set as default'
                      />
                    )}
                  </form.AppField>

                  <form.AppField name='enabled'>
                    {(input) => (
                      <input.SwitchField
                        type='checkbox'
                        label='enable for payment'
                      />
                    )}
                  </form.AppField>
                </div>

                <div className='flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-start gap-2 sm:gap-3 py-4 sm:py-6 md:py-8'>
                  {isEditMode && accountId && (
                    <Button
                      type='button'
                      variant='bordered'
                      size='lg'
                      onPress={handleSync}
                      isLoading={isSyncing}
                      className='w-full sm:w-auto touch-manipulation'>
                      Sync from PayGate
                    </Button>
                  )}

                  {onCancel && (
                    <Button
                      type='button'
                      variant='flat'
                      size='lg'
                      onPress={onCancel}
                      className='w-full sm:w-auto touch-manipulation'>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type='submit'
                    color='primary'
                    className='w-full sm:w-auto sm:min-w-32 font-polysans font-light disabled:cursor-not-allowed disabled:bg-sidebar/40 disabled:opacity-80 disabled:text-foreground/40 touch-manipulation'
                    size='lg'
                    endContent={
                      <Icon
                        name={
                          addressValidation.isValidating || isSubmitting
                            ? 'spinners-ring'
                            : addressValidation.isValid
                              ? 'chevron-right'
                              : 'x'
                        }
                      />
                    }
                    disabled={
                      useStore(form.store, (state) => state.isSubmitting) ||
                      !addressValidation.isValid ||
                      addressValidation.isValidating
                    }>
                    {isEditMode ? 'Update Account' : 'Create PayGate Account'}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          <CreateWalletResponse response={walletResponse} />
        </div>
      </CardBody>
    </Card>
  )
}
