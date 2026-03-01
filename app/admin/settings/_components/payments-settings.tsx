'use client'

import {SectionHeader} from '@/components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Icon, type IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Switch} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {
  startTransition,
  useCallback,
  useMemo,
  useState,
  ViewTransition,
} from 'react'

export type PaymentMethodStatus = 'active' | 'inactive'

export interface PaymentMethodRow {
  id: string
  name: string
  label: string
  icon: IconName
  description: string
  status: PaymentMethodStatus
}

export const PaymentsSettings = () => {
  const {user} = useAuthCtx()
  const setting = useQuery(api.admin.q.getAdminByIdentStrict, {
    identifier: 'payment_methods',
  })
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const paymentMethods = useMemo(() => {
    const methods = ((setting && setting)?.methods as PaymentMethodRow[]) ?? []
    if (methods && methods.length > 0) {
      return methods.map((m) => ({
        id: m.id,
        name: m.name ?? m.label ?? m.id,
        label: m.label ?? m.name ?? m.id,
        icon: (m.icon ?? 'credit-card') as IconName,
        description: m.description ?? '',
        status:
          m.status === 'active' || m.status === 'inactive'
            ? m.status
            : 'inactive',
      }))
    }
    return []
  }, [setting])

  const handleToggle = useCallback(
    (methodId: string, nextStatus: PaymentMethodStatus) => {
      setTogglingId(methodId)
      const nextMethods: PaymentMethodRow[] = paymentMethods.map((m) =>
        m.id === methodId ? {...m, status: nextStatus} : m,
      )
      startTransition(() => {
        updateAdmin({
          identifier: 'payment_methods',
          value: {methods: nextMethods},
          uid: user?.uid ?? 'anonymous',
        })
          .then(() => setTogglingId(null))
          .catch(() => setTogglingId(null))
      })
    },
    [paymentMethods, updateAdmin, user?.uid],
  )

  return (
    <div className='flex w-full flex-col gap-4'>
      <SectionHeader title='Payments Methods' />

      <section className='space-y-3 w-md'>
        <ul className='flex flex-col gap-1 rounded-3xl' role='list'>
          {paymentMethods.map((method) => (
            <ViewTransition key={method.id}>
              <li
                className={cn(
                  'flex items-center gap-4 rounded-2xl border border-border/50 bg-default-100/50 px-4 py-3 transition-colors dark:bg-default-100/30',
                  'hover:border-border/80 dark:hover:border-border/60',
                )}
                role='listitem'>
                <div
                  className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground/10 dark:bg-foreground/15'
                  aria-hidden>
                  <Icon
                    name={method.icon}
                    className='size-5 text-foreground/80'
                    aria-hidden
                  />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='font-okxs font-medium text-foreground'>
                    {method.name}
                  </div>
                  {method.description && (
                    <div className='font-okxs text-xs text-foreground/60'>
                      {method.description}
                    </div>
                  )}
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <span
                    className={cn(
                      'font-okxs text-xs tabular-nums',
                      method.status === 'active'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-foreground/50',
                    )}
                    aria-hidden>
                    {method.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                  <Switch
                    size='sm'
                    isSelected={method.status === 'active'}
                    isDisabled={togglingId === method.id}
                    onValueChange={(checked) =>
                      handleToggle(method.id, checked ? 'active' : 'inactive')
                    }
                    color={method.status === 'active' ? 'success' : 'default'}
                    classNames={{
                      base: 'shrink-0',
                      wrapper:
                        'group-data-[selected=true]:bg-emerald-500 dark:group-data-[selected=true]:bg-emerald-500',
                    }}
                    aria-label={`Toggle ${method.name} to ${method.status === 'active' ? 'inactive' : 'active'}`}
                  />
                </div>
              </li>
            </ViewTransition>
          ))}
        </ul>
      </section>
    </div>
  )
}
