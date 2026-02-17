import {useCopy} from '@/hooks/use-copy'
import {Icon} from '@/lib/icons'
import {Tooltip} from '@heroui/react'
import {ReactNode} from 'react'

export const SectionTitle = ({title}: {title: ReactNode}) => {
  return (
    <h2 className='text-xl tracking-wide font-polysans font-semibold mb-4 opacity-70'>
      {title}
    </h2>
  )
}

export const Section = ({children}: {children: ReactNode}) => {
  return (
    <h2 className='text-xl tracking-wide font-polysans font-semibold mb-4'>
      {children}
    </h2>
  )
}

interface TxnIdProps {
  id: string
}

export const TxnId = ({id}: TxnIdProps) => {
  const {copy, copied} = useCopy({timeout: 2000})
  const handleCopy = () => copy('Txn ID', id)
  return (
    <div className=' flex items-center space-x-4'>
      <Tooltip content='Copy Transaction ID'>
        <Icon
          onClick={handleCopy}
          name={copied ? 'check' : 'copy'}
          className='size-4'
        />
      </Tooltip>
      <div className='flex items-center'>
        <p className='max-w-[10ch] truncate font-brk text-sm tracking-wide'>
          <span className=''>{id}</span>
        </p>
        <Icon name='external-link-line' className='size-4' />
      </div>
    </div>
  )
}
