'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useApiCall} from '@/hooks/use-api-call'
import {usePaygate} from '@/hooks/use-paygate'
import type {ProviderStatusResponse} from '@/lib/paygate/types'
import {Button, Card, CardBody} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useAction, useMutation} from 'convex/react'
import {FunctionReference} from 'convex/server'
import {useCallback, useEffect, useState} from 'react'
import {z} from 'zod'
import {useAppForm} from '../../../_components/ui/form-context'
import {ProvidersList} from './providers-list'

// Type guard for ProviderStatusResponse
function isProviderStatusResponse(
  data: unknown,
): data is ProviderStatusResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'providers' in data &&
    Array.isArray((data as ProviderStatusResponse).providers)
  )
}

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

const defaultValues: PaygateAccountFormValues = {
  hexAddress: '',
  addressIn: '',
  callbackUrl: process.env.NEXT_PUBLIC_PAYGATE_CALLBACK_URL ?? '',
  label: '',
  description: '',
  isDefault: false,
  enabled: true,
}

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
  const {createWallet} = usePaygate()
  const {handleApiCall, response} = useApiCall()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (!response) {
      handleApiCall('https://api.paygate.to/control/provider-status/')
    }
  }, [handleApiCall, response])

  const formValues = initialValues ?? defaultValues

  const form = useAppForm({
    defaultValues: formValues,
    onSubmit: async ({value}) => {
      setStatus('idle')
      setErrorMessage(null)
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
            data.addressIn,
            callbackUrl,
          )

          if (!paygateResponse.success) {
            const errorMsg =
              typeof paygateResponse.error === 'string'
                ? paygateResponse.error
                : 'Failed to create wallet in PayGate. Please check the wallet address and try again.'
            setErrorMessage(errorMsg)
            setStatus('error')
            return
          }

          // If PayGate API call succeeded, save to Convex
          await createAccount({
            hexAddress: data.hexAddress,
            addressIn: data.addressIn,
            label: data.label,
            callbackUrl:
              process.env.NEXT_PUBLIC_WALLET_CALLBACK ?? data.callbackUrl,
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

  return (
    <Card
      shadow='none'
      radius='none'
      className='md:rounded-lg dark:bg-dark-table/40 w-full py-4'>
      <CardBody className='px-4 md:px-6 h-[calc(100lvh-100px)] overflow-scroll'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8'>
          <div>
            <div className='mb-5'>
              <h3 className='text-lg sm:text-xl font-semibold tracking-tight'>
                {isEditMode ? 'Edit Wallet' : 'Create Wallet'}
              </h3>
              <p className='text-sm sm:text-base font-light text-foreground max-w-2xl'>
                {isEditMode ? (
                  'Update account settings or sync data from PayGate API.'
                ) : (
                  <span>
                    Only use
                    <span className='font-semibold px-2 text-rose-700'>
                      Polygon USDC wallet address
                    </span>
                    to create an account.
                  </span>
                )}
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
              className='space-y-6 sm:space-y-8 w-full'>
              <form.AppField name='hexAddress'>
                {(input) => (
                  <input.TextField
                    type='text'
                    label='Polygon Wallet Address'
                    placeholder='0x611F3143b76a994214d751d762b52D081d8DC4de'
                  />
                )}
              </form.AppField>

              <form.AppField name='callbackUrl'>
                {(input) => (
                  <input.TextField
                    type='text'
                    label='Callback URL'
                    placeholder='https://example.com/callback'
                  />
                )}
              </form.AppField>

              <div>Internal use</div>

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

                {(errorMessage || status === 'success') && (
                  <div className='space-y-2'>
                    {errorMessage && (
                      <div className='rounded-lg bg-danger/10 border border-danger/20 p-3 sm:p-4 text-sm text-danger'>
                        {errorMessage}
                      </div>
                    )}

                    {status === 'success' && (
                      <div className='rounded-lg bg-success/10 border border-success/20 p-3 sm:p-4 text-sm text-success'>
                        {isEditMode
                          ? 'Account updated successfully!'
                          : 'Account created successfully!'}
                      </div>
                    )}
                  </div>
                )}

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
                    color='default'
                    className='w-full sm:w-auto sm:min-w-32'
                    size='lg'
                    isLoading={useStore(
                      form.store,
                      (state) => state.isSubmitting,
                    )}>
                    {isEditMode ? 'Update Account' : 'Create Account'}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          <div className='dark:text-white dark:bg-background rounded-lg'>
            <h3 className='text-lg sm:text-xl font-semibold tracking-tight mb-4'>
              Provider Status
            </h3>
            <ProvidersList
              data={
                response?.data && isProviderStatusResponse(response.data)
                  ? response.data.providers
                  : []
              }
              loading={!response}
              error={response?.error ? new Error(response.error) : null}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
