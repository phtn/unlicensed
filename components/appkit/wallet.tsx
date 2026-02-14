import {cn} from '@/lib/utils'
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {config} from '@/ctx/wagmi/config'
import {useCrypto} from '@/hooks/use-crypto'
import {Icon} from '@/lib/icons'
import {useAppKitAccount} from '@reown/appkit/react'
import {getBalance} from '@wagmi/core'
import {formatUnits} from 'viem'
import {
  polygon,
  polygonAmoy,
  sepolia,
  zeroGGalileoTestnet,
  zeroGMainnet,
} from 'viem/chains'
import {useChainId, useChains} from 'wagmi'

type AllowedNet = 'eth' | 'sepolia' | 'polygon' | 'amoy' | 'zeroG' | 'galileo'

export const WalletComponent = () => {
  const {address} = useAppKitAccount()
  const {getBySymbol} = useCrypto()
  const chainId = useChainId()
  const chains = useChains()

  const currentChain = useMemo(
    () => chains.find((chain) => chain.id === chainId),
    [chains, chainId],
  )
  // const networkName = useMemo(() => currentChain?.name ?? 'Unknown', [currentChain])
  const nc = currentChain?.nativeCurrency.symbol
  const chainBalId = useMemo(() => {
    if (chainId === 1) return 1
    if (chainId === sepolia.id) return sepolia.id
    if (chainId === polygon.id) return polygon.id
    if (chainId === polygonAmoy.id) return polygonAmoy.id
    if (chainId === zeroGMainnet.id) return zeroGMainnet.id
    if (chainId === zeroGGalileoTestnet.id) return zeroGGalileoTestnet.id
  }, [chainId])

  // Map chainId to AllowedNet type
  const networkId = useMemo((): AllowedNet | null => {
    if (chainId === 1) return 'eth'
    if (chainId === sepolia.id) return 'sepolia'
    if (chainId === polygon.id) return 'polygon'
    if (chainId === polygonAmoy.id) return 'amoy'
    if (chainId === zeroGMainnet.id) return 'zeroG'
    if (chainId === zeroGGalileoTestnet.id) return 'galileo'
    return null
  }, [chainId])

  const getBal = useCallback(async () => {
    const balance = await getBalance(config, {
      address: address as `0x${string}`,
      chainId: chainBalId,
    })
    // formatUnits converts wei → human-readable string
    const formattedBal = formatUnits(balance.value, balance.decimals)
    const balanceAsNumber = Number(formattedBal)

    const currentPrice = getBySymbol(balance.symbol)?.price

    if (!currentPrice) {
      return null
    }

    const usdValue = balanceAsNumber * currentPrice
    console.table({
      'Balance ': balanceAsNumber,
      'USD Value': usdValue,
      symbol: balance.symbol,
      native: nc,
    })

    return usdValue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      unitDisplay: 'narrow',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      currencyDisplay: 'symbol',
    })
  }, [address, chainBalId, getBySymbol, nc])

  const [balance, setBalance] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const prevNetworkIdRef = useRef<AllowedNet | null>(null)
  const prevAddressRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (address && networkId && !isFetching) {
      // Fetch if network changed or address changed
      const networkChanged = prevNetworkIdRef.current !== networkId
      const addressChanged = prevAddressRef.current !== address

      if (networkChanged || addressChanged) {
        prevNetworkIdRef.current = networkId
        prevAddressRef.current = address

        startTransition(() => {
          setIsFetching(true)
          setBalance(null)
        })

        getBal()
          .then((result) => {
            startTransition(() => {
              setBalance(result)
              setIsFetching(false)
            })
          })
          .catch((error) => {
            console.error(error)
            startTransition(() => {
              setIsFetching(false)
            })
          })
      }
    }
  }, [address, networkId, getBal, isFetching])

  return (
    <div
      className={cn(
        'flex items-center space-x-1 md:space-x-4 transition-transform',
        {
          'portrait:translate-x-0': !isFetching,
        },
      )}>
      <button className='hidden btn btn-ghost hover:bg-transparent rounded-full'>
        {isFetching ? (
          <Icon
            name='spinners-ring'
            className={cn('size-3 opacity-80 text-orange-300')}
          />
        ) : balance ? (
          <label className='hidden swap swap-flip'>
            <input type='checkbox' defaultChecked />
            <div className='font-brk md:text-lg swap-on flex items-center'>
              {balance}
            </div>
            <div className='flex items-center font-space md:text-lg swap-off'>
              <div className='font-space opacity-60'>$</div>{' '}
              <div className='text-2xl mt-2 pl-1'>*****</div>
            </div>
          </label>
        ) : (
          <label className='hidden swap swap-flip'>
            <input type='checkbox' defaultChecked />
            <div className='font-space md:text-lg swap-on flex items-center'>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              }).format(0)}
            </div>
            <div className='flex items-center font-space md:text-lg swap-off'>
              <div className='md:text-2xl mt-2'>*****</div>
            </div>
          </label>
        )}
      </button>
      <div className='items-center flex whitespace-nowrap justify-start text-xs w-fit rounded-full overflow-hidden'>
        <WalletConnector />
      </div>
    </div>
  )
}
const WalletConnector = () => {
  return <w3m-account-button balance='hide' />
}
export const chainMap = {
  sepolia: sepolia.id,
  eth: 1,
  polygon: polygon.id,
  amoy: polygonAmoy.id,
  galileo: zeroGGalileoTestnet.id,
  zeroG: zeroGMainnet.id,
}
