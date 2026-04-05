import {api} from '@/convex/_generated/api'
import {PaymentMethod} from '@/convex/orders/d'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {ListboxItem as ListBoxItem} from '@heroui/listbox'
import {Label} from '@heroui/react'
import {
  Select,
  type SelectedItemProps,
  type SelectedItems,
} from '@heroui/select'
import type {SharedSelection} from '@heroui/system'
import {useQuery} from 'convex/react'
import {memo, useCallback, useMemo} from 'react'
import {normalizePaymentMethod} from '../../constants'

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

const FALLBACK_METHODS: Record<PaymentMethod, IPaymentMethod> = {
  cards: {
    id: 'cards',
    name: 'Cards',
    label: 'Cards',
    icon: 'credit-card-2',
    iconStyle: 'text-cyan-500',
    description: 'Pay with credit or debit card.',
    status: 'active',
  },
  crypto_commerce: {
    id: 'crypto_commerce',
    name: 'Pay with Crypto',
    label: 'Pay with Crypto',
    icon: 'ethereum',
    iconStyle: '',
    description: 'Fast checkout with supported crypto wallets.',
    status: 'active',
  },
  crypto_transfer: {
    id: 'crypto_transfer',
    name: 'Crypto Transfer',
    label: 'Crypto Transfer',
    icon: 'ethereum',
    iconStyle: 'text-ethereum',
    description: 'Manual crypto transfer.',
    status: 'active',
  },
  cash_app: {
    id: 'cash_app',
    name: 'Cash App',
    label: 'Cash App',
    icon: 'cash-fast',
    iconStyle: '',
    description: 'Pay with Cash App.',
    status: 'active',
  },
}

type SelectedValueItem = SelectedItemProps<IPaymentMethod>

// Memoized row for list items to reduce re-renders when dropdown opens (5.5, 6.3)
const PaymentMethodOptionRow = memo(function PaymentMethodOptionRow({
  method,
}: {
  method: IPaymentMethod
}) {
  return (
    <div className='h-14 flex gap-2 md:gap-3 px-2 md:p-2'>
      <Icon name={method.icon} className={cn('shrink-0 size-4 mt-1')} />
      <div className='flex flex-col w-full md:space-y-0.5 h-14'>
        <div className='flex items-center justify-between w-full h-8 md:h-7'>
          <div className='flex items-center space-x-2 whitespace-nowrap text-base md:text-lg tracking-tight font-medium'>
            <span className='dark:text-white text-foreground'>
              {method.label}
            </span>
            {method.id === 'cards' ? (
              <div className='flex items-center space-x-1 text-foreground'>
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
function SelectedValueContent({item}: {item: SelectedValueItem}) {
  const data = item.data ?? undefined
  if (!data) return null
  return (
    <div className='flex items-center justify-between ps-1 text-foreground'>
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
      <div className='flex-1 text-[8px] font-brk uppercase font-normal px-2.5 py-px md:whitespace-nowrap leading-3'>
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

  const methods = useMemo<IPaymentMethod[]>(
    () =>
      ((setting?.methods ?? []) as IPaymentMethod[]).map((method) => ({
        ...method,
        id:
          normalizePaymentMethod(method.id) ??
          normalizePaymentMethod(method.name) ??
          normalizePaymentMethod(method.label) ??
          method.id,
      })),
    [setting],
  )
  const selectedMethod = useMemo(
    () =>
      methods.find((method) => method.id === value) ?? FALLBACK_METHODS[value],
    [methods, value],
  )

  const handleSelectionChange = useCallback(
    (keys: SharedSelection) => {
      if (keys === 'all' || keys.size === 0) return
      const selectedKey = Array.from(keys)[0] as string
      if (!selectedKey) return

      const selectedMethod = methods.find((method) => method.id === selectedKey)
      const paymentMethod =
        selectedMethod?.id ??
        normalizePaymentMethod(selectedKey) ??
        (selectedKey as PaymentMethod)

      onChange(paymentMethod)
    },
    [methods, onChange],
  )

  const selectedKeys = useMemo(() => [value], [value])
  const SELECT_CLASS_NAMES = {
    base: 'w-full bg-background',
    label: 'text-lg font-semibold tracking-tight h-10',
    trigger:
      'min-h-14 mt-2 p-2 md:ps-3 bg-white dark:bg-zinc-500/10 border border-foreground/40 placeholder:text-foreground rounded-md',
    listboxWrapper:
      'border-2 dark:border-foreground/40 rounded-lg outline-none focus-visible:outline-none border-0 border-white/40 w-full',
    listbox: 'outline-none focus-visible:outline-none px-1.5 py-1.5',
    selectorIcon: 'translate-x-2',
    popoverContent: 'w-full bg-black/10 backdrop-blur-xl p-2.5 rounded-xl',
  }
  const renderValue = useCallback(
    (items: SelectedItems<IPaymentMethod>) => {
      if (items.length === 0 && selectedMethod) {
        return (
          <SelectedValueContent
            item={{key: selectedMethod.id, data: selectedMethod}}
          />
        )
      }

      return items.map((item, index) => (
        <SelectedValueContent key={item.key ?? index} item={item} />
      ))
    },
    [selectedMethod],
  )

  return (
    <div className='space-y-2'>
      <Label
        className='text-lg font-normal font-bone mb-2 select-none'
        htmlFor='payment-method'>
        Payment Methods
      </Label>
      <Select<IPaymentMethod>
        id='payment-method'
        classNames={SELECT_CLASS_NAMES}
        selectedKeys={selectedKeys}
        items={methods}
        onSelectionChange={handleSelectionChange}
        placeholder='Select Payment Method'
        renderValue={renderValue}
        selectionMode='single'
        variant='flat'>
        {(method) => (
          <ListBoxItem
            key={method.id}
            textValue={method.name}
            className={cn(' rounded-md', {
              'opacity-50 pointer-events-none': method.status === 'inactive',
            })}
            classNames={{
              wrapper: 'placeholder:text-dark-gray',
              base: 'data-[selected=true]:bg-brand/12 dark:data-[selected=true]:bg-brand gap-0 px-1 py-2',
              selectedIcon: cn(
                'p-0 size-3 mb-7 md:mb-4 mr-2',
                method.iconStyle,
              ),
            }}>
            <PaymentMethodOptionRow method={method} />
          </ListBoxItem>
        )}
      </Select>
    </div>
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
        'text-brand dark:text-white text-[9px] italic uppercase font-semibold tracking-normal opacity-100 mt-1',
        {'text-brand dark:text-brand ': selected},
      )}>
      Fastest
    </span>
  ) : (
    ''
  )
}
