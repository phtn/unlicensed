import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import {
  AppKitNetwork,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  bitcoin,
  mainnet,
  polygon,
  polygonAmoy,
  polygonZkEvmTestnet,
  sepolia,
  solana,
  solanaDevnet,
  solanaTestnet,
  xLayer,
  xLayerTestnet,
  zeroGTestnet
} from '@reown/appkit/networks'
import { cookieStorage, createStorage } from '@wagmi/core'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_REOWN_ID as string

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  bitcoin,
  sepolia,
  baseSepolia,
  mainnet,
  base,
  polygon,
  polygonAmoy,
  polygonZkEvmTestnet,
  zeroGTestnet,
  solanaTestnet,
  solanaDevnet,
  solana,
  xLayer,
  xLayerTestnet,
  arbitrum,
  arbitrumSepolia
]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig
