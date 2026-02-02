import {api} from '@/convex/_generated/api'
import {
  PaymentMethod,
  PaymentMethod as PaymentMethodType,
} from '@/convex/orders/d'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Select, SelectItem} from '@heroui/react'
import {useQuery} from 'convex/react'
import React, {useMemo} from 'react'

interface IPaymentMethod {
  id: PaymentMethod
  name: string
  label: string
  icon: IconName
  iconStyle: string
  description: string
  status: string
  tag?: string
}

interface PaymentMethodProps {
  value: PaymentMethod
  onChange: (value: PaymentMethod) => void
}

export const PaymentMethods = ({value, onChange}: PaymentMethodProps) => {
  // const methods: Array<IPaymentMethod> = [
  //   {
  //     id: 'cards',
  //     name: 'Credit Card',
  //     label: 'Credit Card',
  //     icon: 'credit-card-2',
  //     iconStyle: 'dark:text-blue-400 text-blue-500',
  //     description: 'Visa, Mastercard, AMEX, every card.',
  //     status: 'inactive',
  //     tag: 'Not Available',
  //   },
  //   {
  //     id: 'crypto_commerce',
  //     name: 'Crypto',
  //     label: 'Crypto',
  //     icon: 'ethereum',
  //     iconStyle: 'dark:text-indigo-400 text-indigo-500',
  //     description: 'BTC, ETH, USDC, USDT',
  //     status: 'active',
  //     tag: 'Verification Required',
  //   },
  //   {
  //     id: 'cash_app',
  //     name: 'CashApp',
  //     label: 'CashApp',
  //     icon: 'cashapp',
  //     iconStyle: 'text-cashapp',
  //     description: 'CashApp Account',
  //     status: 'active',
  //     tag: 'Verification Required',
  //   },
  // ]

  const setting = useQuery(api.admin.q.getAdminByIdentStrict, {
    identifier: 'payment_methods',
  })

  const methods = useMemo(
    () => (setting?.methods ?? []) as IPaymentMethod[],
    [setting],
  )

  // Map method IDs to expected payment method values
  const idToPaymentMethod: Record<string, PaymentMethodType> = {
    card: 'cards',
    crypto: 'crypto_commerce',
    'cash-app': 'cash_app',
  }

  const handleSelectionChange = (keys: 'all' | Set<React.Key>) => {
    if (keys === 'all' || keys.size === 0) return
    const selectedKey = Array.from(keys)[0] as string
    if (selectedKey) {
      const paymentMethod = idToPaymentMethod[selectedKey] ?? (selectedKey as PaymentMethod)
      onChange(paymentMethod)
    }
  }

  // Selected key: API method.id may match PaymentMethod (e.g. crypto_commerce) or use short form (crypto, card, cash-app)
  const selectedKey = useMemo(() => {
    const reverse: Record<PaymentMethod, string> = {
      cards: 'card',
      crypto_commerce: 'crypto',
      crypto_transfer: 'crypto_transfer',
      cash_app: 'cash-app',
    }
    return reverse[value] ?? value
  }, [value])

  const selectedKeys = useMemo(() => {
    const key = methods.some((m) => m.id === value) ? value : selectedKey
    return key ? [key] : []
  }, [value, selectedKey, methods])

  return (
    <Select
      classNames={{
        base: 'w-full',
        label: 'text-lg font-semibold tracking-tight',
        trigger:
          'min-h-14 py-2 bg-sky-100 dark:bg-zinc-500/10 border border-foreground/40 placeholder:text-foreground',
        listboxWrapper: 'border dark:border-foreground/40 rounded-2xl',
        listbox: 'border-b',
      }}
      selectedKeys={selectedKeys}
      isMultiline={true}
      multiple={false}
      items={methods}
      label='Payment Method'
      labelPlacement='outside'
      onSelectionChange={handleSelectionChange}
      placeholder='Select Payment Method'
      renderValue={(items) => {
        return items.map((item) => (
          <div
            key={item.key}
            className='flex items-center justify-between px-1'>
            <div className='flex items-center w-full gap-2'>
              {item.data?.icon && (
                <Icon
                  name={item.data?.icon}
                  className={cn('shrink-0 size-6', item.data?.iconStyle)}
                />
              )}
              <div className='flex flex-col px-1 gap-4'>
                <span className='text-lg tracking-tight'>
                  {item.data?.name}
                </span>
              </div>
            </div>
            <div className='flex-1 text-[8px] font-brk whitespace-nowrap uppercase font-normal px-1.5 py-px md:whitespace-nowrap'>
              {item.data?.tag}
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
          className={cn({
            'opacity-50 pointer-events-none': method.status === 'inactive',
          })}
          classNames={{
            wrapper: '',
            base: 'hover:bg-light-gray/20! data-[selected=true]:bg-zinc-500/20!',
          }}>
          <div className='flex gap-3 md:gap-6 items-center px-1 py-2 md:p-2'>
            <Icon
              name={method.icon}
              className={cn('shrink-0 size-6', 'opacity-80')}
            />
            <div className='flex flex-col w-full md:space-y-0.5'>
              <div className='flex items-center justify-between w-full'>
                <div className='whitespace-nowrap text-base md:text-lg tracking-tight font-medium '>
                  {method.name}
                </div>
                <div
                  className={cn(
                    'text-[8px] uppercase font-brk whitespace-nowrap w-fit px-1 py-0 md:px-1 leading-3 md:leading-normal text-white',
                    {'': method.id === 'cards'},
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
