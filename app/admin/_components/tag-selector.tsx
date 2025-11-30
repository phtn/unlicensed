'use client'

import {ITEMS} from '@/components/ui/terpene'
import {Chip, Select, SelectItem, SelectedItems} from '@heroui/react'
import {useMemo} from 'react'

interface TagSelectorProps {
  selectedKeys: string[]
  onSelectionChange: (keys: string[]) => void
  type: 'terpene' | 'flavor'
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
      // classNames={{
      //   trigger: 'bg-neutral-900 border border-neutral-800 data-[hover=true]:bg-neutral-800 data-[open=true]:border-emerald-500 min-h-12 h-auto py-2',
      //   popoverContent: 'bg-neutral-900 border border-neutral-800',
      // }}
      isMultiline={true}
      renderValue={(items: SelectedItems<object>) => {
        return (
          <div className='flex flex-wrap gap-2'>
            {items.map((item) => {
              return (
                <Chip
                  key={item.key}
                  variant='flat'
                  classNames={{
                    base: 'bg-neutral-800 border border-neutral-700 h-7',
                    content: 'text-xs text-neutral-300 flex items-center gap-1',
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
              <span className='text-sm font-medium text-neutral-200'>
                {item.name}
              </span>
              <span className='text-xs text-neutral-500'>
                {item.description}
              </span>
            </div>
          </div>
        </SelectItem>
      ))}
    </Select>
  )
}
