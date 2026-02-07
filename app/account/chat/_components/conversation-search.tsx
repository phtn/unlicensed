'use client'

import {Icon} from '@/lib/icons'
import {Input} from '@heroui/react'
import {useState} from 'react'
import {chatInputClassNames} from './message-input'

interface ConversationSearchProps {
  onSearch: (query: string) => void
  searchQuery: string
}

export function ConversationSearch({
  onSearch,
  searchQuery,
}: ConversationSearchProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalQuery(value)
    onSearch(value)
  }

  const handleClear = () => {
    setLocalQuery('')
    onSearch('')
  }

  return (
    <div className='relative backdrop-blur-sm border-y lg:border-l'>
      <div className='relative md:px-0'>
        <Icon
          name='search'
          className='z-20 text-dark-table dark:text-primary-hover absolute left-2 top-1/2 -translate-y-1/2 size-4 opacity-90'
        />
        <Input
          type='text'
          value={localQuery}
          onChange={handleChange}
          placeholder='Search conversations'
          radius='none'
          classNames={chatInputClassNames}
          // classNames={{
          //   label:
          //     'mb-5 pl-1 opacity-80 tracking-widest uppercase text-xs font-brk',
          //   input:
          //     'text-blue-500 dark:text-white text-base font-medium font-okxs placeholder:text-slate-500/60 placeholder:font-normal dark:placeholder:text-slate-500 selection:bg-blue-400 selection:text-white',
          //   inputWrapper:
          //     'border shadow-none border-light-gray/50 dark:border-black/20 bg-light-gray/10 dark:bg-black/60 data-focus:border-blue-500 dark:data-hover:border-blue-500 rounded-lg p-2 outline-none min-h-16 w-full',
          //   innerWrapper: 'px-1',
          // }}
          // classNames={{
          //   ...commonInputClassNames,
          //   inputWrapper: [
          //     commonInputClassNames.inputWrapper,
          //     'hover:bg-black bg-sidebar border-dark-gray/40',
          //   ],
          //   input: [
          //     commonInputClassNames.input,
          //     'font-okxs font-normal text-sm md:text-lg hover:bg-black',
          //   ],
          //   innerWrapper: [commonInputClassNames.innerWrapper, 'pl-8'],
          // }}
          className='focus:bg-sidebar hover:bg-sidebar placeholder:text-sm placeholder:opacity-80 dark:placeholder:focus:bg-background placeholder:text-primary  dark:placeholder:text-white shadow-none'
        />
        {localQuery && (
          <button
            type='button'
            onClick={handleClear}
            className='absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-accent transition-colors'>
            <Icon name='x' className='size-4' />
          </button>
        )}
      </div>
    </div>
  )
}
