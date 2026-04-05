'use client'

import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Input} from '@heroui/react'
import {useEffect, useState} from 'react'
import {searchInputClassName} from './message-input'

interface ConversationSearchProps {
  onSearch: (query: string) => void
  searchQuery: string
}

export function ConversationSearch({
  onSearch,
  searchQuery,
}: ConversationSearchProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery)

  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

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
    <div className='border-b border-border/40 bg-background/95 px-3 md:pt-4 supports-backdrop-filter:backdrop-blur-md md:px-4'>
      <div className='relative'>
        <Icon
          name='search'
          className='z-20 text-dark-table dark:text-white/40 absolute left-2 top-1/2 -translate-y-1/2 size-4 opacity-90'
        />
        <Input
          aria-label='Search conversations'
          type='text'
          variant='secondary'
          value={localQuery}
          onChange={handleChange}
          placeholder='Search conversations'
          className={cn(
            searchInputClassName,
            'min-h-12 bg-background/80 placeholder:text-sm placeholder:text-foreground/40',
          )}
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
