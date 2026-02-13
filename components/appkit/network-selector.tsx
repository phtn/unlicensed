import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {motion} from 'motion/react'
import {useMemo} from 'react'
import {HyperList} from '../expermtl/hyper-list'

type AllowedNetworks = 'sepolia' | 'ethereum' | 'polygon' | 'amoy'

interface NetworkSelectorProps {
  currentNetwork: string | null
  onSelectNetwork: (network: string) => () => void
}

export const NetworkSelector = ({
  currentNetwork,
  onSelectNetwork,
}: NetworkSelectorProps) => {
  const network_list = useMemo(
    () =>
      ['sepolia', 'ethereum', 'polygon', 'amoy'].map((net) => ({
        name: net,
        icon:
          net === 'sepolia'
            ? 'sepolia'
            : net === 'ethereum'
              ? 'ethereum'
              : net === 'polygon'
                ? 'polygon'
                : 'amoy',
        onSelect: onSelectNetwork(net),
        selected: currentNetwork === net,
      })) as NetworkButtonRoundProps[],
    [currentNetwork, onSelectNetwork],
  )
  return (
    <>
      <motion.div
        initial={{opacity: 0, scale: 0.85}}
        animate={{opacity: 1, scale: 1}}
        exit={{opacity: 0, scale: 0.6}}
        transition={{duration: 0.2}}
        className='flex items-center space-x-8 px-4 py-6 border-b-[0.33px] border-white/0 w-full'>
        <div className='font-brk flex items-center space-x-0.5 text-white/80'>
          <Icon name='network' className='text-white/70 size-5' />
          <span className='text-xs uppercase'>Network</span>
        </div>
        <HyperList
          direction='up'
          data={network_list}
          component={NetworkButtonRound}
          container='w-full flex items-center justify-around'
        />
      </motion.div>
    </>
  )
}

interface NetworkButtonRoundProps {
  name: AllowedNetworks
  onSelect: VoidFunction
  selected: boolean
}
const NetworkButtonRound = ({
  name,
  onSelect,
  selected,
}: NetworkButtonRoundProps) => {
  return (
    <motion.button
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      onClick={onSelect}
      className={cn(
        'relative flex items-center justify-center w-auto h-7 px-2 rounded-full overflow-hidden space-x-1 mx-2',
        {
          'bg-white': selected,
          'hover:bg-white/2 ': !selected,
          'cursor-pointer': true,
        },
      )}>
      <Icon
        name={
          name === 'sepolia'
            ? 'ethereum'
            : name === 'polygon' || name === 'amoy'
              ? 'polygon'
              : 'ethereum'
        }
        className={cn('text-slate-300 size-3', {
          'size-3': selected,
          'text-rose-400': name === 'sepolia' && selected,
          'text-polygon': name === 'polygon' && selected,
          'text-ethereum': name === 'ethereum' && selected,
          'text-rose-300': name === 'amoy' && selected,
        })}
      />
      <span
        className={cn('font-brk opacity-80 text-sm text-white', {
          'opacity-100 text-black': selected,
        })}>
        {name.substring(0, 3).toUpperCase()}
      </span>
    </motion.button>
  )
}
{
  /*{allowedNetworks.map((net, i) => {
        const isActive = currentNetwork === net
        return (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: i * 0.033 * 1.03 }}
            key={net}
            onClick={onSelectNetwork(net)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'relative flex items-center justify-center -space-x-0.5 py-1 px-1.5 h-8 overflow-hidden rounded-lg transition-colors',
              {
                'bg-white/5 border-[0.33px]': isActive,
                'hover:bg-white/2 ': !isActive,
                'cursor-pointer': true
              },
              {
                'border-rose-400/70': net === 'sepolia',
                'border-rose-300/70': net === 'amoy',
                'border-ethereum/70': net === 'ethereum',
                'border-polygon/70': net === 'polygon'
              }
            )}>
            <Icon
              name={net === 'sepolia' ? 'ethereum' : net === 'polygon' || net === 'amoy' ? 'polygon' : 'ethereum'}
              className={cn('absolute left-1 blur-sm -rotate-30 text-zinc-100/30 size-7 opacity-50', {
                'opacity-100': isActive,
                'text-rose-400': net === 'sepolia' && isActive,
                'text-polygon font-semibold': net === 'polygon' && isActive,
                'text-ethereum': net === 'ethereum' && isActive,
                'text-rose-300': net === 'amoy' && isActive
              })}
            />
            <Icon
              name={net === 'sepolia' ? 'ethereum' : net === 'polygon' || net === 'amoy' ? 'polygon' : 'ethereum'}
              className={cn('text-zinc-300/20 size-4', {
                'text-rose-400': net === 'sepolia' && isActive,
                'text-polygon': net === 'polygon' && isActive,
                'text-ethereum': net === 'ethereum' && isActive,
                'text-rose-300': net === 'amoy' && isActive
              })}
            />
            <span
              className={cn('lowercase drop-shadow-xs opacity-50 text-sm', {
                ' font-polyn font-bold': net === 'polygon' || net === 'amoy',
                ' font-bold tracking-tight': net === 'ethereum',
                'font-normal font-okxs tracking-tight': net === 'sepolia',
                'opacity-100': isActive
              })}>
              {net}
            </span>
          </motion.button>
        )
      })}*/
}
