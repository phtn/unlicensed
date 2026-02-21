'use client'

import {useAppForm} from '@/app/admin/_components/ui/form-context'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {api} from '@/convex/_generated/api'
import type {Doc, Id} from '@/convex/_generated/dataModel'
import {useApiCall} from '@/hooks/use-api-call'
import {Button, Card, CardBody} from '@heroui/react'
import {useStore} from '@tanstack/react-store'
import {useMutation, useQuery} from 'convex/react'
import {useCallback, useMemo, useState} from 'react'
import {z} from 'zod'

const affiliateAccountSchema = z.object({
  paygateAccount: z.string(),
  walletAddress: z
    .string()
    .min(1, 'Wallet address is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address (0x...)'),
  label: z.string().optional(),
  description: z.string().optional(),
  commissionRate: z.number().min(0).max(1).optional(),
  merchantRate: z.number().min(0).max(1).optional(),
  enabled: z.boolean().optional(),
})

type AffiliateAccountFormValues = z.infer<typeof affiliateAccountSchema>

const defaultValues: AffiliateAccountFormValues = {
  paygateAccount: '',
  walletAddress: '',
  label: '',
  description: '',
  commissionRate: 0.4,
  merchantRate: 0.59,
  enabled: true,
}

type AffiliateAccountFormProps = {
  affiliateId?: Doc<'affiliateAccounts'>['_id']
  initialValues?: AffiliateAccountFormValues
  onCreated?: VoidFunction
  onUpdated?: VoidFunction
  onCancel?: VoidFunction
}

export const AffiliateAccountForm = ({
  affiliateId,
  initialValues,
  onCreated,
  onUpdated,
  onCancel,
}: AffiliateAccountFormProps) => {
  const isEditMode = !!affiliateId
  const createAffiliate = useMutation(api.affiliateAccounts.m.createAffiliate)
  const updateAffiliate = useMutation(api.affiliateAccounts.m.updateAffiliate)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const paygateAccounts = useQuery(api.paygateAccounts.q.listAccounts, {
    gateway: 'paygate',
  })
  const {handleApiCall} = useApiCall()

  const getAccountWallet = useCallback(
    (id: Id<'paygateAccounts'>) => {
      const account = paygateAccounts?.find((account) => account._id === id)
      return account?.hexAddress
    },
    [paygateAccounts],
  )

  const paygateAccountOptions = useMemo(() => {
    if (!paygateAccounts) return []
    return paygateAccounts.map((account) => ({
      value: account._id,
      label: account.label ?? account.addressIn,
    }))
  }, [paygateAccounts])

  const formValues = initialValues ?? defaultValues

  const form = useAppForm({
    defaultValues: formValues,
    onSubmit: async ({value}) => {
      setStatus('idle')
      setErrorMessage(null)
      try {
        const parsed = affiliateAccountSchema.safeParse(value)
        if (!parsed.success) {
          const message =
            parsed.error.issues[0]?.message ??
            'Please review the form for validation errors.'
          setErrorMessage(message)
          setStatus('error')
          return
        }

        const data = parsed.data

        if (isEditMode && affiliateId) {
          await updateAffiliate({
            id: affiliateId,
            label: data.label,
            description: data.description,
            commissionRate: data.commissionRate,
            merchantRate: data.merchantRate,
            enabled: data.enabled,
          })
          setStatus('success')
          onUpdated?.()
        } else {
          await createAffiliate({
            paygateAccount: data.paygateAccount as Id<'paygateAccounts'>,
            walletAddress: data.walletAddress,
            label: data.label,
            description: data.description,
            commissionRate: data.commissionRate,
            merchantRate: data.merchantRate,
            enabled: data.enabled,
          })
          await handleApiCall(
            'https://api.paygate.to/control/custom-affiliate.php?address=' +
              getAccountWallet(data.paygateAccount as Id<'paygateAccounts'>) +
              '&callback=' +
              'https%3A%2F%2Frapidfirenow.com%2Forder%3Fnumber%3D82173313628090' +
              '&affiliate=' +
              data.walletAddress +
              '&affiliate_fee=' +
              data.commissionRate +
              '&merchant_fee=' +
              data.merchantRate,
          )
          form.reset()
          setStatus('success')
          onCreated?.()
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : isEditMode
              ? 'Failed to update affiliate account.'
              : 'Failed to create affiliate account.'
        setErrorMessage(message)
        setStatus('error')
      }
    },
  })

  return (
    <Card shadow='none' radius='none' className='md:rounded-lg'>
      <CardBody className='space-y-6 w-full'>
        <SectionHeader
          title={
            isEditMode ? 'Edit Affiliate Account' : 'Add New Affiliate Account'
          }
          description={
            isEditMode
              ? 'Update affiliate account settings and commission rate.'
              : 'Create a new affiliate account to track commissions'
          }></SectionHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className='space-y-4'>
          <form.AppField name='paygateAccount'>
            {(input) => (
              <input.SelectField
                type='select'
                name='paygateAccount'
                label='Select a PayGate account'
                placeholder='0x'
                description='Ethereum/Polygon wallet address for receiving commissions'
                options={paygateAccountOptions}
              />
            )}
          </form.AppField>
          <form.AppField name='walletAddress'>
            {(input) => (
              <input.TextField
                type='text'
                label='Affiliat Wallet Address'
                placeholder='0x'
              />
            )}
          </form.AppField>

          <form.AppField name='label'>
            {(input) => (
              <input.TextField
                type='text'
                label='Label (Optional)'
                placeholder='e.g., Main Affiliate, Partner Account'
              />
            )}
          </form.AppField>

          <form.AppField name='description'>
            {(input) => (
              <input.TextField
                type='text'
                label='Description (Optional)'
                placeholder='Affiliate description or notes'
              />
            )}
          </form.AppField>

          <form.AppField name='commissionRate'>
            {(input) => (
              <input.TextField
                type='number'
                step='0.001'
                min='0'
                max='1'
                label='Commission Rate'
                placeholder='0.005'
                description='Commission rate as decimal (e.g., 0.005 for 0.5%, 0.01 for 1%)'
              />
            )}
          </form.AppField>

          <form.AppField name='enabled'>
            {(input) => (
              <input.SwitchField
                type='checkbox'
                label='Enabled'
                description='Enable this affiliate account for commission tracking'
              />
            )}
          </form.AppField>

          {errorMessage && (
            <div className='rounded-lg bg-danger/10 border border-danger/20 p-3 text-sm text-danger'>
              {errorMessage}
            </div>
          )}

          {status === 'success' && (
            <div className='rounded-lg bg-success/10 border border-success/20 p-3 text-sm text-success'>
              {isEditMode
                ? 'Affiliate account updated successfully!'
                : 'Affiliate account created successfully!'}
            </div>
          )}

          <div className='flex items-center gap-3'>
            <Button
              type='submit'
              color='primary'
              className='min-w-32'
              isLoading={useStore(form.store, (state) => state.isSubmitting)}>
              {isEditMode ? 'Update Affiliate' : 'Create Affiliate'}
            </Button>

            {onCancel && (
              <Button type='button' variant='light' onPress={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
