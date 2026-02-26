import {
  getGatewayPublicConfig,
  type GatewayId,
} from '@/lib/paygate/gateway-config'
import type {ApiResponse} from '@/lib/paygate/types'

/** Optional override from Convex gateway document. When provided, takes precedence over env/defaults. */
export type GatewayUrlConfig = {apiUrl?: string; checkoutUrl?: string}

/**
 * Hook for PayGate/Paylex/Rampex (same process). Returns createWallet using the gateway's API URL.
 * Pass gatewayUrls from Convex (api.gateways.q.getByGateway) to use gateway-configured URLs.
 */
export function useGateway(gateway: GatewayId, gatewayUrls?: GatewayUrlConfig) {
  const fallback = getGatewayPublicConfig(gateway)
  const apiUrl =
    gatewayUrls?.apiUrl?.trim() || fallback.apiUrl

  const createWallet = async (
    address: string,
    callback: string,
  ): Promise<ApiResponse> => {
    const encodedCallback = encodeURIComponent(callback)
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
