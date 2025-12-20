'use client'

import {ITEMS} from '@/components/ui/terpene'
import {Chip, Select, SelectItem, SelectedItems} from '@heroui/react'
import {useMemo} from 'react'
import {commonInputClassNames} from './ui/fields'

interface TagSelectorProps {
  selectedKeys: string[]
  onSelectionChange: (keys: string[]) => void
  type: 'terpene' | 'flavor' | 'denomination'
  label: string
  placeholder?: string
}

export const TagSelector = ({
  selectedKeys,
  onSelectionChange,
  type,
  label,
  placeholder,
}: TagSelectorProps) => {
  const items = useMemo(
    () => ITEMS.filter((item) => item.category === type),
    [type],
  )

  const handleSelectionChange = (keys: Set<React.Key> | 'all') => {
    if (keys === 'all') {
      onSelectionChange(items.map((i) => i.id))
    } else {
      onSelectionChange(Array.from(keys) as string[])
    }
  }

  return (
    <Select
      label={label}
      placeholder={placeholder}
      selectionMode='multiple'
      selectedKeys={new Set(selectedKeys)}
      onSelectionChange={handleSelectionChange}
      variant='bordered'
      isMultiline={true}
      classNames={{
        ...commonInputClassNames,
        trigger:
          'border h-16 border-light-gray/50 dark:border-black/20 bg-light-gray/10 shadow-none dark:bg-black/60 rounded-lg p-2 outline-none data-focus:border-blue-500 dark:data-hover:border-blue-500',
        label:
          'mb-2 pl-0.5 opacity-80 font-medium tracking-widest uppercase text-sm',
      }}
      renderValue={(items: SelectedItems<object>) => {
        return (
          <div className='flex flex-wrap gap-2'>
            {items.map((item) => {
              return (
                <Chip
                  key={item.key}
                  variant='flat'
                  classNames={{
                    base: 'border border-light-gray dark:border-light-gray/30 h-7',
                    content: 'text-xs flex items-center gap-1',
                  }}>
                  <span className='capitalize'>{item.textValue}</span>
                </Chip>
              )
            })}
          </div>
        )
      }}>
      {items.map((item) => (
        <SelectItem key={item.id} textValue={item.name}>
          <div className='flex items-center gap-2'>
            <div className='flex flex-col'>
              <span className='text-sm font-medium'>{item.name}</span>
              <span className='text-xs'>{item.description}</span>
            </div>
          </div>
        </SelectItem>
      ))}
    </Select>
  )
}
