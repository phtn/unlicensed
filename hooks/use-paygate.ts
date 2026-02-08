import {paygatePublicConfig} from '@/lib/paygate/config'
import type {ApiResponse} from '@/lib/paygate/types'
import {decodeAddressIfNeeded} from '@/utils/url-decoder'
import {useApiCall} from './use-api-call'
import {useProviders} from './use-paygate-providers'

export const usePaygate = () => {
  const {providers, loading: loadingProviders} = useProviders()
  const {loading, response, handleApiCall} = useApiCall()

  // Get API URLs from config (supports proxy server via NEXT_PUBLIC env vars)
  const apiUrl = paygatePublicConfig.apiUrl
  const checkoutUrl = paygatePublicConfig.checkoutUrl

  // Promise-based wallet creation (returns promise for awaiting)
  const createWallet = async (
    address: string,
    callback: string,
  ): Promise<ApiResponse> => {
    const encodedCallback = encodeURIComponent(encodeURIComponent(callback))
    const url = `${apiUrl}/control/wallet.php?address=${address}&callback=${encodedCallback}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/html, */*',
        },
      })

      const contentType = response.headers.get('content-type') || ''
      let data: unknown

      if (contentType.includes('application/json')) {
        data = await response.json()
      } else if (contentType.includes('text/html')) {
        const html = await response.text()
        data = {
          type: 'html',
          content: html,
          message:
            'This endpoint returns an HTML checkout page. Open the URL in a new tab to view it.',
        }
      } else {
        data = await response.text()
      }

      return {
        success: response.ok,
        data,
        url,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        url,
      }
    }
  }

  // Handlers for each form
  const handleWalletSubmit = (address: string, callback: string) => {
    const encodedCallback = encodeURIComponent(encodeURIComponent(callback))
    const url = `${apiUrl}/control/wallet.php?address=${address}&callback=${encodedCallback}`
    handleApiCall(url)
  }

  const handleProcessPaymentSubmit = (
    address: string,
    amount: string,
    provider: string,
    email: string,
    currency: string,
  ) => {
    const addressToUse = decodeAddressIfNeeded(address)
    const params = new URLSearchParams()
    params.append('address', addressToUse)
    params.append('amount', amount)
    params.append('provider', provider)
    params.append('email', email)
    params.append('currency', currency)
    const url = `${checkoutUrl}/process-payment.php?${params.toString()}`

    // Redirect directly instead of using fetch - this endpoint redirects to payment providers
    // and fetch can't follow cross-origin redirects due to CORS
    // The browser will handle the redirect chain naturally
    if (typeof window !== 'undefined') {
      window.location.href = url
    }
  }

  const handleHostedPaymentSubmit = (
    address: string,
    amount: string,
    email: string,
    currency: string,
    whiteLabel?: {
      domain?: string
      logo?: string
      background?: string
      theme?: string
      button?: string
    },
  ) => {
    const addressToUse = decodeAddressIfNeeded(address)
    const params = new URLSearchParams()
    params.append('address', addressToUse)
    params.append('amount', amount)
    params.append('provider', 'hosted')
    params.append('email', email)
    params.append('currency', currency)

    // Add white label parameters if provided
    if (whiteLabel) {
      if (whiteLabel.domain) params.append('domain', whiteLabel.domain)
      if (whiteLabel.logo)
        params.append('logo', encodeURIComponent(whiteLabel.logo))
      if (whiteLabel.background)
        params.append('background', encodeURIComponent(whiteLabel.background))
      if (whiteLabel.theme)
        params.append('theme', encodeURIComponent(whiteLabel.theme))
      if (whiteLabel.button)
        params.append('button', encodeURIComponent(whiteLabel.button))
    }

    const url = `${checkoutUrl}/pay.php?${params.toString()}`
    handleApiCall(url)
  }

  const handleStatusSubmit = (address: string, transactionId: string) => {
    const addressToUse = decodeAddressIfNeeded(address)
    const params = new URLSearchParams()
    params.append('address_in', addressToUse)
    params.append('transaction_id', transactionId)
    const url = `${apiUrl}/status.php?${params.toString()}`
    handleApiCall(url)
  }

  const handleCreateSubmit = (
    address: string,
    amount: string,
    provider: string,
    email: string,
    currency: string,
  ) => {
    const addressToUse = decodeAddressIfNeeded(address)
    const params = new URLSearchParams()
    params.append('address', addressToUse)
    params.append('amount', amount)
    params.append('provider', provider)
    params.append('email', email)
    params.append('currency', currency)
    const url = `${apiUrl}/create.php?${params.toString()}`
    handleApiCall(url)
  }

  const handleAffiliateSubmit = (
    address: string,
    callback: string,
    affiliateWallet?: string,
  ) => {
    const encodedCallback = encodeURIComponent(encodeURIComponent(callback))
    const params = new URLSearchParams({
      address,
      callback: encodedCallback,
    })
    if (affiliateWallet) {
      params.append('affiliate', affiliateWallet)
    }
    const url = `${apiUrl}/control/affiliate.php?${params.toString()}`
    handleApiCall(url)
  }

  const handleCallbackSimulatorSubmit = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params)
    const url = `/api/callback?${searchParams.toString()}`
    handleApiCall(url)
  }
  return {
    handleStatusSubmit,
    handleCreateSubmit,
    handleWalletSubmit,
    handleAffiliateSubmit,
    handleCallbackSimulatorSubmit,
    handleHostedPaymentSubmit,
    handleProcessPaymentSubmit,
    createWallet,
    loadingProviders,
    loading,
    response,
    providers,
  }
}
