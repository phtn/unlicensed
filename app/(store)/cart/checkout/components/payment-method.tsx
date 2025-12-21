import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Select, SelectItem} from '@heroui/react'
import React from 'react'

interface IPaymentMethod {
  id: string
  name: string
  label: string
  icon: IconName
  iconStyle: string
  description: string
  status: string
  tag?: string
}

interface PaymentMethodProps {
  onChange: (value: 'credit_card' | 'crypto' | 'cashapp') => void
}

export const PaymentMethod = ({onChange}: PaymentMethodProps) => {
  const methods: Array<IPaymentMethod> = [
    {
      id: 'credit-card',
      name: 'Credit Card',
      label: 'Credit Card',
      icon: 'mastercard',
      iconStyle: 'text-[#16ee37]',
      description: 'Visa, Mastercard, AMEX, every card.',
      status: 'active',
      tag: 'Direct Checkout',
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      label: 'Cryptocurrency',
      icon: 'ethereum',
      iconStyle: 'text-[#16ee37]',
      description: 'Bitcoin, Ethereum, Multichain, every coin.',
      status: 'active',
      tag: 'Verification Required',
    },
    {
      id: 'cash-app',
      name: 'CashApp',
      label: 'CashApp',
      icon: 'cashapp',
      iconStyle: 'text-[#16ee37]',
      description: 'CashApp Account',
      status: 'active',
      tag: 'Verification Required',
    },
  ]

  // Map method IDs to expected payment method values
  const idToPaymentMethod: Record<string, 'credit_card' | 'crypto' | 'cashapp'> = {
    'credit-card': 'credit_card',
    'crypto': 'crypto',
    'cash-app': 'cashapp',
  }

  const handleSelectionChange = (keys: 'all' | Set<React.Key>) => {
    if (keys === 'all' || keys.size === 0) return
    const selectedKey = Array.from(keys)[0] as string
    if (selectedKey) {
      const paymentMethod = idToPaymentMethod[selectedKey]
      if (paymentMethod) {
        onChange(paymentMethod)
      }
    }
  }

  return (
    <Select
      classNames={{
        base: 'w-full',
        trigger:
          'min-h-12 py-2 bg-sky-100 dark:bg-sky-500/10 border border-foreground/20 placeholder:text-foreground',
        listboxWrapper: 'border dark:border-foreground rounded-2xl',
        listbox: 'border-b',
      }}
      isMultiline={true}
      multiple={false}
      items={methods}
      label='Payment Method'
      labelPlacement='outside'
      onSelectionChange={handleSelectionChange}
      placeholder='Select Payment Method'
      renderValue={(items) => {
        return items.map((item) => (
          <div key={item.key} className='flex items-center gap-2 px-1'>
            {item.data?.icon && (
              <Icon name={item.data?.icon} className='shrink-0 size-7' />
            )}
            <div className='flex flex-col px-1 gap-4'>
              <span className='text-lg tracking-tight'>{item.data?.name}</span>
            </div>
          </div>
        ))
      }}
      selectionMode='single'
      variant='flat'>
      {(method) => (
        <SelectItem key={method.id} textValue={method.name} className=''>
          <div className='flex gap-6 items-center p-2'>
            <Icon name={method.icon} className='size-10' />
            <div className='flex flex-col w-full space-y-0.5'>
              <div className='flex items-center justify-between w-full'>
                <div className='text-lg tracking-tight font-medium '>
                  {method.name}
                </div>
                <div
                  className={cn(
                    'text-xs font-light tracking-tight whitespace-nowrap w-fit border border-orange-300/60 rounded-sm px-1',
                    {'border-sky-400/70 ': method.id === 'credit-card'},
                  )}>
                  {method.tag}
                </div>
              </div>
              <span className='text-tiny opacity-70'>{method.description}</span>
            </div>
          </div>
        </SelectItem>
      )}
    </Select>
  )
}
