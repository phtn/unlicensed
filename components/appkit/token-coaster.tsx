import { Icon, IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'

export type Token = 'usdc' | 'ethereum' | 'bitcoin' | 'matic' | 'usdt'

interface TokenProps {
  token: Token
  nativeSymbol?: string
  size?: 'sm' | 'md' | 'lg'
}

export const TokenCoaster = ({ token, nativeSymbol, size = 'md' }: TokenProps) => {
  return (
    <div className='size-10 relative flex items-center justify-center'>
      <div
        className={cn(
          'absolute size-7 aspect-square rounded-full',
          { 'bg-white': token === 'usdc' }
          // { 'size-5': size === 'lg', 'size-4': size === 'md', 'size-3.5': size === 'sm' }
        )}
      />
      <Icon
        name={
          token === 'ethereum' && nativeSymbol
            ? (nativeSymbol.toLowerCase() as IconName)
            : (token.toLowerCase() as IconName)
        }
        className={cn(
          'relative size-5 text-usdc',
          { 'size-6': size === 'lg', 'size-5': size === 'md', 'size-4': size === 'sm' },
          {
            'text-white ': token === 'ethereum',
            'text-bitcoin': token === 'bitcoin',
            'text-white': token === 'ethereum' && nativeSymbol === 'matic',
            'text-usdc size-8': token === 'usdc'
          }
        )}
      />
    </div>
  )
}
