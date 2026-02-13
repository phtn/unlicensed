'use client'

import {Icon} from '@/lib/icons'
import {Input} from '@heroui/react'
import {useState} from 'react'
import {searchInputClassNames} from './message-input'

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
          radius='none'
          value={localQuery}
          onChange={handleChange}
          classNames={{
            ...searchInputClassNames,
            inputWrapper: [searchInputClassNames?.inputWrapper, ''],
          }}
          placeholder='Search conversations'
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
