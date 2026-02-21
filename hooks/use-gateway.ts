import {
  getGatewayPublicConfig,
  type GatewayId,
} from '@/lib/paygate/gateway-config'
import type {ApiResponse} from '@/lib/paygate/types'

/**
 * Hook for PayGate/Paylex/Rampex (same process). Returns createWallet using the gateway's API URL.
 */
export function useGateway(gateway: GatewayId) {
  const {apiUrl} = getGatewayPublicConfig(gateway)

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

  return {createWallet, loading: false}
}
