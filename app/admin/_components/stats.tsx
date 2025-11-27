import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, cn, Progress} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'
import MiniChart from './mini-chart'

const generateData = () =>
  Array.from({length: 20}, () => ({
    value: 0,
  }))

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

type StatsProps = {
  stats: AdminStats
  salesData?: Array<{value: number}>
  ordersData?: Array<{value: number}>
  deliveriesData?: Array<{value: number}>
  aovData?: Array<{value: number}>
  fullTable: boolean
}

type StatCardProps = {
  config: StatConfig
  stats: AdminStats
  chartData?: Array<{value: number}>
  color: string
}

const StatCard = ({config, stats, chartData, color}: StatCardProps) => {
  const getStatValue = (
    statId: string,
  ): {value: string | number; subtitle?: string} => {
    switch (statId) {
      case 'salesToday':
        return {value: `$${formatPrice(stats.salesTodayCents)}`}
      case 'salesThisWeek':
        return {value: `$${formatPrice(stats.salesThisWeekCents)}`}
      case 'salesThisMonth':
        return {value: `$${formatPrice(stats.salesThisMonthCents)}`}
      case 'totalRevenue':
        return {value: `$${formatPrice(stats.totalRevenueCents)}`}
      case 'pendingOrders':
        return {value: stats.pendingOrdersCount}
      case 'cancelledOrders':
        return {value: stats.cancelledOrdersCount}
      case 'deliveries':
        return {
          value: stats.deliveredOrdersCount,
          subtitle: `/ ${stats.totalOrdersCount} Delivered`,
        }
      case 'totalUsers':
        return {value: stats.totalUsersCount}
      case 'totalProducts':
        return {value: stats.totalProductsCount}
      case 'averageOrderValue':
        return {value: `$${formatPrice(stats.averageOrderValueCents)}`}
      default:
        return {value: 0}
    }
  }

  const getChartData = (statId: string): Array<{value: number}> => {
    switch (statId) {
      case 'salesToday':
      case 'salesThisWeek':
      case 'salesThisMonth':
      case 'totalRevenue':
      case 'averageOrderValue':
        return chartData || generateData()
      case 'pendingOrders':
      case 'cancelledOrders':
        return chartData || generateData()
      case 'deliveries':
        return chartData || generateData()
      default:
        return generateData()
    }
  }

  const getExtraContent = (statId: string) => {
    if (statId === 'deliveries') {
      const deliveryProgress =
        stats.totalOrdersCount > 0
          ? Math.round(
              (stats.deliveredOrdersCount / stats.totalOrdersCount) * 100,
            )
          : 0
      return (
        <div className='mt-8 h-1 rounded-full overflow-hidden'>
          <Progress value={deliveryProgress} />
        </div>
      )
    }
    return null
  }

  const statValue = getStatValue(config.id)
  const cardChartData = getChartData(config.id)
  const extraContent = getExtraContent(config.id)

  return (
    <Card
      shadow='sm'
      className='p-3 sm:p-4 md:p-5 min-w-0 dark:bg-dark-table/20'>
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center space-x-2 p-1 rounded-lg'>
          <div
            className='w-1 h-4 rounded-full'
            style={{backgroundColor: color}}
          />
          <p className='text-base font-medium'>{config.label}</p>
        </div>
        {config.id === 'deliveries' ? (
          <div className='font-space text-sm space-x-2'>
            <span className='opacity-60'>Ongoing</span>
            <span>{stats.ongoingDeliveriesCount}</span>
          </div>
        ) : (
          <Button isIconOnly variant='light' size='sm'>
            <Icon
              name='chevron-right'
              className='size-5 opacity-60 hover:opacity-100'
            />
          </Button>
        )}
      </div>
      <div className='space-y-1'>
        <div className='flex items-baseline gap-2'>
          <span className='md:text-3xl font-bold tracking-tight font-geist-sans'>
            {statValue.value}
          </span>
          {statValue.subtitle && (
            <span className='text-sm text-gray-400'>{statValue.subtitle}</span>
          )}
        </div>
        {config.id === 'deliveries' && (
          <p className='text-sm text-gray-400'></p>
        )}
      </div>
      {extraContent && extraContent}
      {!extraContent && (
        <div className='mt-0 h-12'>
          <MiniChart data={cardChartData} color={color} />
        </div>
      )}
    </Card>
  )
}

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

export const Stats = ({
  stats,
  salesData,
  ordersData,
  deliveriesData,
  aovData,
  fullTable,
}: StatsProps) => {
  const adminSettings = useQuery(api.admin.q.getAdminSettings)
  // const updateStatVisibility = useMutation(api.admin.m.updateStatVisibility)

  const visibleStats = useMemo(() => {
    if (!adminSettings) return []
    return adminSettings.statConfigs
      .filter((config) => config.visible)
      .sort((a, b) => a.order - b.order)
  }, [adminSettings])

  // const handleToggleVisibility = async (statId: string, visible: boolean) => {
  //   await updateStatVisibility({statId, visible})
  // }

  if (!adminSettings) {
    return <div>Loading stats configuration...</div>
  }

  return (
    <div
      className={cn('space-y-6 transition-transform-opacity duration-300', {
        'opacity-0': fullTable,
      })}>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0'>
        {visibleStats.map((config) => {
          let chartData: Array<{value: number}> | undefined
          if (config.id === 'averageOrderValue') {
            chartData = aovData
          } else if (
            config.id === 'salesToday' ||
            config.id === 'salesThisWeek' ||
            config.id === 'salesThisMonth' ||
            config.id === 'totalRevenue'
          ) {
            chartData = salesData
          } else if (
            config.id === 'pendingOrders' ||
            config.id === 'cancelledOrders'
          ) {
            chartData = ordersData
          } else if (config.id === 'deliveries') {
            chartData = deliveriesData
          }

          return (
            <StatCard
              key={config.id}
              config={config}
              stats={stats}
              chartData={chartData}
              color={STAT_COLORS[config.id] || '#6b7280'}
            />
          )
        })}
      </div>
    </div>
  )
}
