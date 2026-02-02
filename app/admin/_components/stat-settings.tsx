'use client'

import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {Card, Switch} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {useEffect, useRef} from 'react'
import {SectionHeader} from './ui/section-header'

const STAT_COLORS: Record<string, string> = {
  salesToday: '#06b6d4',
  salesThisWeek: '#06b6d4',
  salesThisMonth: '#06b6d4',
  totalRevenue: '#10b981',
  pendingOrders: '#ff6800',
  cancelledOrders: '#ef4444',
  deliveries: '#3b82f6',
  totalUsers: '#8b5cf6',
  totalProducts: '#f59e0b',
  averageOrderValue: '#ec4899',
}

type StatConfig = {
  id: string
  label: string
  visible: boolean
  order: number
}

type AdminStats = {
  salesTodayCents: number
  salesThisWeekCents: number
  salesThisMonthCents: number
  totalRevenueCents: number
  pendingOrdersCount: number
  cancelledOrdersCount: number
  ongoingDeliveriesCount: number
  deliveredOrdersCount: number
  totalOrdersCount: number
  totalUsersCount: number
  totalProductsCount: number
  averageOrderValueCents: number
}

type MiniStatCardProps = {
  config: StatConfig
  stats: AdminStats
  chartData: {
    salesData?: Array<{value: number}>
    ordersData?: Array<{value: number}>
    deliveriesData?: Array<{value: number}>
    aovData?: Array<{value: number}>
  }
  onToggle: (statId: string, visible: boolean) => void
}

const MiniStatCard = ({config, onToggle}: MiniStatCardProps) => {
  const color = STAT_COLORS[config.id] || '#6b7280'

  return (
    <Card
      shadow='sm'
      isPressable
      disableRipple
      onPress={() => onToggle(config.id, !config.visible)}
      className={`relative p-4 min-w-0 transition-all cursor-pointer hover:bg-sidebar/60 ${
        config.visible
          ? 'opacity-100 border-2 border-neutral-700'
          : 'opacity-50 border-2 border-transparent'
      }`}>
      {/* Toggle overlay */}
      <div
        className='absolute top-4 right-3 z-10'
        onClick={(e) => e.stopPropagation()}>
        <Switch
          size='md'
          isSelected={config.visible}
          onValueChange={(value) => onToggle(config.id, value)}
          classNames={{
            base: 'bg-transparent',
            wrapper: 'bg-light-gray',
          }}
        />
      </div>

      {/* Mini stat card content */}
      <div className='pr-12'>
        <div className='flex items-center space-x-2'>
          <div
            className='w-1 h-6 rounded-full'
            style={{backgroundColor: color}}
          />
          <p className='text-lg font-polysans font-light'>{config.label}</p>
        </div>
      </div>
    </Card>
  )
}

export const StatSettings = () => {
  const statConfigs = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: 'statConfigs',
  })
  const adminStats = useQuery(api.orders.q.getAdminStats)
  const chartData = useQuery(api.orders.q.getAdminChartData)
  const updateStatVisibility = useMutation(api.admin.m.updateStatVisibility)
  const ensureStatConfigsSeeded = useMutation(
    api.admin.m.ensureStatConfigsSeeded,
  )

  const handleToggleVisibility = async (statId: string, visible: boolean) => {
    await updateStatVisibility({statId, visible})
  }

  const defaultStats: AdminStats = {
    salesTodayCents: 0,
    salesThisWeekCents: 0,
    salesThisMonthCents: 0,
    totalRevenueCents: 0,
    pendingOrdersCount: 0,
    cancelledOrdersCount: 0,
    ongoingDeliveriesCount: 0,
    deliveredOrdersCount: 0,
    totalOrdersCount: 0,
    totalUsersCount: 0,
    totalProductsCount: 0,
    averageOrderValueCents: 0,
  }

  const stats = adminStats ?? defaultStats
  const chartDataWithDefaults = {
    salesData: chartData?.salesData,
    ordersData: chartData?.ordersData,
    deliveriesData: chartData?.deliveriesData,
    aovData: chartData?.aovData,
  }

  // Auto-seed statConfigs if they don't exist in the database
  // The query returns defaults if nothing exists, but we need to persist them
  const hasSeededRef = useRef(false)
  useEffect(() => {
    // Check if statConfigs are in-memory defaults (createdBy === 'dev-admin')
    // This indicates they're not persisted in the database yet
    const needsSeeding =
      statConfigs !== undefined &&
      statConfigs !== null &&
      statConfigs.createdBy === 'dev-admin'

    if (needsSeeding && !hasSeededRef.current) {
      hasSeededRef.current = true
      let timeoutId: ReturnType<typeof setTimeout> | null = null
      ensureStatConfigsSeeded()
        .then(() => {
          // Reset after a delay to allow query to update
          timeoutId = setTimeout(() => {
            hasSeededRef.current = false
          }, 2000)
        })
        .catch((error) => {
          console.error('Failed to seed statConfigs:', error)
          hasSeededRef.current = false // Reset on error so we can retry
        })

      return () => {
        if (timeoutId !== null) clearTimeout(timeoutId)
      }
    }
  }, [statConfigs, ensureStatConfigsSeeded])

  if (!statConfigs) {
    return <div className='text-sm text-gray-400'>Loading settings...</div>
  }

  const configs = (statConfigs.value?.statConfigs as Array<StatConfig>) ?? []
  const sortedConfigs = [...configs].sort((a, b) => a.order - b.order)

  return (
    <Card
      radius='none'
      shadow='none'
      className='p-4 sm:p-6 border-t border-sidebar'>
      <div className='space-y-4'>
        <SectionHeader
          title='Dashboard Stats'
          description='Configure which statistics are visible on your dashboard'>
          <Link href='/admin/ops'>
            <Icon name='x' className='opacity-70 hover:opacity-90' />
          </Link>
        </SectionHeader>

        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
          {sortedConfigs.map((config) => (
            <MiniStatCard
              key={config.id}
              config={config}
              stats={stats}
              chartData={chartDataWithDefaults}
              onToggle={handleToggleVisibility}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
