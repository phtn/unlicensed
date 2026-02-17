import {api} from '@/convex/_generated/api'
import {
  PaymentMethod,
  PaymentMethod as PaymentMethodType,
} from '@/convex/orders/d'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Select, SelectItem, SelectProps} from '@heroui/react'
import {useQuery} from 'convex/react'
import React, {memo, useCallback, useMemo} from 'react'

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

// Hoist to module scope to avoid recreation on every render (5.5, 7.2)
const ID_TO_PAYMENT_METHOD: Record<string, PaymentMethodType> = {
  card: 'cards',
  crypto: 'crypto_commerce',
  'cash-app': 'cash_app',
}

const VALUE_TO_KEY: Record<PaymentMethod, string> = {
  cards: 'card',
  crypto_commerce: 'crypto',
  crypto_transfer: 'crypto_transfer',
  cash_app: 'cash-app',
}

const SELECT_CLASS_NAMES = {
  base: 'w-full',
  label: 'text-lg font-semibold tracking-tight',
  trigger:
    'min-h-14 p-2 md:ps-3 bg-white dark:bg-zinc-500/10 border border-foreground/40 placeholder:text-foreground',
  listboxWrapper:
    'border-[0.5px] dark:border-foreground/40 rounded-xl outline-none focus-visible:outline-none px-0',
  listbox: 'outline-none focus-visible:outline-none px-1.5',
  selectorIcon: 'translate-x-2',
} as SelectProps['classNames']

// Memoized row for list items to reduce re-renders when dropdown opens (5.5, 6.3)
const PaymentMethodOptionRow = memo(function PaymentMethodOptionRow({
  method,
}: {
  method: IPaymentMethod
}) {
  return (
    <div className='h-14 flex gap-2 md:gap-3 md:p-2'>
      <Icon name={method.icon} className={cn('shrink-0 size-4 mt-1')} />
      <div className='flex flex-col w-full md:space-y-0.5 h-14'>
        <div className='flex items-center justify-between w-full h-8 md:h-7'>
          <div className='flex items-center space-x-2 whitespace-nowrap text-base md:text-lg tracking-tight font-medium '>
            <span>{method.label}</span>
            {method.id === 'cards' ? (
              <div className='flex items-center space-x-1'>
                <Icon name='applepay' className='size-10' />
                <Icon name='googlepay' className='size-10' />
              </div>
            ) : null}
            <TxnSpeed method={method.id} />
          </div>
          <div
            className={cn(
              'text-[8px] uppercase font-brk w-fit px-1 py-0 md:px-1 leading-3 md:leading-normal dark:text-white text-right',
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
  )
})

// Stable render for selected value in trigger (avoids inline object/array creation)
function SelectedValueContent({
  item,
}: {
  item: {key?: React.Key; data?: IPaymentMethod | null}
}) {
  const data = item.data
  if (!data) return null
  return (
    <div className='flex items-center justify-between ps-1'>
      <div className='flex items-center w-full gap-2'>
        {data.icon ? (
          <Icon
            name={data.icon}
            className={cn('shrink-0 size-5', data.iconStyle)}
          />
        ) : null}
        <div className='flex flex-col pl-0.5 gap-4'>
          <div className='flex items-center space-x-2'>
            <span className='text-lg whitespace-nowrap tracking-tight'>
              {data.label}
            </span>
            {data.id === 'cards' ? (
              <div className='flex items-center space-x-2'>
                <Icon name='applepay' className='size-10' />
                <Icon name='googlepay' className='size-10' />
              </div>
            ) : null}
            <TxnSpeed method={data.id} selected />
          </div>
        </div>
      </div>
      <div className='flex-1 text-[8px] font-brk uppercase font-normal px-1.5 py-px md:whitespace-nowrap leading-3'>
        {data.tag}
      </div>
    </div>
  )
}

export const PaymentMethods = memo(function PaymentMethods({
  value,
  onChange,
}: PaymentMethodProps) {
  const setting = useQuery(api.admin.q.getAdminByIdentStrict, {
    identifier: 'payment_methods',
  })

  const methods = useMemo(
    () => (setting?.methods ?? []) as IPaymentMethod[],
    [setting],
  )

  const handleSelectionChange = useCallback(
    (keys: 'all' | Set<React.Key>) => {
      if (keys === 'all' || keys.size === 0) return
      const selectedKey = Array.from(keys)[0] as string
      if (selectedKey) {
        const paymentMethod =
          ID_TO_PAYMENT_METHOD[selectedKey] ?? (selectedKey as PaymentMethod)
        onChange(paymentMethod)
      }
    },
    [onChange],
  )

  const selectedKey = VALUE_TO_KEY[value] ?? value

  const selectedKeys = useMemo(() => {
    const key = methods.some((m) => m.id === value) ? value : selectedKey
    return key ? [key] : []
  }, [value, selectedKey, methods])

  const renderValue = useCallback(
    (items: Array<{key?: React.Key; data?: IPaymentMethod | null}>) => {
      return items.map((item, index) => (
        <SelectedValueContent key={item.key ?? index} item={item} />
      ))
    },
    [],
  )

  return (
    <Select
      classNames={SELECT_CLASS_NAMES}
      selectedKeys={selectedKeys}
      isMultiline={true}
      multiple={false}
      items={methods}
      label='Payment Method'
      labelPlacement='outside'
      onSelectionChange={handleSelectionChange}
      placeholder='Select Payment Method'
      renderValue={renderValue}
      selectionMode='single'
      selectorIcon={<Icon name='selector' />}
      variant='flat'
      disableAnimation>
      {(method) => (
        <SelectItem
          key={method.id}
          textValue={method.name}
          className={cn({
            'opacity-50 pointer-events-none': method.status === 'inactive',
          })}
          classNames={{
            wrapper: 'placeholder:text-dark-gray',
            base: 'data-[selected=true]:bg-brand/12 dark:data-[selected=true]:bg-brand gap-0 px-1 py-2',
            selectedIcon: 'p-0 size-2 mb-7 md:mb-4',
          }}>
          <PaymentMethodOptionRow method={method} />
        </SelectItem>
      )}
    </Select>
  )
})

interface TxnSpeedProps {
  method: PaymentMethod
  selected?: boolean
}

const TxnSpeed = ({method, selected = false}: TxnSpeedProps) => {
  return method === 'crypto_commerce' ? (
    <span
      className={cn(
        'text-brand dark:text-white text-[7px] italic uppercase font-medium tracking-normal',
        {'text-brand dark:text-brand': selected},
      )}>
      Fastest
    </span>
  ) : (
    ''
  )
}
