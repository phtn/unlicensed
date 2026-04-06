import {useCopy} from '@/hooks/use-copy'
import {Icon} from '@/lib/icons'
import {Tooltip} from '@heroui/react'
import {ReactNode} from 'react'

export const SectionTitle = ({title}: {title: ReactNode}) => {
  return (
    <h2 className='text-lg tracking-wide font-clash font-semibold mb-2 opacity-70'>
      {title}
    </h2>
  )
}

export const Section = ({children}: {children: ReactNode}) => {
  return (
    <h2 className='text-lg tracking-wide font-polysans font-semibold mb-4'>
      {children}
    </h2>
  )
}

interface TxnIdProps {
  id: string
}

const getTxnExplorerUrl = (id: string) => {
  if (id.startsWith('0x')) return `https://etherscan.io/tx/${id}`
  return `https://mempool.space/tx/${id}`
}

export const TxnId = ({id}: TxnIdProps) => {
  const {copy, copied} = useCopy({timeout: 2000})
  const handleCopy = () => copy('Txn ID', id)
  return (
    <div className=' flex items-center space-x-4'>
      <Tooltip delay={0}>
        <Tooltip.Trigger>
          <Icon
            onClick={handleCopy}
            name={copied ? 'check' : 'copy'}
            className='size-4'
          />
        </Tooltip.Trigger>
        <Tooltip.Content>Copy Transaction ID</Tooltip.Content>
      </Tooltip>
      <a
        href={getTxnExplorerUrl(id)}
        target='_blank'
        rel='noopener noreferrer'
        className='flex items-center'>
        <p className='max-w-[18ch] truncate font-brk text-sm tracking-wide'>
          {id}
        </p>
        <Icon name='external-link-line' className='size-4' />
      </a>
    </div>
  )
}
