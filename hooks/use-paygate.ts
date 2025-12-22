import {decodeAddressIfNeeded} from '@/utils/url-decoder'
import {useApiCall} from './use-api-call'
import {useProviders} from './use-paygate-providers'

export const usePaygate = () => {
  const {providers, loading: loadingProviders} = useProviders()
  const {loading, response, handleApiCall} = useApiCall()

  // Handlers for each form
  const handleWalletSubmit = (address: string, callback: string) => {
    const encodedCallback = encodeURIComponent(encodeURIComponent(callback))
    const url = `https://api.paygate.to/control/wallet.php?address=${address}&callback=${encodedCallback}`
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
    const url = `https://checkout.paygate.to/process-payment.php?${params.toString()}`
    handleApiCall(url)
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

    const url = `https://checkout.paygate.to/pay.php?${params.toString()}`
    handleApiCall(url)
  }

  const handleStatusSubmit = (address: string, transactionId: string) => {
    const addressToUse = decodeAddressIfNeeded(address)
    const params = new URLSearchParams()
    params.append('address_in', addressToUse)
    params.append('transaction_id', transactionId)
    const url = `https://api.paygate.to/status.php?${params.toString()}`
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
    const url = `https://api.paygate.to/create.php?${params.toString()}`
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
    const url = `https://api.paygate.to/control/affiliate.php?${params.toString()}`
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
    loadingProviders,
    loading,
    response,
    providers,
  }
}
