import {api} from '@/convex/_generated/api'
import {PaymentMethod} from '@/convex/orders/d'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Select} from '@base-ui/react'
import {Label} from '@heroui/react'
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
    label: 'Credit/Debit Card',
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

const PaymentMethodOptionRow = memo(function PaymentMethodOptionRow({
  method,
}: {
  method: IPaymentMethod
}) {
  return (
    <div className='h-16 flex gap-2 md:gap-3 px-2 md:p-2 pb-3'>
      <Icon name={method.icon} className={cn('shrink-0 size-4 mt-1')} />
      <div className='flex flex-col w-full md:space-y-0.5'>
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
            )}>
            {method.tag}
          </div>
        </div>
        <span className='text-xs opacity-70 line-clamp-1'>
          {method.description}
        </span>
      </div>
    </div>
  )
})

const SelectedMethodRow = memo(function SelectedMethodRow({
  method,
}: {
  method: IPaymentMethod
}) {
  return (
    <div className='flex items-center justify-between ps-1 text-foreground'>
      <div className='flex items-center w-full gap-2'>
        <Icon
          name={method.icon}
          className={cn('shrink-0 size-5', method.iconStyle)}
        />
        <div className='flex items-center space-x-2'>
          <span className='text-lg whitespace-nowrap tracking-tight'>
            {method.label}
          </span>
          {method.id === 'cards' ? (
            <div className='flex items-center space-x-2'>
              <Icon name='applepay' className='size-10' />
              <Icon name='googlepay' className='size-10' />
            </div>
          ) : null}
          <TxnSpeed method={method.id} selected />
        </div>
      </div>
      {method.tag ? (
        <div className='flex-1 text-[8px] font-brk uppercase font-normal px-2.5 py-px md:whitespace-nowrap leading-3'>
          {method.tag}
        </div>
      ) : null}
    </div>
  )
})

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

  const handleValueChange = useCallback(
    (next: PaymentMethod | null) => {
      if (!next) return
      const method =
        methods.find((m) => m.id === next) ??
        FALLBACK_METHODS[next as PaymentMethod]
      const paymentMethod =
        method?.id ?? normalizePaymentMethod(next) ?? (next as PaymentMethod)
      onChange(paymentMethod)
    },
    [methods, onChange],
  )

  return (
    <div className='space-y-2'>
      <Label
        className='text-lg font-normal font-bone mb-2 select-none'
        htmlFor='payment-method'>
        Payment Methods
      </Label>
      <Select.Root<PaymentMethod>
        id='payment-method'
        value={value}
        onValueChange={handleValueChange}>
        <Select.Trigger className='flex w-full min-h-14 mt-2 items-center justify-between gap-3 rounded-md border border-foreground/40 pr-3 pl-3.5 bg-[canvas] text-gray-900 dark:text-foreground select-none hover:bg-gray-100 dark:hover:bg-white/5 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 data-[popup-open]:bg-gray-100 dark:data-[popup-open]:bg-white/5'>
          <Select.Value placeholder='Select Payment Method'>
            {selectedMethod ? (
              <SelectedMethodRow method={selectedMethod} />
            ) : (
              <span className='opacity-60 text-sm'>Select Payment Method</span>
            )}
          </Select.Value>
          <Select.Icon className='flex shrink-0'>
            <Icon name='chevron-down' className='size-3' />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className='outline-hidden select-none z-10'
            sideOffset={8}>
            <Select.Popup className='group min-w-[var(--anchor-width)] origin-[var(--transform-origin)] bg-clip-padding rounded-md bg-background text-foreground shadow-lg outline outline-1 outline-foreground/20 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0'>
              <Select.List className='relative py-1 overflow-y-auto max-h-[var(--available-height)]'>
                {methods.map((method) => (
                  <Select.Item
                    key={method.id}
                    value={method.id}
                    label={method.label}
                    disabled={method.status === 'inactive'}
                    className={cn(
                      'cursor-default outline-none rounded-sm data-[highlighted]:bg-foreground/10 data-[disabled]:opacity-50 data-[disabled]:pointer-events-none',
                    )}>
                    <PaymentMethodOptionRow method={method} />
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
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
        {'text-brand dark:text-brand': selected},
      )}>
      Fastest
    </span>
  ) : null
}
