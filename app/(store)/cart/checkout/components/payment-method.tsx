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
      name: 'Crypto',
      label: 'Crypto',
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
  const idToPaymentMethod: Record<
    string,
    'credit_card' | 'crypto' | 'cashapp'
  > = {
    'credit-card': 'credit_card',
    crypto: 'crypto',
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
        label: 'font-semibold tracking-tight',
        trigger:
          'min-h-14 py-2 bg-sky-100 dark:bg-sky-500/10 border border-foreground/40 placeholder:text-foreground',
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
        <SelectItem
          key={method.id}
          textValue={method.name}
          // className=' hover:bg-light-gray/20'
          classNames={{
            wrapper: '',
            base: 'hover:bg-light-gray/20! data-[selected=true]:bg-sky-500/20!',
          }}>
          <div className='flex gap-3 md:gap-6 items-center px-1 py-2 md:p-2'>
            <Icon name={method.icon} className='size-7 md:size-10' />
            <div className='flex flex-col w-full md:space-y-0.5'>
              <div className='flex items-center justify-between w-full'>
                <div className='whitespace-nowrap text-base md:text-lg tracking-tight font-medium '>
                  {method.name}
                </div>
                <div
                  className={cn(
                    'text-[8px] md:text-xs font-light tracking-tight whitespace-nowrap w-fit border border-orange-300/60 rounded-sm px-px py-0 md:px-1 leading-3 md:leading-normal bg-background',
                    {'border-sky-400/70 ': method.id === 'credit-card'},
                  )}>
                  {method.tag}
                </div>
              </div>
              <span className='text-tiny opacity-70 line-clamp-1'>
                {method.description}
              </span>
            </div>
          </div>
        </SelectItem>
      )}
    </Select>
  )
}
