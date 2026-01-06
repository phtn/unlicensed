import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, cn, Progress} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {useEffect, useMemo, useRef} from 'react'
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
  onVisibleStatsChange?: (count: number) => void
  onStatsHeightChange?: (height: number) => void
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
        return {value: `${formatPrice(stats.salesTodayCents)}`}
      case 'salesThisWeek':
        return {value: `${formatPrice(stats.salesThisWeekCents)}`}
      case 'salesThisMonth':
        return {value: `${formatPrice(stats.salesThisMonthCents)}`}
      case 'totalRevenue':
        return {value: `${formatPrice(stats.totalRevenueCents)}`}
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
        return {value: `${formatPrice(stats.averageOrderValueCents)}`}
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
        <div className='h-0.5 md:h-1 rounded-full overflow-hidden'>
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
      shadow='none'
      radius='sm'
      className='border border-foreground/20 dark:border-foreground/10 p-2 sm:p-3 md:p-4 lg:p-5 min-w-0 dark:bg-dark-table/20 bg-sidebar/20'>
      {/* Mobile: Label left, Value right */}
      <div className='flex items-center justify-between md:hidden'>
        <div className='flex items-center space-x-1.5 p-0.5 md:rounded-lg'>
          <div
            className='w-0.5 h-3 rounded-full'
            style={{backgroundColor: color}}
          />
          <p className='text-xs font-medium opacity-80 font-polysans'>
            {config.label}
          </p>
        </div>
        <div className='flex items-baseline gap-1'>
          <span className='text-lg font-bold tracking-tight font-geist-sans'>
            {statValue.value}
          </span>
          {statValue.subtitle && (
            <span className='text-xs opacity-60'>{statValue.subtitle}</span>
          )}
        </div>
      </div>

      {/* Desktop: Label on top, Value below */}
      <div className='hidden md:block'>
        <div className='flex items-start justify-between mb-3'>
          <div className='flex items-center space-x-2 p-1 rounded-lg'>
            <div
              className='w-1 h-4 rounded-full'
              style={{backgroundColor: color}}
            />
            <p className='text-sm lg:text-base font-medium font-polysans opacity-80'>
              {config.label}
            </p>
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
            <span className='text-2xl lg:text-2xl font-semibold tracking-tight font-space'>
              {statValue.value}
            </span>
            {statValue.subtitle && (
              <span className='text-sm opacity-60'>{statValue.subtitle}</span>
            )}
          </div>
          {config.id === 'deliveries' && <p className='text-sm opacity-60'></p>}
        </div>
      </div>

      {extraContent && <div className='mt-4 md:mt-8'>{extraContent}</div>}
      {!extraContent && (
        <div className='mt-0 h-0 md:h-8 lg:h-12 hidden md:block'>
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
  onVisibleStatsChange,
  onStatsHeightChange,
}: StatsProps) => {
  const statsContainerRef = useRef<HTMLDivElement>(null)
  const statConfigs = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: 'statConfigs',
  })
  const ensureStatConfigsSeeded = useMutation(
    api.admin.m.ensureStatConfigsSeeded,
  )

  // const updateStatVisibility = useMutation(api.admin.m.updateStatVisibility)

  // Auto-seed statConfigs if they don't exist in the database
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
      ensureStatConfigsSeeded()
        .then(() => {
          // Reset after a delay to allow query to update
          setTimeout(() => {
            hasSeededRef.current = false
          }, 2000)
        })
        .catch((error) => {
          console.error('Failed to seed statConfigs:', error)
          hasSeededRef.current = false // Reset on error so we can retry
        })
    }
  }, [statConfigs, ensureStatConfigsSeeded])

  const visibleStats = useMemo(() => {
    if (!statConfigs) return []

    const configs = (statConfigs.value?.statConfigs as StatConfig[]) ?? []
    return configs.filter((config: StatConfig) => config.visible) ?? []
  }, [statConfigs])

  useEffect(() => {
    if (onVisibleStatsChange) {
      onVisibleStatsChange(visibleStats.length)
    }
  }, [visibleStats.length, onVisibleStatsChange])

  // Measure and report stats container height
  useEffect(() => {
    if (!statsContainerRef.current || !onStatsHeightChange) return

    const updateHeight = () => {
      const height = statsContainerRef.current?.offsetHeight ?? 0
      onStatsHeightChange(height)
    }

    // Use ResizeObserver to track height changes
    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(statsContainerRef.current)

    // Initial measurement
    updateHeight()

    return () => {
      resizeObserver.disconnect()
    }
  }, [visibleStats.length, onStatsHeightChange])

  // const handleToggleVisibility = async (statId: string, visible: boolean) => {
  //   await updateStatVisibility({statId, visible})
  // }

  if (!statConfigs) {
    return <div>Loading stats configuration...</div>
  }

  // If no visible stats, show a message (this shouldn't happen with defaults)
  if (visibleStats.length === 0) {
    return (
      <div className='text-sm opacity-60'>
        No stats configured. Please configure stats in the Stats settings page.
      </div>
    )
  }

  return (
    <div
      ref={statsContainerRef}
      className={cn(
        'portrait:mx-4 space-y-2 md:space-y-4 lg:space-y-6 transition-transform-opacity duration-300',
        {
          'opacity-0': fullTable,
        },
      )}>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4 min-w-0'>
        {visibleStats.map((config: StatConfig) => {
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
