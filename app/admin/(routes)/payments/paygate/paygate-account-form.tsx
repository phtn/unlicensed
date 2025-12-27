'use client'

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
import {FormEvent, useCallback, useEffect, useMemo, useState} from 'react'
import {z} from 'zod'
import {useAppForm} from '../../../_components/ui/form-context'
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

const getDefaultValues = (): PaygateAccountFormValues => ({
  hexAddress: '',
  addressIn: '',
  // Use consistent default to avoid hydration mismatch
  // Will be updated on client side if needed
  callbackUrl:
    process.env.NEXT_PUBLIC_PAYGATE_CALLBACK_URL ??
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/paygate/webhook`
      : ''),
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
          const callbackUrl =
            typeof window !== 'undefined'
              ? `${window.location.origin}/api/paygate/webhook`
              : `${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}/api/paygate/webhook`
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
      return 'VALID Polygon wallet address'
    }
    if (addressValidation.error) {
      // console.error('[POLYGON] Validation error:', addressValidation.error)
      return 'Polygon wallet address is invalid'
    }
    return 'WARNING: Only use USDC wallet address in Polygon Network.'
  }, [hexAddressValue, addressValidation])

  // Update callbackUrl on client side after hydration to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined' && !isEditMode) {
      const currentCallbackUrl = form.getFieldValue('callbackUrl')
      // Only update if the field is empty or using the default env var value
      if (
        !currentCallbackUrl ||
        currentCallbackUrl ===
          (process.env.NEXT_PUBLIC_PAYGATE_CALLBACK_URL ??
            (process.env.NEXT_PUBLIC_APP_URL
              ? `${process.env.NEXT_PUBLIC_APP_URL}/api/paygate/webhook`
              : ''))
      ) {
        const clientCallbackUrl = `${window.location.origin}/api/paygate/webhook`
        form.setFieldValue('callbackUrl', clientCallbackUrl)
      }
    }
  }, [form, isEditMode])

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
      className='md:rounded-lg dark:bg-dark-table/40 w-full py-4'>
      <CardBody className='px-4 md:px-6 h-[calc(100lvh-100px)] overflow-scroll'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8'>
          <div>
            <div className='mb-4 space-y-5'>
              <div className='flex items-center space-x-4 pt-4'>
                <h2 className='text-2xl font-polysans font-semibold'>
                  {isEditMode ? 'Edit Wallet' : 'Create Wallet'}
                </h2>
                {(errorMessage || status === 'success') && (
                  <div className='space-y-3 font-mono text-xs uppercase tracking-widest'>
                    {errorMessage && (
                      <div className='rounded-full bg-danger/9 border border-danger/20 text-danger'>
                        {errorMessage}
                      </div>
                    )}

                    {status === 'success' && (
                      <div
                        className={
                          cn(
                            `inline-block px-3 py-1 rounded-full`,
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
                    ? 'success'
                    : 'warning'
                }
                icon='polygon'
                title='Polygon USDC Wallet Address'
                description={
                  <div className='flex items-center space-x-2'>
                    <span>{walletAddressStatus}</span>
                    {addressValidation.isValidating && (
                      <Icon name='spinner-dots' className='size-4' />
                    )}
                    {addressValidation.isValid && (
                      <Icon name='check' className='size-4' />
                    )}
                  </div>
                }>
                <a
                  href={
                    hexAddressValue
                      ? `https://polygonscan.com/address/${hexAddressValue}`
                      : 'https://polygonscan.com/'
                  }
                  rel='noopener noreferrer'
                  className='text-purple-600 dark:text-purple-300 flex flex-1 hover:underline hover:underline-offset-4 decoration-dotted bg-white dark:bg-white/5 ps-2 pe-1 py-0.5 rounded-full'
                  target='_blank'>
                  <span>polygon scan</span>
                  <Icon
                    name={addressValidation.isValid ? 'arrow-up' : 'arrow-up'}
                    className={cn(
                      ' size-4 translate-y-[0.35px] rotate-25',
                      addressValidation.isValid ? 'dark:text-white' : '',
                    )}
                  />
                </a>
              </Callout>
            </div>
            <form onSubmit={onSubmit} className='space-y-6 sm:space-y-8 w-full'>
              <div className='relative'>
                <form.AppField name='hexAddress'>
                  {(input) => (
                    <input.TextField
                      type='text'
                      label='Polygon USDC Wallet Address'
                      placeholder='0x611F3143b76a994214d751d762b52D081d8DC4de'
                    />
                  )}
                </form.AppField>
                <div className='absolute right-2 top-2'>
                  <button
                    type='button'
                    onClick={handlePasteAddress}
                    className='cursor-pointer'
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
                      className='size-4 active:scale-90 opacity-80 hover:opacity-100 will-change-transform transition-transform duration-200'
                    />
                  </button>
                </div>
              </div>

              <form.AppField name='callbackUrl'>
                {(input) => (
                  <input.TextField
                    type='text'
                    label='Callback URL'
                    placeholder='https://example.com/callback'
                  />
                )}
              </form.AppField>

              <div className='text-sm font-medium'>Internal use fields</div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4'>
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

              <div className='py-6'>
                <div className='flex flex-row justify-around sm:justify-start gap-4 sm:gap-6'>
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

                <div className='flex flex-row items-stretch sm:items-center sm:justify-start gap-3 sm:gap-3 py-8'>
                  {isEditMode && accountId && (
                    <Button
                      type='button'
                      variant='bordered'
                      size='lg'
                      onPress={handleSync}
                      isLoading={isSyncing}
                      className='w-full sm:w-auto'>
                      Sync from PayGate
                    </Button>
                  )}

                  {onCancel && (
                    <Button
                      type='button'
                      variant='flat'
                      size='lg'
                      onPress={onCancel}
                      className='w-full sm:w-auto'>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type='submit'
                    color='primary'
                    className='w-full sm:w-auto sm:min-w-32 font-polysans font-light disabled:cursor-not-allowed disabled:bg-sidebar/40 disabled:opacity-80 disabled:text-foreground/40'
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
