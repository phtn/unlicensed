'use client'

import {SectionHeader} from '@/components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Icon, type IconName} from '@/lib/icons'
import type {GatewayId} from '@/lib/paygate/config'
import {cn} from '@/lib/utils'
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Divider,
  Input,
  Switch,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ViewTransition,
} from 'react'
import {commonInputClassNames} from '../../_components/ui/fields'

const GATEWAYS: {
  id: GatewayId
  label: string
  apiDefault: string
  checkoutDefault: string
}[] = [
  {
    id: 'paygate',
    label: 'PayGate',
    apiDefault: 'https://api.paygate.to',
    checkoutDefault: 'https://checkout.paygate.to',
  },
  {
    id: 'paylex',
    label: 'Paylex',
    apiDefault: 'https://api.paylex.to',
    checkoutDefault: 'https://checkout.paylex.to',
  },
  {
    id: 'rampex',
    label: 'Rampex',
    apiDefault: 'https://api.rampex.to',
    checkoutDefault: 'https://checkout.rampex.to',
  },
]

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
  const adminSettings = useQuery(api.admin.q.getAdminSettings)
  const updateConfigs = useMutation(api.admin.m.updatePaymentGatewayConfigs)
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [gatewayValues, setGatewayValues] = useState<
    Record<GatewayId, {apiUrl: string; checkoutUrl: string}>
  >({
    paygate: {apiUrl: '', checkoutUrl: ''},
    paylex: {apiUrl: '', checkoutUrl: ''},
    rampex: {apiUrl: '', checkoutUrl: ''},
  })
  const [defaultGateway, setDefaultGateway] = useState<GatewayId>('paygate')
  const [gatewaySaving, setGatewaySaving] = useState(false)
  const [gatewaySaveStatus, setGatewaySaveStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')
  const gatewaySaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!adminSettings?.value) return
    const v = adminSettings.value as Record<string, unknown>
    const next: Record<GatewayId, {apiUrl: string; checkoutUrl: string}> = {
      paygate: {apiUrl: '', checkoutUrl: ''},
      paylex: {apiUrl: '', checkoutUrl: ''},
      rampex: {apiUrl: '', checkoutUrl: ''},
    }
    for (const g of GATEWAYS) {
      const r = v[g.id]
      if (r && typeof r === 'object' && !Array.isArray(r)) {
        const rec = r as Record<string, unknown>
        next[g.id] = {
          apiUrl: (typeof rec.apiUrl === 'string' ? rec.apiUrl : '') || '',
          checkoutUrl:
            (typeof rec.checkoutUrl === 'string' ? rec.checkoutUrl : '') || '',
        }
      }
    }
    setGatewayValues(next)
    const dg = v.defaultGateway
    if (dg === 'paygate' || dg === 'paylex' || dg === 'rampex') {
      setDefaultGateway(dg)
    }
  }, [adminSettings])

  const handleGatewayDefaultChange = useCallback(
    (id: GatewayId, checked: boolean) => {
      if (checked) setDefaultGateway(id)
    },
    [],
  )

  const handleGatewaySave = useCallback(async () => {
    setGatewaySaving(true)
    setGatewaySaveStatus('idle')
    try {
      await updateConfigs({
        configs: {
          paygate: {
            apiUrl: gatewayValues.paygate.apiUrl || undefined,
            checkoutUrl: gatewayValues.paygate.checkoutUrl || undefined,
          },
          paylex: {
            apiUrl: gatewayValues.paylex.apiUrl || undefined,
            checkoutUrl: gatewayValues.paylex.checkoutUrl || undefined,
          },
          rampex: {
            apiUrl: gatewayValues.rampex.apiUrl || undefined,
            checkoutUrl: gatewayValues.rampex.checkoutUrl || undefined,
          },
          defaultGateway,
        },
      })
      setGatewaySaveStatus('success')
      if (gatewaySaveRef.current) clearTimeout(gatewaySaveRef.current)
      gatewaySaveRef.current = setTimeout(
        () => setGatewaySaveStatus('idle'),
        3000,
      )
    } catch {
      setGatewaySaveStatus('error')
      if (gatewaySaveRef.current) clearTimeout(gatewaySaveRef.current)
      gatewaySaveRef.current = setTimeout(
        () => setGatewaySaveStatus('idle'),
        3000,
      )
    } finally {
      setGatewaySaving(false)
    }
  }, [updateConfigs, gatewayValues, defaultGateway])

  useEffect(
    () => () => {
      if (gatewaySaveRef.current) clearTimeout(gatewaySaveRef.current)
    },
    [],
  )

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

      <Divider />
      <SectionHeader
        title='Payment Gateways'
        description='Optional. Leave empty to use env vars or defaults. Used for card
                  checkout. Select the default gateway for card payments.'>
        <Button
          size='sm'
          color='primary'
          onPress={handleGatewaySave}
          className='bg-dark-table dark:bg-white dark:text-dark-table'
          isLoading={gatewaySaving}>
          Save Changes
        </Button>
      </SectionHeader>
      <Card radius='sm' shadow='none' className='w-full max-w-2xl'>
        <CardBody className='space-y-4 px-4'>
          <p className='text-xs text-default-500'></p>
          <Divider />
          {GATEWAYS.map((g) => (
            <div key={g.id} className='space-y-2'>
              <div className='flex items-center gap-3'>
                <Checkbox
                  isSelected={defaultGateway === g.id}
                  onValueChange={(checked) =>
                    handleGatewayDefaultChange(g.id, !!checked)
                  }
                  aria-label={`Default gateway: ${g.label}`}>
                  <span className='text-sm font-medium'>{g.label}</span>
                </Checkbox>
                {defaultGateway === g.id && (
                  <Chip size='sm' color='primary' className='uppercase'>
                    Default
                  </Chip>
                )}
              </div>
              <div className='grid grid-cols-1 gap-2 pl-6 sm:grid-cols-2'>
                <Input
                  size='sm'
                  label='API URL'
                  placeholder={g.apiDefault}
                  classNames={commonInputClassNames}
                  value={gatewayValues[g.id].apiUrl}
                  onValueChange={(s) =>
                    setGatewayValues((prev) => ({
                      ...prev,
                      [g.id]: {...prev[g.id], apiUrl: s},
                    }))
                  }
                />
                <Input
                  size='sm'
                  label='Checkout URL'
                  placeholder={g.checkoutDefault}
                  classNames={commonInputClassNames}
                  value={gatewayValues[g.id].checkoutUrl}
                  onValueChange={(s) =>
                    setGatewayValues((prev) => ({
                      ...prev,
                      [g.id]: {...prev[g.id], checkoutUrl: s},
                    }))
                  }
                />
              </div>
            </div>
          ))}
          <div className='flex items-center gap-2'>
            {gatewaySaveStatus === 'success' && (
              <span className='text-sm text-success'>Saved</span>
            )}
            {gatewaySaveStatus === 'error' && (
              <span className='text-sm text-danger'>Failed to save</span>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
