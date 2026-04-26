'use client'

import {Select} from '@/components/hero-v3/select'
import {ITEMS} from '@/components/ui/product-profile'
import {useMemo} from 'react'

interface TagSelectorProps {
  selectedKeys: string[]
  onSelectionChange: (keys: string[]) => void
  type: 'terpenes' | 'flavors' | 'effects'
  label: string
  placeholder?: string
  multiple?: boolean
}

export const TagSelector = ({
  selectedKeys,
  type,
  label,
  placeholder,
  multiple = true,
}: TagSelectorProps) => {
  const items = useMemo(() => {
    // Normalize plural type to singular category
    const categoryMap: Record<
      'terpenes' | 'flavors' | 'effects',
      'terpene' | 'flavor' | 'effect'
    > = {
      terpenes: 'terpene',
      flavors: 'flavor',
      effects: 'effect',
    }
    const category = categoryMap[type]
    return ITEMS.filter((item) => item.category === category)
  }, [type])

  return (
    <Select
      label={label}
      mode={multiple ? 'multiple' : 'single'}
      placeholder={placeholder}
      value={multiple ? selectedKeys : String(new Set(selectedKeys))}
      options={items.map((item) => ({value: item.id, label: item.name}))}
    />
  )
}
