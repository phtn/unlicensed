'use client'

import {api} from '@/convex/_generated/api'
import {Button, Card, CardBody, Divider, Input, Switch} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useEffect, useRef, useState} from 'react'

export function PayGateSettings() {
  const adminSettings = useQuery(api.admin.q.getAdminSettings)
  const updatePayGateSettings = useMutation(api.admin.m.updatePayGateSettings)

  const [apiUrl, setApiUrl] = useState('')
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [usdcWallet, setUsdcWallet] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>(
    'idle',
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load settings when available
  useEffect(() => {
    if (adminSettings?.value?.paygate) {
      setApiUrl(adminSettings.value.paygate.apiUrl || '')
      setCheckoutUrl(adminSettings.value.paygate.checkoutUrl || '')
      setUsdcWallet(adminSettings.value.paygate.usdcWallet || '')
      setEnabled(adminSettings.value.paygate.enabled !== false)
    } else {
      // Set defaults from environment or PayGate defaults
      setApiUrl('https://api.paygate.to')
      setCheckoutUrl('https://checkout.paygate.to')
      setEnabled(true)
    }
  }, [adminSettings])

  const handleSave = async () => {
    // Validate wallet is provided when PayGate is enabled
    if (enabled && (!usdcWallet || usdcWallet.trim() === '')) {
      setValidationError(
        'USDC wallet address is required when PayGate is enabled',
      )
      return
    }

    setValidationError(null)
    setIsSaving(true)
    setSaveStatus('idle')

    try {
      await updatePayGateSettings({
        paygate: {
          apiUrl: apiUrl || undefined,
          checkoutUrl: checkoutUrl || undefined,
          usdcWallet: usdcWallet || undefined,
          enabled,
        },
      })
      setSaveStatus('success')
      if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current)
      saveStatusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to save PayGate settings:', error)
      setSaveStatus('error')
      if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current)
      saveStatusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Validate wallet when enabled state changes
  useEffect(() => {
    if (enabled && (!usdcWallet || usdcWallet.trim() === '')) {
      setValidationError(
        'USDC wallet address is required when PayGate is enabled',
      )
    } else {
      setValidationError(null)
    }
  }, [enabled, usdcWallet])

  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current)
        saveStatusTimeoutRef.current = null
      }
    }
  }, [])

  return (
    <Card
      shadow='none'
      radius='none'
      className='md:rounded-lg md:w-full w-screen overflow-auto md:p-6 space-y-6'>
      <CardBody className='p-6 space-y-6'>
        <div>
          <h2 className='text-xl font-semibold mb-2'>
            PayGate Payment Gateway
          </h2>
          <p className='text-sm text-color-muted whitespace-normal line-clamp-3'>
            Configure PayGate.to integration for credit card and cryptocurrency
            payments. No API keys required - just set your USDC Polygon wallet
            address.
          </p>
        </div>

        <Divider />

        <div className='space-y-4'>
          <Switch isSelected={enabled} onValueChange={setEnabled} size='sm'>
            Enable PayGate Integration
          </Switch>

          <Input
            label='API URL'
            placeholder='https://api.paygate.to'
            value={apiUrl}
            onValueChange={setApiUrl}
            description='PayGate API endpoint (use custom domain for white-label)'
            isDisabled={!enabled}
          />

          <Input
            label='Checkout URL'
            placeholder='https://checkout.paygate.to'
            value={checkoutUrl}
            onValueChange={setCheckoutUrl}
            description='PayGate checkout page URL (use custom domain for white-label)'
            isDisabled={!enabled}
          />

          <Input
            label='USDC Polygon Wallet Address'
            placeholder='0x...'
            value={usdcWallet}
            onValueChange={setUsdcWallet}
            description='Your USDC (Polygon) wallet address to receive payments'
            isDisabled={!enabled}
            isRequired={enabled}
            errorMessage={
              validationError && enabled ? validationError : undefined
            }
            isInvalid={enabled && (!usdcWallet || usdcWallet.trim() === '')}
          />

          <div className='bg-default-100 p-4 rounded-lg space-y-2 text-sm'>
            <p className='font-semibold'>Configuration Notes:</p>
            <ul className='list-disc list-inside space-y-1 text-color-muted whitespace-normal line-clamp-8'>
              <li>
                Leave API URL and Checkout URL empty to use PayGate defaults
              </li>
              <li>
                For white-label setup, configure custom domains via Cloudflare
                Workers (see documentation)
              </li>
              <li>
                USDC Polygon wallet address is required to receive payments
              </li>
              <li>
                Settings can also be configured via environment variables:
                PAYGATE_API_URL, PAYGATE_CHECKOUT_URL, PAYGATE_USDC_WALLET
              </li>
            </ul>
          </div>
        </div>

        <Divider />

        <div className='flex justify-end gap-2'>
          {saveStatus === 'success' && (
            <span className='text-sm text-success'>Settings saved!</span>
          )}
          {saveStatus === 'error' && (
            <span className='text-sm text-danger'>Failed to save settings</span>
          )}
          <Button
            onPress={handleSave}
            color='primary'
            isLoading={isSaving}
            isDisabled={
              (enabled && (!usdcWallet || usdcWallet.trim() === '')) ||
              (!enabled && !usdcWallet)
            }>
            Save Settings
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
