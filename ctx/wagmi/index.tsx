'use client'

import {mainnet} from '@reown/appkit/networks'
import {createAppKit} from '@reown/appkit/react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {type ReactNode} from 'react'
import {cookieToInitialState, WagmiProvider, type Config} from 'wagmi'
import {bitcoinAdapter, networks, projectId, wagmiAdapter} from './config'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'Rapid Fire',
  description: 'Rapid Fire',
  url:
    process.env.NODE_ENV === 'production'
      ? 'https://rapidfirenow.com'
      : 'http://localhost:3000', // origin must match your domain & subdomain
  icons: ['/svg/logomark.svg'],
}

// Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter, bitcoinAdapter],
  projectId,
  networks,
  defaultNetwork: mainnet,
  metadata: metadata,
  features: {
    analytics: true,
    emailShowWallets: true,
  },
  themeMode: 'dark',
})

function WagmiContext({
  children,
  cookies,
}: {
  children: ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies,
  )

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default WagmiContext
