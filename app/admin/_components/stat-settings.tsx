'use client'

import {useMutation, useQuery} from 'convex/react'
import {api} from '@/convex/_generated/api'
import {Card, Switch} from '@heroui/react'

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
      onPress={() => onToggle(config.id, !config.visible)}
      className={`relative p-4 min-w-0 transition-all cursor-pointer hover:bg-neutral-900/60 ${
        config.visible
          ? 'opacity-100 border-2 border-transparent'
          : 'opacity-50 border-2 border-neutral-700'
      }`}>
      {/* Toggle overlay */}
      <div className='absolute top-3 right-3 z-10' onClick={(e) => e.stopPropagation()}>
        <Switch
          isSelected={config.visible}
          onValueChange={(value) => onToggle(config.id, value)}
          size='sm'
          classNames={{
            base: 'bg-transparent',
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
          <p className='text-lg font-semibold font-space'>
            {config.label}
          </p>
        </div>
      </div>
    </Card>
  )
}

export const StatSettings = () => {
  const adminSettings = useQuery(api.admin.q.getAdminSettings)
  const adminStats = useQuery(api.orders.q.getAdminStats)
  const chartData = useQuery(api.orders.q.getAdminChartData)
  const updateStatVisibility = useMutation(api.admin.m.updateStatVisibility)

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

  if (!adminSettings) {
    return <div className='text-sm text-gray-400'>Loading settings...</div>
  }

  const sortedConfigs = [...adminSettings.statConfigs].sort(
    (a, b) => a.order - b.order,
  )

  return (
    <Card className='p-4 sm:p-6'>
      <div className='space-y-4'>
        <div>
          <h3 className='text-lg font-semibold font-space'>Dashboard Stats</h3>
          <p className='text-sm text-gray-400 mt-1'>
            Configure which statistics are visible on your dashboard
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
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
